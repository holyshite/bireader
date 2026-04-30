import { readFileSync } from 'fs'
import JSZip from 'jszip'

interface EpubChunk {
  id: string
  text: string
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
  const rootfileMatch = containerXml.match(/full-path="([^"]+)"/)
  if (!rootfileMatch) throw new Error('Invalid EPUB: cannot find rootfile path')

  const rootfilePath = rootfileMatch[1]
  const rootfileDir = rootfilePath.includes('/') ? rootfilePath.split('/').slice(0, -1).join('/') : ''

  // 2. Parse content.opf
  const opfFile = zip.file(rootfilePath)
  if (!opfFile) throw new Error('Invalid EPUB: missing content.opf')

  const opfXml = await opfFile.async('string')
  const title = extractTag(opfXml, 'dc:title') || extractTag(opfXml, 'title') || 'Unknown'

  // Find a cover image (optional, for future use)
  // const coverId = opfXml.match(/<meta[^>]*name="cover"[^>]*content="([^"]*)"/)?.[1] || ''

  // 3. Build manifest map: id → href
  const manifest = new Map<string, string>()
  const itemRegex = /<item[^>]*id="([^"]*)"[^>]*href="([^"]*)"[^>]*>/g
  let itemMatch: RegExpExecArray | null
  while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
    manifest.set(itemMatch[1], itemMatch[2])
  }

  // 4. Get spine reading order
  const spineIds: string[] = []
  const spineRegex = /<itemref[^>]*idref="([^"]*)"[^>]*>/g
  let spineMatch: RegExpExecArray | null
  while ((spineMatch = spineRegex.exec(opfXml)) !== null) {
    spineIds.push(spineMatch[1])
  }

  // 5. Parse toc.ncx for TOC
  const tocNcxPath = findTocNcx(opfXml, manifest, rootfileDir)
  let tocEntries: TocEntry[] = []
  if (tocNcxPath) {
    const ncxFile = zip.file(tocNcxPath)
    if (ncxFile) {
      const ncxXml = await ncxFile.async('string')
      tocEntries = parseTocNcx(ncxXml)
    }
  }

  // 6. Extract paragraphs from each spine item's XHTML
  const paragraphs: EpubChunk[] = []
  let paraIndex = 0

  for (const spineId of spineIds) {
    const href = manifest.get(spineId)
    if (!href) continue

    const fullPath = rootfileDir ? `${rootfileDir}/${href}` : href
    const htmlFile = zip.file(fullPath) || zip.file(href)
    if (!htmlFile) continue

    const html = await htmlFile.async('string')
    const chunks = extractParagraphs(html, paraIndex)
    if (chunks.length > 0) {
      paragraphs.push(...chunks)
    }
    paraIndex += chunks.length
  }

  // If no TOC from ncx, extract from headings in content
  if (tocEntries.length === 0) {
    tocEntries = extractTocFromParagraphs(paragraphs)
  }

  return { paragraphs, toc: tocEntries, title }
}

function findTocNcx(opfXml: string, manifest: Map<string, string>, rootfileDir: string): string | null {
  // Find ncx id from spine toc attribute
  const tocId = opfXml.match(/<spine[^>]*toc="([^"]*)"/)?.[1] || 'ncx'
  const href = manifest.get(tocId)
  if (href) return rootfileDir ? `${rootfileDir}/${href}` : href

  // Fallback: look for ncx in manifest
  for (const [id, href] of manifest) {
    if (href.endsWith('.ncx')) return rootfileDir ? `${rootfileDir}/${href}` : href
  }
  return null
}

function parseTocNcx(ncxXml: string): TocEntry[] {
  const entries: TocEntry[] = []
  // Remove namespaces for simpler parsing
  const cleanXml = ncxXml.replace(/\s+xmlns(:[a-z]+)?="[^"]*"/g, '')

  const navPointRegex = /<navPoint[^>]*id="([^"]*)"[^>]*playOrder="(\d+)"[^>]*>/g
  const navLabelRegex = /<text>([^<]+)<\/text>/g
  const contentSrcRegex = /<content[^>]*src="([^"]*)"/g

  // Simpler approach: extract all navPoints with their text and src
  const navBlockRegex = /<navPoint[^>]*>([\s\S]*?)<\/navPoint>/g
  let blockMatch: RegExpExecArray | null
  let level = 1

  while ((blockMatch = navBlockRegex.exec(cleanXml)) !== null) {
    const block = blockMatch[1]
    // Check if there are nested navPoints → indicates this is a parent level
    const hasNested = /<navPoint/.test(block.replace(/<navPoint[\s\S]*?<\/navPoint>/, ''))

    const textMatch = block.match(/<text>([^<]+)<\/text>/)
    const srcMatch = block.match(/<content[^>]*src="([^"]*)"/)

    if (textMatch) {
      const title = textMatch[1].trim()
      const src = srcMatch?.[1]?.split('#')[0] || blockMatch[1]
      const id = src.slice(-20) // simple id from src

      entries.push({ id: `epub-p-${entries.length}`, title, level: 1 })
    }
  }

  return entries
}

function extractParagraphs(html: string, startIndex: number): EpubChunk[] {
  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (!bodyMatch) return []

  let bodyHtml = bodyMatch[1]
  // Remove scripts and styles
  bodyHtml = bodyHtml.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')

  // Remove image tags
  bodyHtml = bodyHtml.replace(/<img[^>]*>/gi, '')

  // Remove HTML tags but keep text
  // Split on block-level tags
  const paragraphs: EpubChunk[] = []
  // Split by block elements
  const blocks = bodyHtml.split(/<\/?(?:p|div|h[1-6]|br|section|article|li|blockquote)[^>]*>/gi)

  for (const block of blocks) {
    // Clean remaining inline tags
    const text = block
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#?\w+;/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length > 0) {
      paragraphs.push({ id: `epub-p-${startIndex + paragraphs.length}`, text })
    }
  }

  return paragraphs
}

function extractTocFromParagraphs(paragraphs: EpubChunk[]): TocEntry[] {
  const toc: TocEntry[] = []
  for (const p of paragraphs) {
    // Detect chapter-like patterns
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
