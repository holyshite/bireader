import { readFileSync } from 'fs'
import JSZip from 'jszip'

interface EpubChunk {
  id: string
  text: string
  type: 'heading' | 'text' | 'toc'
}

interface TocEntry {
  id: string
  title: string
  level: number
}

interface EpubResult {
  paragraphs: EpubChunk[]
  toc: TocEntry[]
  title: string
}

export async function parseEpub(filePath: string): Promise<EpubResult> {
  const buffer = readFileSync(filePath)
  const zip = await JSZip.loadAsync(buffer)

  // 1. Find rootfile path from container.xml
  const containerFile = zip.file('META-INF/container.xml')
  if (!containerFile) throw new Error('Invalid EPUB: missing container.xml')
  const containerXml = await containerFile.async('string')
  const rootfileMatch = containerXml.match(/full-path\s*=\s*["']([^"']+)["']/)
  if (!rootfileMatch) throw new Error('Invalid EPUB: cannot find rootfile path')

  const rootfilePath = decodeURIComponent(rootfileMatch[1])
  const rootfileDir = rootfilePath.includes('/') ? rootfilePath.split('/').slice(0, -1).join('/') : ''

  // 2. Parse content.opf
  const opfFile = findFile(zip, rootfilePath)
  if (!opfFile) throw new Error('Invalid EPUB: missing content.opf')
  const opfXml = await opfFile.async('string')
  const title = extractTag(opfXml, 'dc:title') || extractTag(opfXml, 'title') || 'Unknown'

  // 3. Build manifest: id → href, also detect nav/cover
  const manifest = new Map<string, string>()
  const manifestProps = new Map<string, string>() // id → properties
  const itemRegex = /<item[^>]*>/g
  let itemMatch: RegExpExecArray | null
  while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
    const tag = itemMatch[0]
    const id = extractAttr(tag, 'id')
    const href = extractAttr(tag, 'href')
    const props = extractAttr(tag, 'properties')
    if (id && href) {
      manifest.set(id, decodeURIComponent(href))
      if (props) manifestProps.set(id, props)
    }
  }

  // 4. Parse spine: get reading order, detect linear="no"
  const spine: { idref: string; linear: boolean }[] = []
  const spineRegex = /<itemref[^>]*>/g
  let spineMatch: RegExpExecArray | null
  while ((spineMatch = spineRegex.exec(opfXml)) !== null) {
    const tag = spineMatch[0]
    const idref = extractAttr(tag, 'idref')
    if (idref) {
      spine.push({ idref, linear: extractAttr(tag, 'linear') !== 'no' })
    }
  }

  // 5. Identify page types: skip (cover etc), tocPage (render compact)
  const skipIds = new Set<string>()
  const tocPageIds = new Set<string>()
  for (const [id, props] of manifestProps) {
    if (props.includes('cover')) skipIds.add(id)
    if (props.includes('nav')) tocPageIds.add(id)
  }
  for (const s of spine) {
    if (!s.linear) skipIds.add(s.idref)
  }
  for (const [id, href] of manifest) {
    const name = href.replace(/^.*[\\/]/, '').toLowerCase()
    if (/^(cover|titlepage|copyright|colophon|dedication)(\.x?html?)?$/.test(name)) {
      skipIds.add(id)
    }
    if (/^(toc|nav)(\.x?html?)?$/.test(name)) {
      tocPageIds.add(id)
    }
  }

  // 6. Parse TocEntries from NCX (EPUB2) or nav document (EPUB3)
  const tocNcxPath = findTocNcx(opfXml, manifest)
  const ncxEntries: { title: string; src: string; level: number }[] = []
  if (tocNcxPath) {
    const ncxFile = resolveAndFind(zip, rootfileDir, tocNcxPath)
    if (ncxFile) {
      const ncxXml = await ncxFile.async('string')
      ncxEntries.push(...parseTocNcx(ncxXml))
    }
  }

  // EPUB3: try nav document if NCX didn't yield results
  if (ncxEntries.length === 0) {
    const navId = [...manifestProps.entries()].find(([, props]) => props.includes('nav'))?.[0]
    if (navId) {
      const navHref = manifest.get(navId)
      if (navHref) {
        const navFile = resolveAndFind(zip, rootfileDir, navHref)
        if (navFile) {
          const navHtml = await navFile.async('string')
          ncxEntries.push(...parseNavXhtml(navHtml))
        }
      }
    }
  }

  // If still no TOC, try any file named "nav" or "toc" in manifest
  if (ncxEntries.length === 0) {
    for (const [, href] of manifest) {
      const name = href.replace(/^.*[\\/]/, '').toLowerCase()
      if (/^(nav|toc)\.(x?html?|xhtml)$/.test(name)) {
        const f = resolveAndFind(zip, rootfileDir, href)
        if (f) {
          const html = await f.async('string')
          const entries = parseNavXhtml(html)
          if (entries.length > 0) {
            ncxEntries.push(...entries)
            break
          }
        }
      }
    }
  }

  // 7. Extract paragraphs from spine, tracking file→firstParagraphId
  const allParagraphs: EpubChunk[] = []
  const fileToFirstPara = new Map<string, string>() // href → first paragraph id
  let paraIndex = 0

  for (const s of spine) {
    if (skipIds.has(s.idref)) continue

    const href = manifest.get(s.idref)
    if (!href) continue

    const htmlFile = resolveAndFind(zip, rootfileDir, href)
    if (!htmlFile) {
      console.warn(`EPUB: file not found for id=${s.idref} href=${href}`)
      continue
    }

    const isTocPage = tocPageIds.has(s.idref)
    const html = await htmlFile.async('string')
    const chunks = extractParagraphs(html, paraIndex)
    if (isTocPage) {
      for (const c of chunks) c.type = 'toc'
    }
    if (chunks.length > 0) {
      if (!fileToFirstPara.has(href)) {
        fileToFirstPara.set(href, chunks[0].id)
      }
      allParagraphs.push(...chunks)
    }
    paraIndex += chunks.length
  }

  // 8. Build TOC: map ncx entries to real paragraph IDs via file reference
  const tocEntries: TocEntry[] = []

  for (const ncx of ncxEntries) {
    const srcFile = ncx.src.replace(/#.*$/, '')
    let targetId = fileToFirstPara.get(srcFile)
    if (!targetId) {
      for (const [file, paraId] of fileToFirstPara) {
        if (file.endsWith(srcFile) || srcFile.endsWith(file)) {
          targetId = paraId
          break
        }
      }
    }
    if (!targetId) {
      const matched = allParagraphs.find(
        p => p.text.startsWith(ncx.title) || ncx.title.startsWith(p.text.slice(0, ncx.title.length))
      )
      if (matched) targetId = matched.id
    }

    tocEntries.push({ id: targetId || `epub-p-0`, title: ncx.title, level: ncx.level })
  }

  // If no NCX TOC, extract from content headings
  if (tocEntries.length === 0) {
    tocEntries.push(...extractTocFromParagraphs(allParagraphs))
  }

  return { paragraphs: allParagraphs, toc: tocEntries, title }
}

