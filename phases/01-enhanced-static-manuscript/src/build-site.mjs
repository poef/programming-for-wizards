import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)))
const contentDir = path.join(rootDir, "content")
const bookPath = path.join(contentDir, "book.json")
const phaseDir = path.join(rootDir, "phases", "01-enhanced-static-manuscript")
const exhibitPhaseDir = path.join(rootDir, "phases", "03-core-explorable-exhibits")
const siteDir = path.join(rootDir, "site")
const siteChapterDir = path.join(siteDir, "chapters")
const siteAssetDir = path.join(siteDir, "assets")
const siteDataDir = path.join(siteDir, "data")
const interactiveExhibits = new Set([
  "same-problem-different-world",
  "numbers-are-machines",
  "html-chooses-a-tree",
  "jaqt-extension-lab",
  "knitted-castle-vs-lego-castle"
])

function createManifest(book) {
  return {
    id: book.id,
    title: book.title,
    generatedAt: new Date().toISOString(),
    phase: "01-enhanced-static-manuscript",
    features: {
      notes: "planned",
      solidNotes: "planned",
      exhibitRuntime: true,
      readerSettings: true,
      mathRendering: true,
      staticFallbacks: true
    },
    chapters: [],
    exhibits: [],
    rules: [],
    anchors: []
  }
}

async function main() {
  await rm(siteDir, { recursive: true, force: true })
  await mkdir(siteChapterDir, { recursive: true })
  await mkdir(siteAssetDir, { recursive: true })
  await mkdir(siteDataDir, { recursive: true })

  const book = await readBook()
  const chapters = await readChapters(book)
  const manifest = createManifest(book)
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
      partId: chapter.partId,
      url: chapter.url,
      previous: chapter.previous,
      next: chapter.next,
      wordCount: chapter.wordCount,
      rule: chapter.rules[chapter.rules.length - 1]?.label ?? null
    })
    manifest.exhibits.push(...chapter.exhibits)
    manifest.rules.push(...chapter.rules)
    manifest.anchors.push(...chapter.anchors)

    return {
      chapter,
      html: pageShell({
        title: `${chapter.title} - ${book.title}`,
        book,
        currentId: chapter.id,
        chapters,
        main: chapterLayout(chapter, html, previous, next, chapters, index),
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
      title: book.title,
      book,
      currentId: null,
      chapters,
      main: indexLayout(book, chapters),
      pageKind: "index"
    })
  )

  await writeFile(
    path.join(siteDataDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  )

  await cp(path.join(phaseDir, "assets"), siteAssetDir, { recursive: true })
  await cp(
    path.join(exhibitPhaseDir, "assets"),
    path.join(siteAssetDir, "exhibits"),
    { recursive: true }
  )

  console.log(`Built ${chapters.length} chapters into ${path.relative(rootDir, siteDir)}`)
}

async function readBook() {
  const book = JSON.parse(await readFile(bookPath, "utf8"))

  assertText(book.id, "book.id")
  assertText(book.title, "book.title")
  assertArray(book.parts, "book.parts")

  return book
}

async function readChapters(book) {
  const chapters = []
  const seenParts = new Set()
  const seenChapters = new Set()
  const seenNumbers = new Set()

  for (const [partIndex, part] of book.parts.entries()) {
    const partPath = `book.parts[${partIndex}]`
    assertText(part.id, `${partPath}.id`)
    assertText(part.title, `${partPath}.title`)
    assertArray(part.chapters, `${partPath}.chapters`)

    if (seenParts.has(part.id)) {
      throw new Error(`Duplicate part id in content/book.json: ${part.id}`)
    }
    seenParts.add(part.id)

    for (const [chapterIndex, chapterData] of part.chapters.entries()) {
      const chapterPath = `${partPath}.chapters[${chapterIndex}]`
      assertText(chapterData.id, `${chapterPath}.id`)
      assertText(chapterData.number, `${chapterPath}.number`)
      assertText(chapterData.source, `${chapterPath}.source`)

      if (seenChapters.has(chapterData.id)) {
        throw new Error(`Duplicate chapter id in content/book.json: ${chapterData.id}`)
      }
      seenChapters.add(chapterData.id)

      if (seenNumbers.has(chapterData.number)) {
        throw new Error(`Duplicate chapter number in content/book.json: ${chapterData.number}`)
      }
      seenNumbers.add(chapterData.number)

      const sourcePath = safeContentPath(chapterData.source)
      const source = await readFile(sourcePath, "utf8")
      const { attributes, body } = parseFrontMatter(source)
      const markdownTitle = body.match(/^#\s+(.+)$/m)?.[1]?.trim()

      chapters.push({
        id: chapterData.id,
        number: chapterData.number,
        title: markdownTitle ?? chapterData.title ?? chapterData.id,
        part: part.title,
        partId: part.id,
        sourcePath: `content/${chapterData.source}`,
        attributes,
        wordCount: countWords(body),
        body
      })
    }
  }

  return chapters
}

function safeContentPath(relativePath) {
  const resolved = path.normalize(path.join(contentDir, relativePath))
  const distance = path.relative(contentDir, resolved)
  if (distance.startsWith("..") || path.isAbsolute(distance)) {
    throw new Error(`Chapter source must stay inside content/: ${relativePath}`)
  }
  return resolved
}

function assertText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`content/book.json must contain a non-empty string at ${label}`)
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`content/book.json must contain an array at ${label}`)
  }
}

