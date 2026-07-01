import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)))
const contentDir = path.join(rootDir, "content")
const chapterDir = path.join(contentDir, "chapters")
const phaseDir = path.join(rootDir, "phases", "01-enhanced-static-manuscript")
const siteDir = path.join(rootDir, "site")
const siteChapterDir = path.join(siteDir, "chapters")
const siteAssetDir = path.join(siteDir, "assets")
const siteDataDir = path.join(siteDir, "data")

const manifest = {
  id: "programming-for-wizards",
  title: "Programming for Wizards",
  generatedAt: new Date().toISOString(),
  phase: "01-enhanced-static-manuscript",
  features: {
    notes: "planned",
    solidNotes: "planned",
    readerSettings: true,
    staticFallbacks: true
  },
  chapters: [],
  exhibits: [],
  rules: [],
  anchors: []
}

const partForNumber = number => {
  if (number === "01") return "Prologue: You are allowed to make it up"
  if (["02", "03", "04"].includes(number)) return "Part I: Representations are spells"
  if (["05", "06", "07"].includes(number)) return "Part II: The Web, from address to platform"
  if (["08", "09", "10"].includes(number)) return "Part III: Inventing languages"
  if (["11", "12"].includes(number)) return "Part IV: Boundaries and reusable pieces"
  if (["13", "14", "15", "16"].includes(number)) return "Part V: Architecture, change, commons, and home"
  return "Epilogue"
}