function findFile(zip: JSZip, path: string): JSZip.JSZipObject | null {
  const file = zip.file(path)
  if (file) return file
  const lowered = path.toLowerCase()
  for (const name of Object.keys(zip.files)) {
    if (name.toLowerCase() === lowered) return zip.file(name)
  }
  return null
}

function resolveAndFind(zip: JSZip, rootfileDir: string, href: string): JSZip.JSZipObject | null {
  const paths = [
    rootfileDir ? `${rootfileDir}/${href}` : href,
    href,
    href.replace(/^\.\//, '')
  ]
  for (const p of paths) {
    const file = findFile(zip, p)
    if (file) return file
  }
  return null
}

function extractAttr(tag: string, attr: string): string | null {
  const m = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`))
  return m ? m[1] : null
}

function findTocNcx(opfXml: string, manifest: Map<string, string>): string | null {
  const spineTag = opfXml.match(/<spine[^>]*>/)
  const tocId = spineTag ? extractAttr(spineTag[0], 'toc') : null
  if (tocId) {
    const href = manifest.get(tocId)
    if (href) return href
  }
  // Fallback: find ncx file in manifest
  for (const href of manifest.values()) {
    if (href.toLowerCase().endsWith('.ncx')) return href
  }
  return null
}

function parseTocNcx(ncxXml: string): { title: string; src: string; level: number }[] {
  const entries: { title: string; src: string; level: number }[] = []
  const cleanXml = ncxXml.replace(/\s+xmlns(:[a-z]+)?="[^"]*"/g, '')
  parseNavPointsRecursive(cleanXml, entries, 0)
  return entries
}

function parseNavPointsRecursive(xml: string, entries: { title: string; src: string; level: number }[], depth: number) {
  let pos = 0
  const level = Math.min(depth + 1, 3)

  while (pos < xml.length) {
    // Find next <navPoint> tag
    const openIdx = xml.indexOf('<navPoint', pos)
    if (openIdx < 0) break

    // Find the matching </navPoint> using stack-based matching
    const contentStart = xml.indexOf('>', openIdx) + 1
    let nest = 1
    let searchPos = contentStart
    while (nest > 0 && searchPos < xml.length) {
      const nextOpen = xml.indexOf('<navPoint', searchPos)
      const nextClose = xml.indexOf('</navPoint>', searchPos)

      if (nextClose < 0) return // Malformed
      if (nextOpen >= 0 && nextOpen < nextClose) {
        nest++
        searchPos = nextOpen + 9 // len of '<navPoint'
      } else {
        nest--
        if (nest === 0) {
          const block = xml.slice(contentStart, nextClose)
          const textMatch = block.match(/<text>([^<]+)<\/text>/)
          const srcMatch = block.match(/<content[^>]*src="([^"]*)"/)
          if (textMatch) {
            entries.push({
              title: textMatch[1].trim(),
              src: srcMatch ? decodeURIComponent(srcMatch[1]) : '',
              level
            })
          }
          // Recursively parse nested navPoints
          parseNavPointsRecursive(block, entries, depth + 1)
          pos = nextClose + 11 // len of '</navPoint>'
        }
        searchPos = nextClose + 11
      }
    }
    if (nest > 0) break
  }
}

function parseNavXhtml(html: string): { title: string; src: string; level: number }[] {
  const entries: { title: string; src: string; level: number }[] = []
  const navMatch = html.match(/<nav[^>]*(?:epub:type|type)\s*=\s*["']toc["'][^>]*>([\s\S]*?)<\/nav>/i)
  const section = navMatch ? navMatch[1] : html

  // Detect nesting from <ol> levels
  const olDepth = new Map<number, number>()
  let currentDepth = 1

  const linkRegex = /<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let linkMatch: RegExpExecArray | null

  while ((linkMatch = linkRegex.exec(section)) !== null) {
    const href = decodeURIComponent(linkMatch[1])
    const text = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    // Simple depth detection: count <ol> tags before this link
    const before = section.slice(0, linkMatch.index)
    const opens = (before.match(/<ol[^>]*>/gi) || []).length
    const closes = (before.match(/<\/ol>/gi) || []).length
    const depth = Math.max(1, opens - closes + 1)

    if (text && href) {
      entries.push({ title: text, src: href, level: depth })
    }
  }

  return entries
}

function extractParagraphs(html: string, startIndex: number): EpubChunk[] {
  const normalizedHtml = html.replace(/<(\/?)(\w+):(\w+)/g, '<$1$3')

  const bodyMatch = normalizedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  let bodyHtml = bodyMatch ? bodyMatch[1] : normalizedHtml

  bodyHtml = bodyHtml.replace(/<(script|style|head|meta|link)[\s\S]*?<\/\1>/gi, '')
  bodyHtml = bodyHtml.replace(/<(script|style)[^>]*\/>/gi, '')
  bodyHtml = bodyHtml.replace(/<(img|svg|figure)[\s\S]*?(<\/\1>|\/>)/gi, '')

  // Split by block tags, tracking heading tags
  const blockRegex = /<\/?(h[1-6]|p|div|br|section|article|li|blockquote|td|th|pre)[^>]*\/?>/gi
  const segments: { text: string; isHeading: boolean }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(bodyHtml)) !== null) {
    const text = bodyHtml.slice(lastIndex, match.index)
    lastIndex = match.index + match[0].length
    const isHeading = /^h[1-6]$/i.test(match[1])
    segments.push({ text, isHeading })
  }
  // Last segment
  segments.push({ text: bodyHtml.slice(lastIndex), isHeading: false })

  const paragraphs: EpubChunk[] = []

  for (const seg of segments) {
    const text = seg.text
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#?\w+;/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length > 3) {
      paragraphs.push({
        id: `epub-p-${startIndex + paragraphs.length}`,
        text,
        type: seg.isHeading ? 'heading' : 'text'
      })
    }
  }

  return paragraphs
}

function extractTocFromParagraphs(paragraphs: EpubChunk[]): TocEntry[] {
  const toc: TocEntry[] = []
  for (const p of paragraphs) {
    if (p.type === 'toc') continue
    const chapterMatch = p.text.match(
      /^(第[一二三四五六七八九十百千\d]+[章节回篇部]|Chapter\s+\d+|CHAPTER\s+\d+|Part\s+\d+|序言|前言|后记|尾声)/
    )
    if (chapterMatch) {
      toc.push({ id: p.id, title: p.text.slice(0, 40), level: 1 })
    }
  }
  return toc
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`))
  return match ? match[1].trim() : null
}
