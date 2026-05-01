import { readFileSync } from 'fs'
import PDFParser from 'pdf2json'

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

export async function parsePdf(filePath: string, title: string): Promise<{
  paragraphs: EpubChunk[]
  toc: TocEntry[]
  title: string
}> {
  const buffer = readFileSync(filePath)
  const parser = await new Promise<PDFParser>((resolve, reject) => {
    const p = new PDFParser()
    p.on('pdfParser_dataReady', () => resolve(p))
    p.on('pdfParser_dataError', (err) => reject(new Error(`PDF parse error: ${err}`)))
    p.parseBuffer(buffer)
  })

  const pages = (parser.data as {
    Pages?: Array<{
      Texts?: Array<{
        x: number; y: number
        R?: Array<{ T: string; TS?: number[] }>
      }>
    }>
  }).Pages || []

  const paragraphs: EpubChunk[] = []
  const toc: TocEntry[] = []
  let paraIndex = 0

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi]
    const texts = page.Texts || []
    if (texts.length === 0) continue

    const sorted = [...texts].sort((a, b) => {
      const yDiff = b.y - a.y
      if (Math.abs(yDiff) > 2) return yDiff
      return a.x - b.x
    })

    const lines: { text: string; y: number }[] = []
    let currentLine = ''; let currentY = sorted[0].y

    for (const item of sorted) {
      if (Math.abs(item.y - currentY) > 3) {
        if (currentLine.trim()) lines.push({ text: currentLine.trim(), y: currentY })
        currentLine = ''
        currentY = item.y
      }
      for (const run of item.R || []) {
        const t = decodeURIComponent(run.T || '')
        if (t.trim()) {
          if (currentLine && !currentLine.endsWith(' ') && !currentLine.endsWith('-')) {
            currentLine += ' '
          }
          currentLine += t
        }
      }
    }
    if (currentLine.trim()) lines.push({ text: currentLine.trim(), y: currentY })

    for (const line of lines) {
      const text = line.text.replace(/\s+/g, ' ').trim()
      if (!text || text.length < 2) continue

      const isHeading = detectHeading(text)
      const id = `pdf-p-${paraIndex}`
      paragraphs.push({ id, text, type: isHeading ? 'heading' : 'text' })

      if (isHeading) {
        const short = text.slice(0, 64)
        if (!toc.some(t => t.title === short)) {
          toc.push({ id, title: short, level: isHeading === 'h1' ? 1 : 2 })
        }
      }
      paraIndex++
    }
  }

  const filename = filePath.replace(/^.*[\\/]/, '').replace(/\.pdf$/i, '')
  return { paragraphs, toc, title: title || filename }
}

function detectHeading(text: string): 'h1' | 'h2' | false {
  const h1Patterns = [
    /^第[一二三四五六七八九十百千\d]+[章节回篇部]/,
    /^Chapter\s*\d+/i,
    /^Part\s+\d+/i,
    /^(序言|前言|后记|引言|附录[一二三四五六七八九十\d]*|参考文献|致谢|目\s*录)$/,
    /^(Abstract|Preface|Foreword|Introduction|Conclusion|Appendix|References|Bibliography|Contents)$/i,
    /^[一二三四五六七八九十]+[、.]/,
    /^\d+\.\s+[A-Z一-鿿]{2}/,
  ]

  for (const p of h1Patterns) {
    if (p.test(text)) return 'h1'
  }

  if (text.length < 80) {
    const h2Patterns = [
      /^\d+\.\d+/,
      /^[①②③④⑤⑥⑦⑧⑨⑩][、.]/,
      /^（[一二三四五六七八九十\d]+）/,
      /^\d+\.\d+\.\d+/,
    ]
    for (const p of h2Patterns) {
      if (p.test(text)) return 'h2'
    }
  }

  return false
}