function countWords(source) {
  return stripInline(source).split(/\s+/).filter(Boolean).length
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
      html: `<figure id="${id}" class="math-block" data-note-target>
<div class="math-display">$$
${escapeHtml(math.join("\n").trim())}
$$</div>
</figure>`,
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
      status: interactiveExhibits.has(exhibitId) ? "interactive" : "placeholder"
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

function pageShell({ title, book, currentId, chapters, main, pageKind }) {
  const relativeRoot = pageKind === "chapter" ? "../" : ""
  const currentChapter = chapters.find(chapter => chapter.id === currentId)
  const isProloguePage = pageKind === "index" || currentChapter?.partId === "prologue"
  const chapterMapDefault = isProloguePage ? "open" : "closed"
  const readerToolsDefault = isProloguePage ? "open" : "closed"

  return `<!doctype html>
<html lang="en" data-font="publication" data-theme="light" data-motion="auto" data-flow="paged" data-page-kind="${pageKind}" data-chapter-map="${chapterMapDefault}" data-reader-tools="${readerToolsDefault}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${relativeRoot}assets/book.css">
  <link rel="stylesheet" href="${relativeRoot}assets/exhibits/exhibits.css">
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [["$", "$"], ["\\\\(", "\\\\)"]],
        displayMath: [["$$", "$$"], ["\\\\[", "\\\\]"]],
        processEscapes: true
      },
      options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"]
      }
    }
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
  <script defer src="${relativeRoot}assets/book.js"></script>
  <script defer src="${relativeRoot}assets/exhibits/exhibit-kit.js"></script>
  <script defer src="https://cdn.jsdelivr.net/gh/muze-labs/simplyflow@main/packages/simplyflow/dist/simply.flow.js"></script>
  <script type="module" src="${relativeRoot}assets/exhibits/exhibits.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to manuscript</a>
  <div class="book-shell">
    ${chapterMap(book, chapters, currentId, relativeRoot, chapterMapDefault)}
    ${main}
    ${readerMargin(relativeRoot, readerToolsDefault)}
  </div>
</body>
</html>`
}

function chapterMap(book, chapters, currentId, relativeRoot, chapterMapDefault) {
  const grouped = new Map()
  const isOpen = chapterMapDefault === "open"

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
  <button class="chapter-map-toggle" type="button" aria-expanded="${isOpen ? "true" : "false"}" aria-controls="chapter-map-panel" aria-label="${isOpen ? "Hide" : "Show"} contents" data-chapter-map-toggle>
    <span>Contents</span>
    <span class="chapter-map-toggle-state" data-chapter-map-label>${isOpen ? "Close" : "Open"}</span>
  </button>
  <div id="chapter-map-panel" class="chapter-map-panel" data-chapter-map-panel${isOpen ? "" : " hidden"}>
  <a class="book-title" href="${relativeRoot}index.html">${escapeHtml(book.title)}</a>
  ${groups}
  </div>
</nav>`
}

function readerMargin(relativeRoot, readerToolsDefault) {
  const isOpen = readerToolsDefault === "open"

  return `<aside class="reader-margin" aria-label="Reader tools">
  <button class="reader-toggle" type="button" aria-expanded="${isOpen ? "true" : "false"}" aria-controls="reader-tools-panel" aria-label="${isOpen ? "Hide" : "Show"} reader tools" data-reader-tools-toggle>
    <span class="reader-toggle-name">
      ${readerToggleOrnament()}
      <span>Reader</span>
    </span>
    <span class="reader-toggle-state" data-reader-tools-label>${isOpen ? "Close" : "Open"}</span>
  </button>
  <div id="reader-tools-panel" class="reader-tools" data-reader-tools-panel${isOpen ? "" : " hidden"}>
    ${readerPanelOrnament()}
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
        <input data-setting="columnWidth" type="range" min="38" max="66" step="2" value="48">
      </label>
      <label>Flow
        <select data-setting="flow">
          <option value="paged">Paged</option>
          <option value="scroll">Scrolling</option>
        </select>
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
  </div>
</aside>`
}

function readerToggleOrnament() {
  return `<svg class="reader-toggle-ornament" viewBox="0 0 44 32" aria-hidden="true" focusable="false">
        <path d="M7 22c8-11 18-11 30 0"/>
        <path d="M13 22V11m9 11V7m9 15V13"/>
        <circle cx="13" cy="10" r="2"/>
        <circle cx="22" cy="6" r="2"/>
        <circle cx="31" cy="12" r="2"/>
        <path d="M10 25h24"/>
      </svg>`
}

function readerPanelOrnament() {
  return `<svg class="reader-panel-ornament" viewBox="0 0 260 120" aria-hidden="true" focusable="false">
      <path class="ornament-wire" d="M15 82c28-34 54-35 78-3 20 27 47 27 78 0 27-24 51-21 74 9"/>
      <path class="ornament-wire" d="M31 86V46c0-12 8-20 20-20h20"/>
      <path class="ornament-wire" d="M101 67V36c0-10 7-17 17-17h31"/>
      <path class="ornament-wire" d="M187 71V42c0-11 8-18 19-18h22"/>
      <path class="ornament-leaf" d="M63 25c-12-8-23-6-32 5 12 3 23 1 32-5z"/>
      <path class="ornament-leaf" d="M143 19c11-9 23-8 34 2-10 5-22 4-34-2z"/>
      <path class="ornament-leaf" d="M225 23c-8-7-17-6-27 1 8 5 17 5 27-1z"/>
      <rect class="ornament-chip" x="105" y="74" width="44" height="28" rx="6"/>
      <path class="ornament-chip-line" d="M113 83h11m8 0h9M113 93h28"/>
      <path class="ornament-pin" d="M113 74v-8m12 8v-8m12 8v-8m-24 44v-8m12 8v-8m12 8v-8"/>
      <circle class="ornament-node" cx="31" cy="86" r="3"/>
      <circle class="ornament-node" cx="101" cy="67" r="3"/>
      <circle class="ornament-node" cx="187" cy="71" r="3"/>
      <circle class="ornament-node" cx="244" cy="88" r="3"/>
    </svg>`
}

function indexLayout(book, chapters) {
  const grouped = new Map()
  for (const chapter of chapters) {
    if (!grouped.has(chapter.part)) grouped.set(chapter.part, [])
    grouped.get(chapter.part).push(chapter)
  }

  return `<main id="main" class="manuscript manuscript-index">
  <header class="chapter-header">
    <p class="chapter-kicker">Enhanced Static Manuscript</p>
    ${chapterGlyph(0)}
    <h1>${escapeHtml(book.title)}</h1>
    <p class="lede">${escapeHtml(book.subtitle ?? "")}</p>
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

function chapterLayout(chapter, renderedBody, previous, next, chapters, chapterIndex) {
  const pageWeights = chapters.map(entry => entry.wordCount || 1).join(",")

  return `<main id="main" class="manuscript">
  <div class="book-progress" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-book-progress>
    <span data-book-progress-bar></span>
  </div>
  <div class="manuscript-pages" data-page-scroller data-book-chapter-index="${chapterIndex}" data-book-page-weights="${escapeAttribute(pageWeights)}">
  <header class="chapter-header">
    <p class="chapter-kicker">${escapeHtml(chapter.part)}</p>
    <p class="chapter-number">Chapter ${escapeHtml(chapter.number)}</p>
    ${chapterGlyph(Number(chapter.number))}
  </header>
  ${renderedBody}
  <nav class="chapter-pagination" aria-label="Chapter navigation">
    ${previous ? `<a rel="prev" href="${previous.id}.html"><span>Previous</span>${escapeHtml(previous.title)}</a>` : "<span></span>"}
    ${next ? `<a rel="next" href="${next.id}.html"><span>Next</span>${escapeHtml(next.title)}</a>` : "<span></span>"}
  </nav>
  </div>
  <div class="page-turner" data-page-controls hidden>
    <button type="button" data-page-prev aria-label="Previous page">Previous</button>
    <span data-page-status aria-live="polite">Page 1 of 1</span>
    <button type="button" data-page-next aria-label="Next page">Next</button>
  </div>
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
  text = preserveInlineMath(text, hold)
  text = text.replace(/<[^>\n]+>/g, tag => hold(tag))
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  text = text.replace(/_([^_]+)_/g, "<em>$1</em>")
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  let restored = true
  while (restored) {
    restored = false
    for (let index = 0; index < placeholders.length; index += 1) {
      const key = `\u0000${index}\u0000`
      if (text.includes(key)) {
        text = text.split(key).join(placeholders[index])
        restored = true
      }
    }
  }

  return text
}

function preserveInlineMath(source, hold) {
  let text = source.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => hold(`$$${escapeHtml(math)}$$`))

  text = text.replace(/(^|[^\\$])\$((?:\\.|[^$\n])+?)\$/g, (_, prefix, math) => {
    return `${prefix}${hold(`$${escapeHtml(math)}$`)}`
  })

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

function chapterGlyph(number) {
  const glyphs = new Map([
    [0, `<path d="M20 48h56M48 20v56M30 30l36 36M66 30 30 66"/><circle cx="48" cy="48" r="9"/>`],
    [1, `<path d="M23 62c14-25 36-25 50 0"/><path d="M32 62V34m16 28V25m16 37V38"/><circle cx="32" cy="31" r="3"/><circle cx="48" cy="22" r="3"/><circle cx="64" cy="35" r="3"/>`],
    [2, `<path d="M22 67h52"/><path d="M30 67V25h36v42"/><path d="M39 67V37h18v30"/><path d="M21 25h54"/><circle cx="35" cy="50" r="2"/><circle cx="61" cy="50" r="2"/>`],
    [3, `<path d="M23 67c12-17 12-31 0-43 17 12 31 12 50 0-12 17-12 31 0 43-19-12-33-12-50 0z"/><path d="M35 48h26M48 35v26"/>`],
    [4, `<path d="M25 63c8-22 17-33 28-33 9 0 15 6 18 17"/><path d="M25 63c16-5 31-5 46 0"/><path d="M36 42c7 4 15 4 24 0"/>`],
    [5, `<path d="M21 64c15-16 30-32 54-32"/><circle cx="24" cy="62" r="5"/><circle cx="48" cy="48" r="5"/><circle cx="72" cy="34" r="5"/><path d="M43 48H30m37-14H53"/>`],
    [6, `<path d="M48 72V24"/><path d="M48 37c-13-12-23-11-30 2 12 1 22 0 30-2z"/><path d="M48 49c14-13 24-12 31 2-12 1-23 0-31-2z"/><path d="M48 60c-10-7-19-6-27 4 10 2 19 1 27-4z"/>`],
    [7, `<path d="M23 29h50v34H23z"/><path d="M23 39h50"/><path d="M34 72h28"/><path d="M42 63v9m12-9v9"/><circle cx="31" cy="34" r="1.5"/><circle cx="37" cy="34" r="1.5"/>`],
    [8, `<path d="M25 31c12-10 34-10 46 0"/><path d="M71 31c-12 10-34 10-46 0"/><path d="M25 65c12-10 34-10 46 0"/><path d="M71 65c-12 10-34 10-46 0"/><path d="M35 48h26"/>`],
    [9, `<path d="M22 31h20v20H22zM54 31h20v20H54zM38 60h20v20H38z"/><path d="M42 41h12M48 51v9"/>`],
    [10, `<path d="M24 25h48L55 48v21l-14 7V48z"/><path d="M33 35h30"/><path d="M40 45h16"/>`],
    [11, `<path d="M20 31c22 4 17 32 39 36 10 2 17-3 17-12"/><path d="M24 62c18-14 33-16 50-7"/><path d="M24 44c21-1 36 6 47 21"/><circle cx="20" cy="31" r="3"/><circle cx="24" cy="62" r="3"/><circle cx="76" cy="55" r="3"/>`],
    [12, `<circle cx="48" cy="48" r="14"/><path d="M48 20v14m0 28v14M20 48h14m28 0h14"/><circle cx="48" cy="20" r="4"/><circle cx="76" cy="48" r="4"/><circle cx="48" cy="76" r="4"/><circle cx="20" cy="48" r="4"/>`],
    [13, `<path d="M21 69h54"/><path d="M29 69V54a19 19 0 0 1 38 0v15"/><path d="M39 69V55a9 9 0 0 1 18 0v14"/><path d="M34 38 48 24l14 14"/>`],
    [14, `<circle cx="29" cy="32" r="7"/><circle cx="67" cy="36" r="7"/><circle cx="40" cy="67" r="7"/><path d="M35 36l25-1M32 39l7 21M62 41 45 62"/><path d="M22 51c17-10 34-10 52 0"/>`],
    [15, `<path d="M22 61h52"/><path d="M28 61V33h16v28M52 61V25h16v36"/><path d="M31 42h10m14-7h10M31 51h10m24-6H55"/>`],
    [16, `<path d="M22 50 48 28l26 22"/><path d="M31 48v22h34V48"/><path d="M41 70V55h14v15"/><path d="M24 70h48"/><circle cx="62" cy="34" r="4"/>`],
    [17, `<path d="M26 27h19v19H26zM51 30h19v19H51zM35 55h19v19H35z"/><path d="M45 36h6M52 49l-7 6M36 46l4 9"/><path d="M65 65c-14 8-25 8-34 0"/>`]
  ])

  return `<svg class="chapter-glyph" viewBox="0 0 96 96" focusable="false" aria-hidden="true">${glyphs.get(number) ?? glyphs.get(0)}</svg>`
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