async function main() {
  await rm(siteDir, { recursive: true, force: true })
  await mkdir(siteChapterDir, { recursive: true })
  await mkdir(siteAssetDir, { recursive: true })
  await mkdir(siteDataDir, { recursive: true })

  const chapters = await readChapters()
  const renderedChapters = chapters.map((chapter, index) => {
    const renderer = new MarkdownRenderer(chapter)
    const html = renderer.render(chapter.body)
    const previous = chapters[index - 1] ?? null
    const next = chapters[index + 1] ?? null

    Object.assign(chapter, {
      anchors: renderer.anchors,
      exhibits: renderer.exhibits,
      rules: renderer.rules,
      url: `chapters/${chapter.id}.html`,
      previous: previous?.id ?? null,
      next: next?.id ?? null
    })

    manifest.chapters.push({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      part: chapter.part,
      url: chapter.url,
      previous: chapter.previous,
      next: chapter.next,
      rule: chapter.rules[chapter.rules.length - 1]?.label ?? null
    })
    manifest.exhibits.push(...chapter.exhibits)
    manifest.rules.push(...chapter.rules)
    manifest.anchors.push(...chapter.anchors)

    return {
      chapter,
      html: pageShell({
        title: `${chapter.title} - Programming for Wizards`,
        currentId: chapter.id,
        chapters,
        main: chapterLayout(chapter, html, previous, next),
        pageKind: "chapter"
      })
    }
  })

  for (const rendered of renderedChapters) {
    await writeFile(
      path.join(siteChapterDir, `${rendered.chapter.id}.html`),
      rendered.html
    )
  }

  await writeFile(
    path.join(siteDir, "index.html"),
    pageShell({
      title: "Programming for Wizards",
      currentId: null,
      chapters,
      main: indexLayout(chapters),
      pageKind: "index"
    })
  )

  await writeFile(
    path.join(siteDataDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  )

  await cp(path.join(phaseDir, "assets"), siteAssetDir, { recursive: true })

  console.log(`Built ${chapters.length} chapters into ${path.relative(rootDir, siteDir)}`)
}

async function readChapters() {
  const files = (await readdir(chapterDir))
    .filter(file => /^\d{2}-.*\.md$/.test(file))
    .sort((a, b) => a.localeCompare(b))

  const chapters = []

  for (const file of files) {
    const source = await readFile(path.join(chapterDir, file), "utf8")
    const { attributes, body } = parseFrontMatter(source)
    const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? file.replace(/\.md$/, "")
    const number = file.slice(0, 2)
    const id = file.replace(/\.md$/, "")

    chapters.push({
      id,
      number,
      title,
      part: partForNumber(number),
      sourcePath: `content/chapters/${file}`,
      attributes,
      body
    })
  }

  return chapters
}

function parseFrontMatter(source) {
  if (!source.startsWith("---\n")) {
    return { attributes: {}, body: source }
  }

  const end = source.indexOf("\n---", 4)
  if (end === -1) {
    return { attributes: {}, body: source }
  }

  const frontMatter = source.slice(4, end).trim()
  const body = source.slice(end + 4).replace(/^\s+/, "")
  const attributes = {}

  for (const line of frontMatter.split("\n")) {
    const [key, ...rest] = line.split(":")
    if (key && rest.length) {
      attributes[key.trim()] = rest.join(":").trim()
    }
  }

  return { attributes, body }
}

class MarkdownRenderer {
  constructor(chapter) {
    this.chapter = chapter
    this.usedIds = new Set()
    this.anchors = []
    this.exhibits = []
    this.rules = []
  }

  render(source) {
    const lines = source.replace(/\r\n/g, "\n").split("\n")
    const html = []

    for (let index = 0; index < lines.length;) {
      const line = lines[index]
      const trimmed = line.trim()

      if (!trimmed) {
        index += 1
        continue
      }

      if (trimmed.startsWith("```")) {
        const result = this.renderCodeFence(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (trimmed === "$$") {
        const result = this.renderMathBlock(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/)
      if (heading) {
        html.push(this.renderHeading(heading[1].length, heading[2]))
        index += 1
        continue
      }

      if (/^>\s?/.test(line)) {
        const result = this.renderBlockquote(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (this.isTableStart(lines, index)) {
        const result = this.renderTable(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (/^\s*[-*]\s+/.test(line)) {
        const result = this.renderList(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (this.isRawHtmlBlockStart(trimmed)) {
        const result = this.renderRawHtmlBlock(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      const result = this.renderParagraph(lines, index)
      html.push(result.html)
      index = result.nextIndex
    }

    return html.join("\n")
  }

  renderHeading(level, text) {
    const plain = stripInline(text)
    const id = this.uniqueId(`h-${this.chapter.number}-${slugify(plain)}`)
    this.addAnchor(id, "heading", plain)

    return `<h${level} id="${id}"><a class="anchor-link" href="#${id}" aria-label="Link to ${escapeAttribute(plain)}">#</a>${renderInline(text)}</h${level}>`
  }

  renderCodeFence(lines, startIndex) {
    const opening = lines[startIndex].trim()
    const info = opening.slice(3).trim()
    const idMatch = info.match(/\bid="([^"]+)"/)
    const id = this.uniqueId(idMatch?.[1] ?? `code-${this.chapter.number}-${String(startIndex + 1).padStart(3, "0")}`)
    const language = normalizeLanguage(info)
    const code = []
    let index = startIndex + 1

    while (index < lines.length && lines[index].trim() !== "```") {
      code.push(lines[index])
      index += 1
    }

    this.addAnchor(id, "code", `${language || "code"} block`)

    return {
      html: `<figure id="${id}" class="code-figure" data-note-target>
<figcaption>${escapeHtml(languageLabel(language))}</figcaption>
<pre><code${language ? ` class="language-${escapeAttribute(language)}"` : ""}>${escapeHtml(code.join("\n"))}</code></pre>
</figure>`,
      nextIndex: index < lines.length ? index + 1 : index
    }
  }

  renderMathBlock(lines, startIndex) {
    const math = []
    let index = startIndex + 1

    while (index < lines.length && lines[index].trim() !== "$$") {
      math.push(lines[index])
      index += 1
    }

    const id = this.uniqueId(`math-${this.chapter.number}-${String(startIndex + 1).padStart(3, "0")}`)
    this.addAnchor(id, "math", "math block")

    return {
      html: `<figure id="${id}" class="math-block" data-note-target><pre>${escapeHtml(math.join("\n"))}</pre></figure>`,
      nextIndex: index < lines.length ? index + 1 : index
    }
  }

  renderBlockquote(lines, startIndex) {
    const quoteLines = []
    let index = startIndex

    while (index < lines.length && /^>\s?/.test(lines[index])) {
      quoteLines.push(lines[index].replace(/^>\s?/, ""))
      index += 1
    }

    const firstLine = quoteLines.find(line => line.trim())?.trim() ?? ""

    if (/^\*\*Interactive exhibit placeholder:/.test(firstLine)) {
      return {
        html: this.renderExhibit(quoteLines, startIndex),
        nextIndex: index
      }
    }

    if (/^\*\*Wizard/.test(firstLine)) {
      return {
        html: this.renderRuleCards(quoteLines, startIndex),
        nextIndex: index
      }
    }

    const inner = quoteLines
      .join("\n")
      .split(/\n{2,}/)
      .map(chunk => `<p>${renderInline(chunk.replace(/\n/g, " "))}</p>`)
      .join("\n")

    return {
      html: `<blockquote>${inner}</blockquote>`,
      nextIndex: index
    }
  }

  renderExhibit(lines, startIndex) {
    const firstLine = lines.find(line => line.trim())?.trim() ?? ""
    const idMatch = firstLine.match(/`([^`]+)`/)
    const exhibitId = idMatch?.[1] ?? `exhibit-${this.chapter.number}-${startIndex + 1}`
    const id = this.uniqueId(`exhibit-${exhibitId}`)
    const bodyLines = lines.slice(1).filter(line => line.trim())
    const title = humanizeId(exhibitId)

    this.exhibits.push({
      id: exhibitId,
      anchor: id,
      chapter: this.chapter.id,
      title,
      url: `chapters/${this.chapter.id}.html#${id}`,
      status: "placeholder"
    })
    this.addAnchor(id, "exhibit", title)

    return `<aside id="${id}" class="exhibit-placeholder" data-exhibit-id="${escapeAttribute(exhibitId)}" data-note-target>
<p class="exhibit-kicker">Interactive Exhibit</p>
<h2>${escapeHtml(title)}</h2>
${bodyLines.map(line => `<p>${renderInline(line)}</p>`).join("\n")}
<div class="static-fallback" aria-label="Static fallback">
<p>${escapeHtml(title)} is planned as an interactive exhibit. This placeholder preserves the explanation and its stable address for the static edition.</p>
</div>
</aside>`
  }

  renderRuleCards(lines, startIndex) {
    const sections = []
    let current = null

    for (const line of lines) {
      const trimmed = line.trim()
      const match = trimmed.match(/^\*\*(Wizard[^*]+)\*\*$/)

      if (match) {
        current = { label: match[1], body: [] }
        sections.push(current)
        continue
      }

      if (current && trimmed) {
        current.body.push(line)
      }
    }

    return sections.map((section, offset) => {
      const id = this.uniqueId(`rule-${this.chapter.number}-${slugify(section.label)}`)
      const ruleId = `${this.chapter.id}-${offset + 1}`
      const text = section.body.join(" ").trim()

      this.rules.push({
        id: ruleId,
        anchor: id,
        chapter: this.chapter.id,
        label: section.label,
        text: stripInline(text),
        url: `chapters/${this.chapter.id}.html#${id}`
      })
      this.addAnchor(id, "rule", section.label)

      return `<aside id="${id}" class="wizard-rule" data-note-target>
<p class="rule-label">${escapeHtml(section.label)}</p>
<p>${renderInline(text)}</p>
</aside>`
    }).join("\n")
  }

  isTableStart(lines, index) {
    return /^\s*\|/.test(lines[index] ?? "") && /^\s*\|?\s*:?-+:?\s*\|/.test(lines[index + 1] ?? "")
  }

  renderTable(lines, startIndex) {
    const rows = []
    let index = startIndex

    while (index < lines.length && /^\s*\|/.test(lines[index])) {
      rows.push(lines[index])
      index += 1
    }

    const id = this.uniqueId(`table-${this.chapter.number}-${String(startIndex + 1).padStart(3, "0")}`)
    this.addAnchor(id, "table", "table")

    const cells = rows.map(row => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim()))
    const header = cells[0] ?? []
    const bodyRows = cells.slice(2)

    return {
      html: `<figure id="${id}" class="table-figure" data-note-target>
<table>
<thead><tr>${header.map(cell => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>
<tbody>
${bodyRows.map(row => `<tr>${row.map(cell => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("\n")}
</tbody>
</table>
</figure>`,
      nextIndex: index
    }
  }

  renderList(lines, startIndex) {
    const items = []
    let index = startIndex

    while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
      items.push(lines[index].replace(/^\s*[-*]\s+/, ""))
      index += 1
    }

    return {
      html: `<ul>${items.map(item => `<li>${renderInline(item)}</li>`).join("")}</ul>`,
      nextIndex: index
    }
  }

  isRawHtmlBlockStart(trimmed) {
    return /^<(figure|style|ul|ol|div|p|img|table|section|aside|pre|h[1-6]|br)\b/i.test(trimmed)
  }

  renderRawHtmlBlock(lines, startIndex) {
    const block = []
    let index = startIndex
    const first = lines[startIndex].trim().toLowerCase()
    const closingTag = first.match(/^<([a-z0-9-]+)/)?.[1]
    const expectedClose = closingTag && !first.endsWith("/>") ? `</${closingTag}>` : null

    while (index < lines.length) {
      block.push(lines[index])
      const current = lines[index].trim().toLowerCase()
      index += 1

      if (expectedClose && current.includes(expectedClose)) break
      if (!expectedClose) break
      if (!lines[index]?.trim()) break
    }

    return {
      html: block.join("\n"),
      nextIndex: index
    }
  }

  renderParagraph(lines, startIndex) {
    const paragraph = []
    let index = startIndex

    while (index < lines.length) {
      const line = lines[index]
      const trimmed = line.trim()

      if (!trimmed) break
      if (
        trimmed.startsWith("```") ||
        trimmed === "$$" ||
        /^(#{1,6})\s+/.test(line) ||
        /^>\s?/.test(line) ||
        this.isTableStart(lines, index) ||
        /^\s*[-*]\s+/.test(line) ||
        this.isRawHtmlBlockStart(trimmed)
      ) {
        break
      }

      paragraph.push(trimmed)
      index += 1
    }

    const text = paragraph.join(" ")
    const id = this.uniqueId(`p-${this.chapter.number}-${slugify(stripInline(text), 8)}`)
    this.addAnchor(id, "paragraph", stripInline(text).slice(0, 120))

    return {
      html: `<p id="${id}" data-note-target>${renderInline(text)}</p>`,
      nextIndex: index
    }
  }

  addAnchor(id, type, label) {
    this.anchors.push({
      id,
      type,
      label,
      chapter: this.chapter.id,
      url: `chapters/${this.chapter.id}.html#${id}`
    })
  }

  uniqueId(base) {
    let id = base || `anchor-${this.chapter.number}`
    let suffix = 2

    while (this.usedIds.has(id)) {
      id = `${base}-${suffix}`
      suffix += 1
    }

    this.usedIds.add(id)
    return id
  }
}

function normalizeLanguage(info) {
  const first = info.split(/\s+/)[0]?.trim() ?? ""
  if (!first) return ""
  const normalized = first.replace(/=$/, "").toLowerCase()
  if (normalized === "htmlembedded") return "html"
  if (normalized === "txt") return "text"
  if (normalized === "cl") return "common-lisp"
  return normalized
}

function languageLabel(language) {
  if (!language) return "code"
  return language
}

function pageShell({ title, currentId, chapters, main, pageKind }) {
  const relativeRoot = pageKind === "chapter" ? "../" : ""

  return `<!doctype html>
<html lang="en" data-font="publication" data-theme="light" data-motion="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${relativeRoot}assets/book.css">
  <script defer src="${relativeRoot}assets/book.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to manuscript</a>
  <div class="book-shell">
    ${chapterMap(chapters, currentId, relativeRoot)}
    ${main}
    ${readerMargin(relativeRoot)}
  </div>
</body>
</html>`
}

function chapterMap(chapters, currentId, relativeRoot) {
  const grouped = new Map()
  for (const chapter of chapters) {
    if (!grouped.has(chapter.part)) grouped.set(chapter.part, [])
    grouped.get(chapter.part).push(chapter)
  }

  const groups = [...grouped.entries()].map(([part, partChapters]) => `
<section class="map-section">
  <h2>${escapeHtml(part)}</h2>
  <ol>
    ${partChapters.map(chapter => {
      const isCurrent = chapter.id === currentId
      return `<li><a${isCurrent ? ` aria-current="page"` : ""} href="${relativeRoot}chapters/${chapter.id}.html"><span>${chapter.number}</span>${escapeHtml(chapter.title)}</a></li>`
    }).join("")}
  </ol>
</section>`).join("")

  return `<nav class="chapter-map" aria-label="Chapters">
  <a class="book-title" href="${relativeRoot}index.html">Programming for Wizards</a>
  ${groups}
</nav>`
}

function readerMargin(relativeRoot) {
  return `<aside class="reader-margin" aria-label="Reader tools">
  <section class="reader-panel">
    <h2>Reader</h2>
    <label>Font
      <select data-setting="font">
        <option value="publication">Publication</option>
        <option value="simple-serif">Simple serif</option>
        <option value="simple-sans">Simple sans</option>
        <option value="high-legibility">High legibility</option>
      </select>
    </label>
    <label>Size
      <input data-setting="fontScale" type="range" min="92" max="124" step="4" value="100">
    </label>
    <label>Line
      <input data-setting="lineHeight" type="range" min="145" max="185" step="5" value="160">
    </label>
    <label>Width
      <input data-setting="columnWidth" type="range" min="36" max="54" step="2" value="42">
    </label>
    <label>Theme
      <select data-setting="theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="contrast">Contrast</option>
      </select>
    </label>
    <label>Motion
      <select data-setting="motion">
        <option value="auto">Auto</option>
        <option value="reduced">Reduced</option>
      </select>
    </label>
  </section>
  <section class="reader-panel">
    <h2>Book Data</h2>
    <a href="${relativeRoot}data/manifest.json">Manifest</a>
  </section>
</aside>`
}

function indexLayout(chapters) {
  const grouped = new Map()
  for (const chapter of chapters) {
    if (!grouped.has(chapter.part)) grouped.set(chapter.part, [])
    grouped.get(chapter.part).push(chapter)
  }

  return `<main id="main" class="manuscript manuscript-index">
  <header class="chapter-header">
    <p class="chapter-kicker">Enhanced Static Manuscript</p>
    <h1>Programming for Wizards</h1>
    <p class="lede">A book about programming as the art of changing the shape of a problem.</p>
  </header>
  <section class="index-toc" aria-labelledby="toc-heading">
    <h2 id="toc-heading">Contents</h2>
    ${[...grouped.entries()].map(([part, partChapters]) => `
    <section>
      <h3>${escapeHtml(part)}</h3>
      <ol>
        ${partChapters.map(chapter => `<li><a href="chapters/${chapter.id}.html"><span>${chapter.number}</span>${escapeHtml(chapter.title)}</a></li>`).join("")}
      </ol>
    </section>`).join("")}
  </section>
</main>`
}

function chapterLayout(chapter, renderedBody, previous, next) {
  return `<main id="main" class="manuscript">
  <header class="chapter-header">
    <p class="chapter-kicker">${escapeHtml(chapter.part)}</p>
    <p class="chapter-number">Chapter ${escapeHtml(chapter.number)}</p>
  </header>
  ${renderedBody}
  <nav class="chapter-pagination" aria-label="Chapter navigation">
    ${previous ? `<a rel="prev" href="${previous.id}.html"><span>Previous</span>${escapeHtml(previous.title)}</a>` : "<span></span>"}
    ${next ? `<a rel="next" href="${next.id}.html"><span>Next</span>${escapeHtml(next.title)}</a>` : "<span></span>"}
  </nav>
</main>`
}

function renderInline(source) {
  let text = source.replace(/\\([\\`*{}\[\]()#+\-.!_<>|&])/g, "$1")
  const placeholders = []
  const hold = value => {
    const key = `\u0000${placeholders.length}\u0000`
    placeholders.push(value)
    return key
  }

  text = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`))
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, href) => hold(`<img src="${escapeAttribute(href)}" alt="${escapeAttribute(alt)}">`))
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => hold(`<a href="${escapeAttribute(href)}">${renderInline(label)}</a>`))
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  text = text.replace(/_([^_]+)_/g, "<em>$1</em>")
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  let restored = true
  while (restored) {
    restored = false
    for (let index = 0; index < placeholders.length; index += 1) {
      const key = `\u0000${index}\u0000`
      if (text.includes(key)) {
        text = text.replaceAll(key, placeholders[index])
        restored = true
      }
    }
  }

  return text
}

function stripInline(source) {
  return source
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_]/g, "")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function slugify(source, wordLimit = 10) {
  const words = source
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, wordLimit)

  return words.join("-") || "section"
}

function humanizeId(id) {
  return id
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase())
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
