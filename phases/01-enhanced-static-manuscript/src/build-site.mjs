import { createHash } from "node:crypto"
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { deflateRawSync } from "node:zlib"

const rootDir = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)))
const contentDir = path.join(rootDir, "content")
const bookPath = path.join(contentDir, "book.json")
const wizardsPath = path.join(contentDir, "wizards.json")
const phaseDir = path.join(rootDir, "phases", "01-enhanced-static-manuscript")
const exhibitPhaseDir = path.join(rootDir, "phases", "03-core-explorable-exhibits")
const siteDir = path.join(rootDir, "www")
const siteChapterDir = path.join(siteDir, "chapters")
const siteAssetDir = path.join(siteDir, "assets")
const siteDataDir = path.join(siteDir, "data")
const epubFileName = "programming-for-wizards.epub"
const epubPath = path.join(siteDir, epubFileName)
const epubExternalImageAssets = new Map([
  [
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Tally_marks-Five-bar_Gate.svg",
    "assets/images/epub/tally-marks-five-bar-gate.png"
  ],
  [
    "https://upload.wikimedia.org/wikipedia/commons/a/af/Abacus_6.png",
    "assets/images/epub/abacus-6.png"
  ],
  [
    "https://upload.wikimedia.org/wikipedia/commons/b/b7/Detail_of_a_Roth_Calculating_machine.png",
    "assets/images/epub/roth-calculating-machine-detail-small.png"
  ],
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Metal_movable_type.jpg/1920px-Metal_movable_type.jpg",
    "assets/images/epub/metal-movable-type-small.jpg"
  ]
])
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
    downloads: [
      {
        format: "epub",
        title: "EPUB",
        url: epubFileName
      }
    ],
    chapters: [],
    pages: [],
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
  const interludes = await readInterludes(book)
  const orderedPages = insertInterludes(chapters, interludes)
  const backMatterPages = await readBackMatter(book)
  const readingItems = [...orderedPages, ...backMatterPages]
  const cover = await readCover(book)
  const wizards = createWizardRegistry(await readWizards())
  const wizardState = { seen: new Set() }
  const manifest = createManifest(book)

  const coverRenderer = new MarkdownRenderer(cover, { wizards, wizardState })
  const renderedCover = coverRenderer.render(cover.body)
  cover.url = "index.html"
  manifest.pages.push(pageManifestEntry(cover))

  const renderedChapters = readingItems.map((chapter, index) => {
    const renderer = new MarkdownRenderer(chapter, { wizards, wizardState })
    const html = renderer.render(chapter.body)
    const previous = readingItems[index - 1] ?? null
    const next = readingItems[index + 1] ?? null

    Object.assign(chapter, {
      anchors: renderer.anchors,
      exhibits: renderer.exhibits,
      rules: renderer.rules,
      url: `chapters/${chapter.id}.html`,
      previous: previous?.id ?? null,
      next: next?.id ?? null
    })

    manifest.pages.push(pageManifestEntry(chapter))
    if (chapter.kind === "chapter") {
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
    }
    manifest.exhibits.push(...chapter.exhibits)
    manifest.rules.push(...chapter.rules)
    manifest.anchors.push(...chapter.anchors)

    return {
      chapter,
      html: pageShell({
        title: `${chapter.title} - ${book.title}`,
        book,
        currentId: chapter.id,
        chapters: readingItems,
        main: chapterLayout(chapter, html, previous, next, readingItems, index),
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
      chapters: readingItems,
      main: indexLayout(book, readingItems, { ...cover, html: renderedCover }),
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

  await buildEpub(book, cover, readingItems)
  await writePwaManifest(book)
  await writeServiceWorker()

  console.log(`Built ${readingItems.length} reading pages and EPUB into ${path.relative(rootDir, siteDir)}`)
}

async function readBook() {
  const book = JSON.parse(await readFile(bookPath, "utf8"))

  assertText(book.id, "book.id")
  assertText(book.title, "book.title")
  assertArray(book.parts, "book.parts")

  return book
}

async function readWizards() {
  try {
    return JSON.parse(await readFile(wizardsPath, "utf8"))
  } catch (error) {
    if (error?.code === "ENOENT") return []
    throw error
  }
}

function createWizardRegistry(entries) {
  const byHref = new Map()

  for (const entry of entries) {
    const wizard = {
      ...entry,
      hrefs: Array.isArray(entry.hrefs) ? entry.hrefs : []
    }

    for (const href of [wizard.url, ...wizard.hrefs]) {
      if (!href) continue
      byHref.set(normalizeHref(href), wizard)
    }
  }

  return { byHref }
}

function normalizeHref(href) {
  try {
    const url = new URL(href)
    url.hash = ""
    return url.href.replace(/\/$/, "")
  } catch {
    return String(href).replace(/#.*$/, "").replace(/\/$/, "")
  }
}


async function readCover(book) {
  const cover = book.cover ?? {
    id: "cover",
    title: book.title,
    source: "frontmatter/cover.md"
  }

  return readContentPage(cover, {
    kind: "cover",
    id: "cover",
    title: book.title,
    part: "Cover",
    partId: "cover",
    label: "Cover"
  })
}

async function readBackMatter(book) {
  const pages = book.backMatter ?? []
  assertArray(pages, "book.backMatter")

  const result = []
  const seenIds = new Set()

  for (const page of pages) {
    const item = await readContentPage(page, {
      kind: "back-matter",
      part: "Back Matter",
      partId: "back-matter",
      label: page.label ?? page.number ?? "Back"
    })

    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate back matter id in content/book.json: ${item.id}`)
    }
    seenIds.add(item.id)
    result.push(item)
  }

  return result
}

async function readInterludes(book) {
  const pages = book.interludes ?? []
  assertArray(pages, "book.interludes")

  const result = []
  const seenIds = new Set()

  for (const [index, page] of pages.entries()) {
    assertText(page.afterPartId, `book.interludes[${index}].afterPartId`)

    const item = await readContentPage(page, {
      kind: "interlude",
      part: "Interlude",
      partId: "interlude",
      title: "Interlude",
      label: ""
    })

    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate interlude id in content/book.json: ${item.id}`)
    }

    seenIds.add(item.id)
    item.afterPartId = page.afterPartId
    item.theme = page.theme ?? `theme-${index + 1}`
    item.image = page.image ?? null
    item.imageAlt = page.imageAlt ?? ""
    result.push(item)
  }

  return result
}

function insertInterludes(chapters, interludes) {
  const byPart = new Map()

  for (const interlude of interludes) {
    if (!byPart.has(interlude.afterPartId)) byPart.set(interlude.afterPartId, [])
    byPart.get(interlude.afterPartId).push(interlude)
  }

  const result = []

  for (const [index, chapter] of chapters.entries()) {
    result.push(chapter)

    const nextChapter = chapters[index + 1] ?? null
    if (nextChapter?.partId === chapter.partId) continue

    const partInterludes = byPart.get(chapter.partId) ?? []
    result.push(...partInterludes)
    byPart.delete(chapter.partId)
  }

  const unused = [...byPart.values()].flat()
  if (unused.length) {
    throw new Error(`Interlude afterPartId does not match a book part: ${unused.map(page => `${page.id} after ${page.afterPartId}`).join(", ")}`)
  }

  return result
}

async function readContentPage(pageData, defaults = {}) {
  const id = pageData.id ?? defaults.id
  const source = pageData.source ?? defaults.source
  const kind = pageData.kind ?? defaults.kind ?? "page"
  const part = pageData.part ?? defaults.part ?? "Back Matter"
  const partId = pageData.partId ?? defaults.partId ?? "back-matter"

  assertText(id, `${defaults.kind ?? "page"}.id`)
  assertText(source, `${defaults.kind ?? "page"}.source`)
  assertText(part, `${defaults.kind ?? "page"}.part`)
  assertText(partId, `${defaults.kind ?? "page"}.partId`)

  const sourcePath = safeContentPath(source)
  const file = kind === "cover"
    ? await readFile(sourcePath, "utf8")
    : await readStableContentSource(sourcePath, { id, number: pageData.number ?? defaults.number ?? "" })
  const { attributes, body } = parseFrontMatter(file)
  const markdownTitle = body.match(/^#\s+(.+)$/m)?.[1]?.trim()

  return {
    kind,
    id,
    number: pageData.number ?? defaults.number ?? "",
    label: pageData.label ?? pageData.number ?? defaults.label ?? "",
    title: markdownTitle ?? pageData.title ?? defaults.title ?? id,
    part,
    partId,
    sourcePath: `content/${source}`,
    attributes,
    wordCount: countWords(body),
    body
  }
}

function pageManifestEntry(page) {
  return {
    id: page.id,
    kind: page.kind,
    label: page.label || page.number || null,
    title: page.title,
    part: page.part,
    partId: page.partId,
    url: page.url ?? null,
    wordCount: page.wordCount
  }
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
      const source = await readStableContentSource(sourcePath, {
        id: chapterData.id,
        number: chapterData.number
      })
      const { attributes, body } = parseFrontMatter(source)
      const markdownTitle = body.match(/^#\s+(.+)$/m)?.[1]?.trim()

      chapters.push({
        kind: "chapter",
        id: chapterData.id,
        number: chapterData.number,
        label: chapterData.number,
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
  return stripInline(removeStableIdComments(source)).split(/\s+/).filter(Boolean).length
}

function removeStableIdComments(source) {
  return String(source).replace(/^<!--\s*(?:paragraph|code|image|rule|aside)-id:\s*[A-Za-z][A-Za-z0-9_.:-]*\s*-->\n?/gm, "")
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

async function readStableContentSource(sourcePath, page) {
  const source = await readFile(sourcePath, "utf8")
  const normalized = addStableBlockIds(source, page)

  if (normalized !== source) {
    await writeFile(sourcePath, normalized)
  }

  return normalized
}

function addStableBlockIds(source, page) {
  const { prefix, body } = splitFrontMatterSource(source)
  const lines = body.replace(/\r\n/g, "\n").split("\n")
  const result = []
  const usedIds = collectStableIds(lines)

  for (let index = 0; index < lines.length;) {
    const line = lines[index]
    const trimmed = line.trim()
    const marker = stableIdFromComment(trimmed)

    if (marker) {
      const nextIndex = nextNonBlankLineIndex(lines, index + 1)
      const nextBlock = nextIndex === null ? null : markdownAddressableBlock(lines, nextIndex)
      if (nextBlock?.type === marker.type) {
        result.push(stableIdComment(marker.type, nextBlock.explicitId ?? marker.id))
      }
      index += 1
      continue
    }

    const block = markdownAddressableBlock(lines, index)

    if (block) {
      const previousMarker = stableIdFromComment(lastNonBlankLine(result)?.trim() ?? "")

      if (previousMarker?.type !== block.type) {
        const id = uniqueStableId(stableIdBase(block, page), usedIds)
        result.push(stableIdComment(block.type, id))
      }

      while (index < block.nextIndex) {
        result.push(lines[index])
        index += 1
      }
      continue
    }

    const nextIndex = nextMarkdownBlockIndex(lines, index)
    while (index < nextIndex) {
      result.push(lines[index])
      index += 1
    }
  }

  return `${prefix}${result.join("\n")}`
}

function splitFrontMatterSource(source) {
  if (!source.startsWith("---\n")) {
    return { prefix: "", body: source }
  }

  const end = source.indexOf("\n---", 4)
  if (end === -1) {
    return { prefix: "", body: source }
  }

  const closingLineEnd = source.indexOf("\n", end + 4)
  if (closingLineEnd === -1) {
    return { prefix: `${source}\n`, body: "" }
  }

  return {
    prefix: source.slice(0, closingLineEnd + 1),
    body: source.slice(closingLineEnd + 1)
  }
}

function collectStableIds(lines) {
  return new Set(lines.map(line => stableIdFromComment(line.trim())?.id).filter(Boolean))
}

function stableIdComment(type, id) {
  return `<!-- ${type}-id: ${id} -->`
}

function paragraphIdFromComment(line) {
  const marker = stableIdFromComment(line)
  return marker?.type === "paragraph" ? marker.id : null
}

function stableIdFromComment(line) {
  const match = line.match(/^<!--\s*(paragraph|code|image|rule|aside)-id:\s*([A-Za-z][A-Za-z0-9_.:-]*)\s*-->$/)
  return match ? { type: match[1], id: match[2] } : null
}

function markdownSourceLineNumber(lines, sourceIndex) {
  let lineNumber = 1

  for (let index = 0; index < sourceIndex; index += 1) {
    if (!stableIdFromComment(lines[index].trim())) {
      lineNumber += 1
    }
  }

  return lineNumber
}

function uniqueStableId(base, usedIds) {
  let id = base
  let suffix = 2

  while (usedIds.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }

  usedIds.add(id)
  return id
}

function lastNonBlankLine(lines) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].trim()) return lines[index]
  }

  return null
}

function nextNonBlankLineIndex(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index].trim()) return index
  }

  return null
}

function collectMarkdownParagraph(lines, startIndex) {
  const paragraph = []
  let index = startIndex

  while (index < lines.length && isMarkdownParagraphContinuation(lines, index)) {
    paragraph.push(lines[index].trim())
    index += 1
  }

  return {
    text: paragraph.join(" "),
    nextIndex: index
  }
}

function markdownAddressableBlock(lines, index) {
  const line = lines[index] ?? ""
  const trimmed = line.trim()

  if (!trimmed || stableIdFromComment(trimmed)) return null

  if (trimmed.startsWith("```")) {
    const explicitId = codeFenceExplicitId(lines, index)
    return {
      type: "code",
      text: explicitId ?? codeFenceLabel(lines, index),
      explicitId,
      nextIndex: nextMarkdownBlockIndex(lines, index)
    }
  }

  if (/^>\s?/.test(line)) {
    const quoteLines = collectBlockquoteLines(lines, index)
    const firstLine = quoteLines.find(quoteLine => quoteLine.trim())?.trim() ?? ""

    if (/^\*\*Interactive exhibit placeholder:/.test(firstLine)) return null

    return {
      type: /^\*\*Wizard/.test(firstLine) ? "rule" : "aside",
      text: stripInline(firstLine.replace(/^\*Aside:\*\s*/i, "Aside ")),
      nextIndex: index + quoteLines.length
    }
  }

  if (isMarkdownImageBlockStart(lines, index)) {
    const { text, nextIndex } = collectMarkdownParagraph(lines, index)
    return {
      type: "image",
      text: markdownImageLabel(text),
      nextIndex
    }
  }

  if (isMarkdownRawImageBlockStart(trimmed)) {
    return {
      type: "image",
      text: rawImageLabel(lines, index),
      nextIndex: nextMarkdownBlockIndex(lines, index)
    }
  }

  if (isMarkdownParagraphStart(lines, index)) {
    const { text, nextIndex } = collectMarkdownParagraph(lines, index)
    return {
      type: "paragraph",
      text,
      nextIndex
    }
  }

  return null
}

function stableIdBase(block, page) {
  if (block.explicitId) return block.explicitId

  const prefixByType = {
    paragraph: "p",
    code: "code",
    image: "image",
    rule: "rule",
    aside: "aside"
  }
  const pagePrefix = page.number || slugify(page.id, 4)
  const text = block.text || block.type

  return `${prefixByType[block.type]}-${pagePrefix}-${slugify(stripInline(text), 8)}`
}

function codeFenceLabel(lines, startIndex) {
  const opening = lines[startIndex].trim()
  const info = opening.slice(3).trim()
  const explicitId = codeFenceExplicitId(lines, startIndex)
  if (explicitId) return explicitId

  const language = normalizeLanguage(info)
  const firstCodeLine = lines.slice(startIndex + 1).find(line => line.trim() && line.trim() !== "```")?.trim()
  return [languageLabel(language), firstCodeLine].filter(Boolean).join(" ")
}

function codeFenceExplicitId(lines, startIndex) {
  const opening = lines[startIndex].trim()
  return opening.slice(3).trim().match(/\bid="([^"]+)"/)?.[1] ?? null
}

function collectBlockquoteLines(lines, startIndex) {
  const quoteLines = []
  let index = startIndex

  while (index < lines.length && /^>\s?/.test(lines[index])) {
    quoteLines.push(lines[index].replace(/^>\s?/, ""))
    index += 1
  }

  return quoteLines
}

function isMarkdownImageBlockStart(lines, index) {
  if (!isMarkdownParagraphStart(lines, index)) return false
  const { text } = collectMarkdownParagraph(lines, index)
  return /^!\[[^\]]*]\([^)]+\)$/.test(text.trim())
}

function markdownImageLabel(text) {
  const match = text.trim().match(/^!\[([^\]]*)]\(([^)]+)\)$/)
  return match ? (match[1] || path.basename(match[2]) || match[2]) : text
}

function isMarkdownRawImageBlockStart(trimmed) {
  return /^<img\b/i.test(trimmed) || /^<figure\b[\s\S]*<img\b/i.test(trimmed)
}

function rawImageLabel(lines, startIndex) {
  const endIndex = nextMarkdownBlockIndex(lines, startIndex)
  const html = lines.slice(startIndex, endIndex).join("\n")
  const imageTag = html.match(/<img\b[^>]*>/i)?.[0] ?? ""
  const attributes = parseHtmlAttributes(imageTag)
  return attributes.alt || path.basename(attributes.src || "") || "image"
}

function isMarkdownParagraphContinuation(lines, index) {
  const line = lines[index]
  const trimmed = line.trim()

  return Boolean(trimmed) && isMarkdownParagraphStart(lines, index)
}

function isMarkdownParagraphStart(lines, index) {
  const line = lines[index] ?? ""
  const trimmed = line.trim()

  return Boolean(trimmed) &&
    !stableIdFromComment(trimmed) &&
    !trimmed.startsWith("```") &&
    trimmed !== "$$" &&
    !/^(#{1,6})\s+/.test(line) &&
    !/^>\s?/.test(line) &&
    !isMarkdownTableStart(lines, index) &&
    !/^\s*[-*]\s+/.test(line) &&
    !isMarkdownRawHtmlBlockStart(trimmed)
}

function nextMarkdownBlockIndex(lines, startIndex) {
  const trimmed = lines[startIndex]?.trim() ?? ""

  if (!trimmed) return startIndex + 1

  if (trimmed.startsWith("```")) {
    let index = startIndex + 1
    while (index < lines.length && lines[index].trim() !== "```") index += 1
    return index < lines.length ? index + 1 : index
  }

  if (trimmed === "$$") {
    let index = startIndex + 1
    while (index < lines.length && lines[index].trim() !== "$$") index += 1
    return index < lines.length ? index + 1 : index
  }

  if (/^>\s?/.test(lines[startIndex])) {
    let index = startIndex
    while (index < lines.length && /^>\s?/.test(lines[index])) index += 1
    return index
  }

  if (isMarkdownTableStart(lines, startIndex)) {
    let index = startIndex
    while (index < lines.length && /^\s*\|/.test(lines[index])) index += 1
    return index
  }

  if (/^\s*[-*]\s+/.test(lines[startIndex])) {
    let index = startIndex
    while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) index += 1
    return index
  }

  if (isMarkdownRawHtmlBlockStart(trimmed)) {
    let index = startIndex
    const first = trimmed.toLowerCase()
    const closingTag = first.match(/^<([a-z0-9-]+)/)?.[1]
    const expectedClose = closingTag && !first.endsWith("/>") ? `</${closingTag}>` : null

    while (index < lines.length) {
      const current = lines[index].trim().toLowerCase()
      index += 1

      if (expectedClose && current.includes(expectedClose)) break
      if (!expectedClose) break
      if (!lines[index]?.trim()) break
    }

    return index
  }

  return startIndex + 1
}

function isMarkdownTableStart(lines, index) {
  return /^\s*\|/.test(lines[index] ?? "") && /^\s*\|?\s*:?-+:?\s*\|/.test(lines[index + 1] ?? "")
}

function isMarkdownRawHtmlBlockStart(trimmed) {
  return /^<(figure|style|ul|ol|div|p|img|table|section|aside|pre|h[1-6]|br)\b/i.test(trimmed)
}

async function writePwaManifest(book) {
  const manifest = {
    id: "./",
    name: book.title,
    short_name: "Wizards",
    description: book.subtitle ?? "A sideways look at writing software.",
    start_url: "./index.html?app=1",
    scope: "./",
    display: "standalone",
    background_color: "#f5f5f1",
    theme_color: "#7d2636",
    orientation: "any",
    categories: ["books", "education"],
    icons: [
      {
        src: "assets/images/icons/programming-for-wizards-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "assets/images/icons/programming-for-wizards-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  }

  await writeFile(
    path.join(siteDir, "manifest.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
}

async function writeServiceWorker() {
  const entries = (await listSiteFiles(siteDir))
    .map(file => ({
      file,
      url: `./${path.relative(siteDir, file).split(path.sep).join("/")}`
    }))
    .filter(entry => entry.url !== "./sw.js")
    .sort((a, b) => a.url.localeCompare(b.url))
  const revision = createHash("sha1")

  for (const entry of entries) {
    revision.update(entry.url)
    revision.update("\0")
    revision.update(await readFile(entry.file))
    revision.update("\0")
  }

  await writeFile(
    path.join(siteDir, "sw.js"),
    serviceWorkerSource(entries.map(entry => entry.url), revision.digest("hex").slice(0, 10))
  )
}

async function listSiteFiles(directory) {
  const result = []
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      result.push(...await listSiteFiles(file))
      continue
    }

    result.push(file)
  }

  return result
}

function serviceWorkerSource(urls, revision) {
  const cacheName = `programming-for-wizards-${revision}`

  return `const CACHE_NAME = ${JSON.stringify(cacheName)}
const PRECACHE_URLS = ${JSON.stringify(urls, null, 2)}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith("programming-for-wizards-") && key !== CACHE_NAME)
        .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", event => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then(response => response || caches.match("./index.html")))
    )
    return
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
        return response
      }))
  )
})
`
}

async function buildEpub(book, cover, pages) {
  const assets = new EpubAssetRegistry()
  const coverImage = await assets.addSiteAsset(cover.attributes.coverImage ?? "assets/images/programming-for-wizards-cover-sideways.png")

  for (const page of pages) {
    await assets.addImagesFromSource(page.body)
    if (page.kind === "interlude" && page.image) {
      await assets.addSiteAsset(`assets/images/interludes/${path.basename(page.image)}`)
    }
  }

  const coverDocument = {
    id: "cover",
    title: book.title,
    href: "text/cover.xhtml",
    html: epubDocument(book.title, epubCoverBody(book, cover, coverImage))
  }

  const pageDocuments = pages.map(page => {
    const renderer = new EpubMarkdownRenderer(page, { assets })
    const body = [
      epubPageHeader(page),
      page.kind === "interlude" ? epubInterludeImage(page, assets) : "",
      renderer.render(page.body)
    ].filter(Boolean).join("\n")

    return {
      id: page.id,
      title: page.title,
      href: `text/${page.id}.xhtml`,
      html: epubDocument(page.title, body),
      hasMath: body.includes("MathML")
    }
  })

  const documents = [coverDocument, ...pageDocuments]
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
  const publicationId = `urn:uuid:${uuidFromString(book.id)}`
  const opf = epubPackageDocument(book, documents, assets.entries, coverImage, publicationId, modified)
  const nav = epubNavDocument(book, documents)

  const zipEntries = [
    { name: "mimetype", data: "application/epub+zip", compress: false },
    { name: "META-INF/container.xml", data: epubContainerDocument() },
    { name: "EPUB/package.opf", data: opf },
    { name: "EPUB/nav.xhtml", data: nav },
    { name: "EPUB/styles/epub.css", data: epubCss() },
    ...documents.map(document => ({
      name: `EPUB/${document.href}`,
      data: document.html
    })),
    ...assets.entries.map(asset => ({
      name: `EPUB/${asset.href}`,
      data: asset.data
    }))
  ]

  await writeFile(epubPath, createZip(zipEntries))
}

class EpubAssetRegistry {
  constructor() {
    this.entries = []
    this.bySiteHref = new Map()
  }

  async addImagesFromSource(source) {
    const markdownImages = [...source.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map(match => match[1])
    const htmlImages = [...source.matchAll(/<img\b[^>]*\bsrc=(["']?)([^"'\s>]+)\1[^>]*>/gi)].map(match => match[2])

    for (const href of [...markdownImages, ...htmlImages]) {
      await this.addSiteAsset(href)
    }
  }

  async addSiteAsset(href) {
    if (!href) return null

    const mappedHref = epubExternalImageAssets.get(href)
    if (mappedHref) {
      const asset = await this.addSiteAsset(mappedHref)
      if (asset) this.bySiteHref.set(href, asset)
      return asset
    }

    if (isExternalUrl(href)) return null

    const cleanHref = href.split("#")[0].split("?")[0].replace(/^\.?\//, "")
    if (!cleanHref.startsWith("assets/images/")) return null
    if (this.bySiteHref.has(cleanHref)) return this.bySiteHref.get(cleanHref)

    const sourcePath = path.normalize(path.join(phaseDir, "assets", cleanHref.slice("assets/".length)))
    const distance = path.relative(path.join(phaseDir, "assets"), sourcePath)
    if (distance.startsWith("..") || path.isAbsolute(distance)) return null

    try {
      const data = await readFile(sourcePath)
      const hrefInEpub = `images/${cleanHref.slice("assets/images/".length)}`
      const asset = {
        id: `asset-${slugify(hrefInEpub)}`,
        href: hrefInEpub,
        textHref: `../${hrefInEpub}`,
        mediaType: mediaTypeForPath(hrefInEpub),
        dimensions: imageDimensionsForData(data, hrefInEpub),
        data
      }
      this.bySiteHref.set(cleanHref, asset)
      this.bySiteHref.set(href, asset)
      this.entries.push(asset)
      return asset
    } catch {
      return null
    }
  }

  textHrefFor(siteHref) {
    return this.assetFor(siteHref)?.textHref ?? null
  }

  assetFor(siteHref) {
    const cleanHref = String(siteHref).split("#")[0].split("?")[0].replace(/^\.?\//, "")
    return this.bySiteHref.get(cleanHref) ?? null
  }
}

function renderIndentedList(lines, startIndex, renderItem) {
  const entries = []
  let index = startIndex

  while (index < lines.length) {
    const match = lines[index].match(/^([ \t]*)[-*]\s+(.+)$/)
    if (!match) break

    entries.push({
      indent: markdownIndentWidth(match[1]),
      text: match[2].trim(),
      children: []
    })
    index += 1
  }

  const root = []
  const stack = [{ indent: entries[0]?.indent ?? 0, items: root }]

  for (const entry of entries) {
    while (stack.length > 1 && entry.indent < stack.at(-1).indent) {
      stack.pop()
    }

    const level = stack.at(-1)
    if (entry.indent > level.indent) {
      const parent = level.items.at(-1)
      if (parent) {
        stack.push({ indent: entry.indent, items: parent.children })
      }
    } else if (entry.indent < level.indent) {
      level.indent = entry.indent
    }

    stack.at(-1).items.push(entry)
  }

  const renderItems = items => `<ul>${items.map(item => (
    `<li>${renderItem(item.text)}${item.children.length ? renderItems(item.children) : ""}</li>`
  )).join("")}</ul>`

  return {
    html: renderItems(root),
    nextIndex: index
  }
}

function markdownIndentWidth(indentation) {
  let width = 0

  for (const character of indentation) {
    width += character === "\t" ? 4 - (width % 4) : 1
  }

  return width
}

class EpubMarkdownRenderer {
  constructor(page, options = {}) {
    this.page = page
    this.options = options
    this.usedIds = new Set()
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

      if (stableIdFromComment(trimmed)) {
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
    const id = this.uniqueId(`h-${this.page.number || this.page.id}-${slugify(plain)}`)
    return `<h${level} id="${escapeAttribute(id)}">${renderEpubInline(text, this.options)}</h${level}>`
  }

  renderCodeFence(lines, startIndex) {
    const code = []
    let index = startIndex + 1

    while (index < lines.length && lines[index].trim() !== "```") {
      code.push(lines[index])
      index += 1
    }

    return {
      html: `<pre class="code-block"><code>${escapeHtml(code.join("\n"))}</code></pre>`,
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

    return {
      html: renderEpubMath(math.join("\n").trim(), { display: true }),
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
        html: this.renderExhibit(quoteLines),
        nextIndex: index
      }
    }

    if (/^\*\*Wizard/.test(firstLine)) {
      return {
        html: this.renderRuleCards(quoteLines),
        nextIndex: index
      }
    }

    const paragraphs = quoteLines
      .join("\n")
      .split(/\n{2,}/)
      .map(chunk => `<p>${renderEpubInline(chunk.replace(/\n/g, " "), this.options)}</p>`)
      .join("\n")

    return {
      html: `<blockquote>${paragraphs}</blockquote>`,
      nextIndex: index
    }
  }

  renderExhibit(lines) {
    const firstLine = lines.find(line => line.trim())?.trim() ?? ""
    const idMatch = firstLine.match(/`([^`]+)`/)
    const title = humanizeId(idMatch?.[1] ?? "interactive exhibit")
    const bodyLines = lines.slice(1).filter(line => line.trim())

    return `<aside class="exhibit-placeholder">
<p class="exhibit-kicker">Interactive exhibit</p>
<h2>${escapeHtml(title)}</h2>
${bodyLines.map(line => `<p>${renderEpubInline(line, this.options)}</p>`).join("\n")}
</aside>`
  }

  renderRuleCards(lines) {
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

      if (current && trimmed) current.body.push(line)
    }

    return sections.map(section => `<aside class="wizard-rule">
<p class="rule-label">${escapeHtml(section.label)}</p>
<p>${renderEpubInline(section.body.join(" ").trim(), this.options)}</p>
</aside>`).join("\n")
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

    const cells = rows.map(row => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim()))
    const header = cells[0] ?? []
    const bodyRows = cells.slice(2)
    const renderedFallbackRows = bodyRows.map(row => {
      const pairs = row.map((cell, cellIndex) => {
        const label = header[cellIndex] || `Column ${cellIndex + 1}`
        return `<span class="table-cell"><strong>${renderEpubInline(label, this.options)}:</strong> ${renderEpubInline(cell, this.options)}</span>`
      })

      return `<p>${pairs.join("; ")}</p>`
    }).join("\n")

    return {
      html: `<figure class="table-figure">
<table>
<thead><tr>${header.map(cell => `<th scope="col">${renderEpubInline(cell, this.options)}</th>`).join("")}</tr></thead>
<tbody>
${bodyRows.map(row => `<tr>${row.map(cell => `<td>${renderEpubInline(cell, this.options)}</td>`).join("")}</tr>`).join("\n")}
</tbody>
</table>
<details class="table-fallback">
<summary>Table as text</summary>
${renderedFallbackRows}
</details>
</figure>`,
      nextIndex: index
    }
  }

  renderList(lines, startIndex) {
    return renderIndentedList(
      lines,
      startIndex,
      item => renderEpubInline(item, this.options)
    )
  }

  isRawHtmlBlockStart(trimmed) {
    return /^<(figure|style|ul|ol|div|p|img|table|section|aside|pre|h[1-6]|br|header|title|body|strong|em)\b/i.test(trimmed)
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

    const html = block.join("\n")
    const image = html.match(/^<img\b[^>]*>$/i)
    if (image) {
      const attributes = parseHtmlAttributes(image[0])
      return {
        html: renderEpubFigure(attributes.src ?? "", attributes.alt ?? "", this.options),
        nextIndex: index
      }
    }

    const figureImage = html.match(/<figure\b[\s\S]*?<img\b[^>]*>[\s\S]*?<\/figure>/i)
    if (figureImage) {
      const imageTag = figureImage[0].match(/<img\b[^>]*>/i)?.[0] ?? ""
      const attributes = parseHtmlAttributes(imageTag)
      const caption = figureImage[0].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]
      return {
        html: renderEpubFigure(attributes.src ?? "", attributes.alt ?? "", this.options, caption),
        nextIndex: index
      }
    }

    if (/^<section\b[^>]*class=["'][^"']*\binterlude-dialogue\b/i.test(block[0].trim())) {
      return {
        html: renderEpubDialogue(block),
        nextIndex: index
      }
    }

    return {
      html: `<pre class="html-example"><code>${escapeHtml(html)}</code></pre>`,
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
        stableIdFromComment(trimmed) ||
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
    const image = text.trim().match(/^!\[([^\]]*)]\(([^)]+)\)$/)

    return {
      html: image
        ? renderEpubFigure(image[2], image[1], this.options)
        : `<p>${renderEpubInline(text, this.options)}</p>`,
      nextIndex: index
    }
  }

  uniqueId(base) {
    let id = slugify(base, 16)
    let suffix = 2

    while (this.usedIds.has(id)) {
      id = `${slugify(base, 16)}-${suffix}`
      suffix += 1
    }

    this.usedIds.add(id)
    return id
  }
}

function epubCoverBody(book, cover, coverImage) {
  const renderer = new EpubMarkdownRenderer(cover, {})
  const image = coverImage
    ? `<figure class="cover-image"><img src="${escapeAttribute(coverImage.textHref)}" alt="${escapeAttribute(cover.attributes.coverImageAlt ?? book.title)}" /></figure>`
    : ""

  return `<section class="title-page">
${image}
<h1>${escapeHtml(book.title)}</h1>
${book.subtitle ? `<p class="subtitle">${escapeHtml(book.subtitle)}</p>` : ""}
${book.author ? `<p class="author">${escapeHtml(book.author)}</p>` : ""}
${renderer.render(cover.body)}
</section>`
}

function epubPageHeader(page) {
  if (page.kind === "interlude") return `<p class="chapter-kicker">Interlude</p>`
  const label = page.kind === "chapter" ? `Chapter ${page.number}` : (page.label || page.part)
  return `<header class="chapter-header">
<p class="chapter-kicker">${escapeHtml(page.part)}</p>
<p class="chapter-number">${escapeHtml(label)}</p>
</header>`
}

function epubInterludeImage(page, assets) {
  if (!page.image) return ""
  const href = assets.textHrefFor(`assets/images/interludes/${path.basename(page.image)}`)
  if (!href) return ""
  return `<figure class="interlude-image"><img src="${escapeAttribute(href)}" alt="${escapeAttribute(page.imageAlt || "")}" /></figure>`
}

function epubDocument(title, body, stylesheetHref = "../styles/epub.css") {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" type="text/css" href="${escapeAttribute(stylesheetHref)}" />
</head>
<body>
${body}
</body>
</html>
`
}

function epubNavDocument(book, documents) {
  return epubDocument("Contents", `<nav epub:type="toc" id="toc">
<h1>${escapeHtml(book.title)}</h1>
<ol>
${documents.map(document => `<li><a href="${escapeAttribute(document.href)}">${escapeHtml(document.title)}</a></li>`).join("\n")}
</ol>
</nav>`, "styles/epub.css")
}

function epubPackageDocument(book, documents, assets, coverImage, publicationId, modified) {
  const metadata = `<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="publication-id">${escapeHtml(publicationId)}</dc:identifier>
<dc:title>${escapeHtml(book.title)}</dc:title>
${book.subtitle ? `<dc:description>${escapeHtml(book.subtitle)}</dc:description>` : ""}
${book.author ? `<dc:creator>${escapeHtml(book.author)}</dc:creator>` : ""}
<dc:language>en</dc:language>
<meta property="dcterms:modified">${escapeHtml(modified)}</meta>
${coverImage ? `<meta name="cover" content="${escapeAttribute(coverImage.id)}" />` : ""}
</metadata>`

  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />`,
    `<item id="style" href="styles/epub.css" media-type="text/css" />`,
    ...documents.map(document => `<item id="${escapeAttribute(epubItemId(document.id))}" href="${escapeAttribute(document.href)}" media-type="application/xhtml+xml"${document.hasMath ? ` properties="mathml"` : ""} />`),
    ...assets.map(asset => `<item id="${escapeAttribute(asset.id)}" href="${escapeAttribute(asset.href)}" media-type="${escapeAttribute(asset.mediaType)}"${coverImage?.href === asset.href ? ` properties="cover-image"` : ""} />`)
  ].join("\n")

  const spineItems = documents.map(document => `<itemref idref="${escapeAttribute(epubItemId(document.id))}" />`).join("\n")

  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="publication-id">
${metadata}
<manifest>
${manifestItems}
</manifest>
<spine>
${spineItems}
</spine>
</package>
`
}

function epubContainerDocument() {
  return `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>
`
}

function epubCss() {
  return `body {
  color: #1f2421;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 133%;
  line-height: 1.55;
  margin: 0;
  padding: 0;
}

h1, h2, h3 {
  line-height: 1.2;
}

a {
  color: #7d2636;
}

img {
  height: auto;
  max-width: 100%;
}

figure {
  margin: 1.5rem 0;
  text-align: center;
}

figure > img {
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-height: 12.4em;
  max-height: 8lh;
  width: auto;
}

.inline-image {
  background: #ffffff;
  border-radius: 0.15em;
  height: 1.35em;
  max-width: none;
  padding: 0.04em 0.08em;
  vertical-align: -0.28em;
  width: auto;
}

.title-page, .chapter-header {
  text-align: center;
}

.cover-image img {
  max-height: 85vh;
}

.subtitle, .author, .chapter-kicker, .chapter-number, figcaption {
  color: #646a61;
}

.author, .chapter-kicker, .chapter-number, .rule-label, .exhibit-kicker {
  font-weight: bold;
}

blockquote, .wizard-rule, .exhibit-placeholder {
  border-left: 0.2rem solid #dcded6;
  margin: 1.5rem 0;
  padding-left: 1rem;
}

.wizard-rule {
  background: #f7ecec;
  padding: 0.8rem 1rem;
}

.exhibit-placeholder {
  background: #e8f2ef;
  padding: 0.8rem 1rem;
}

pre {
  background: #f0f1ed;
  overflow-wrap: anywhere;
  padding: 0.8rem;
  white-space: pre-wrap;
}

math[display="block"] {
  display: block;
  margin: 1rem 0;
  text-align: center;
}

math[display="inline"] {
  display: inline;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #dcded6;
  padding: 0.35rem;
}

.table-fallback {
  color: #646a61;
  font-size: 0.9em;
  margin-top: 0.75rem;
  text-align: left;
}

.table-fallback summary {
  color: #7d2636;
  font-weight: bold;
}

.table-fallback p {
  margin: 0.35rem 0;
}
`
}

function renderEpubInline(source, options = {}) {
  let text = source.replace(/\\([\\`*{}\[\]()#+\-.!_<>|&])/g, "$1")
  const placeholders = []
  const hold = value => {
    const key = `\u0000${placeholders.length}\u0000`
    placeholders.push(value)
    return key
  }

  text = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`))
  text = text.replace(/<img\b[^>]*>/gi, tag => {
    const attributes = parseHtmlAttributes(tag)
    return hold(renderEpubImage(attributes.src ?? "", attributes.alt ?? "", { ...options, inlineImage: true }))
  })
  text = text.replace(/<a\b[^>]*\bhref=(["']?)([^"'\s>]+)\1[^>]*>([\s\S]*?)<\/a>/gi, (_, _quote, href, label) => {
    return hold(`<a href="${escapeAttribute(href)}">${renderEpubInline(stripHtmlTags(label), options)}</a>`)
  })
  text = text.replace(/!\[([^\]]*)]\(([^)]+)\)/g, (_, alt, href) => hold(renderEpubImage(href, alt, { ...options, inlineImage: true })))
  text = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_, label, href) => {
    return hold(`<a href="${escapeAttribute(href)}">${renderEpubInline(label, options)}</a>`)
  })
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => hold(renderEpubMath(math, { display: false })))
  text = text.replace(/(^|[^\\$])\$((?:\\.|[^$\n])+?)\$/g, (_, prefix, math) => {
    return `${prefix}${hold(renderEpubMath(math, { display: false }))}`
  })

  text = applySmartPunctuation(text)
  text = escapeHtml(text)
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

function renderEpubFigure(src, alt, options = {}, caption = "") {
  const renderedCaption = caption ? `<figcaption>${renderEpubInline(stripHtmlTags(caption), options)}</figcaption>` : ""
  return `<figure>${renderEpubImage(src, alt, options)}${renderedCaption}</figure>`
}

function renderEpubMath(source, options = {}) {
  const display = options.display ? "block" : "inline"
  const content = renderEpubMathRow(source)
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${display}"><mrow>${content}</mrow></math>`
}

function renderEpubMathRow(source) {
  const normalized = String(source)
    .replace(/\s+/g, " ")
    .replace(/^\$\$|\$\$$/g, "")
    .trim()

  if (!normalized) return "<mtext></mtext>"

  const tokens = normalized.match(/\\times|[+=\-]|[A-Za-z0-9]+(?:\^\{?[A-Za-z0-9]+\}?)?/g) ?? []
  if (!tokens.length) return `<mtext>${escapeHtml(normalized)}</mtext>`

  return tokens.map(renderEpubMathToken).join("")
}

function renderEpubMathToken(token) {
  if (token === "\\times") return "<mo>&#x00D7;</mo>"
  if (/^[+=\-]$/.test(token)) return `<mo>${escapeHtml(token)}</mo>`

  const power = token.match(/^([A-Za-z0-9]+)\^\{?([A-Za-z0-9]+)\}?$/)
  if (power) {
    return `<msup>${renderEpubMathAtom(power[1])}${renderEpubMathAtom(power[2])}</msup>`
  }

  return renderEpubMathAtom(token)
}

function renderEpubMathAtom(token) {
  const tag = /^\d|^0x|^0o/i.test(token) ? "mn" : "mi"
  return `<${tag}>${escapeHtml(token)}</${tag}>`
}

function renderEpubImage(src, alt, options = {}) {
  const asset = options.assets?.assetFor(src)
  const localHref = asset?.textHref ?? null
  const className = options.inlineImage ? ` class="inline-image"` : ""
  const dimensions = !options.inlineImage && asset?.dimensions
    ? ` width="${asset.dimensions.width}" height="${asset.dimensions.height}"`
    : ""
  if (localHref) {
    return `<img${className} src="${escapeAttribute(localHref)}" alt="${escapeAttribute(alt)}"${dimensions} />`
  }

  if (isExternalUrl(src)) {
    const label = alt || src
    return `<a href="${escapeAttribute(src)}">${escapeHtml(label)}</a>`
  }

  return `<span>${escapeHtml(alt || src)}</span>`
}

function renderEpubDialogue(lines) {
  const paragraphs = lines
    .map(line => line.trim().match(/^<p[^>]*>([\s\S]*)<\/p>$/i)?.[1])
    .filter(Boolean)
    .map(line => `<p>${renderDialogueInline(line)}</p>`)
    .join("\n")

  return `<section class="interlude-dialogue">${paragraphs}</section>`
}

function renderDialogueInline(source) {
  const placeholders = []
  const hold = value => {
    const key = `\u0000${placeholders.length}\u0000`
    placeholders.push(value)
    return key
  }

  let text = source.replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, label) => hold(`<strong>${escapeHtml(label)}</strong>`))
  text = escapeHtml(stripDisallowedInlineHtml(text))

  for (let index = 0; index < placeholders.length; index += 1) {
    text = text.split(`\u0000${index}\u0000`).join(placeholders[index])
  }

  return text
}

function parseHtmlAttributes(tag) {
  const attributes = {}
  for (const match of tag.matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? ""
  }
  return attributes
}

function addAttributesToHtmlTag(html, attributes) {
  return String(html).replace(/^<([a-zA-Z][-\w]*)([^>]*)>/, (tag, tagName, rawAttributes) => {
    let nextAttributes = rawAttributes

    for (const [name, value] of Object.entries(attributes)) {
      const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "i")
      if (name === "class" && pattern.test(nextAttributes)) {
        nextAttributes = nextAttributes.replace(pattern, match => `${match.replace(/(["'])$/, ` ${value}$1`)}`)
        continue
      }

      nextAttributes = pattern.test(nextAttributes)
        ? nextAttributes.replace(pattern, value === "" ? ` ${name}` : ` ${name}="${escapeAttribute(value)}"`)
        : `${nextAttributes} ${value === "" ? name : `${name}="${escapeAttribute(value)}"`}`
    }

    return `<${tagName}${nextAttributes}>`
  })
}

function stripHtmlTags(source) {
  return String(source).replace(/<[^>]+>/g, "")
}

function stripDisallowedInlineHtml(source) {
  return String(source).replace(/<(?!\/?(?:strong|em)\b)[^>]+>/gi, "")
}

function isExternalUrl(href) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(String(href))
}

function mediaTypeForPath(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg"
  if (extension === ".png") return "image/png"
  if (extension === ".gif") return "image/gif"
  if (extension === ".svg") return "image/svg+xml"
  if (extension === ".webp") return "image/webp"
  return "application/octet-stream"
}

function imageDimensionsForData(data, filePath) {
  const extension = path.extname(filePath).toLowerCase()

  if (extension === ".png" && data.length >= 24) {
    return {
      width: data.readUInt32BE(16),
      height: data.readUInt32BE(20)
    }
  }

  if ((extension === ".jpg" || extension === ".jpeg") && data.length >= 4) {
    let offset = 2

    while (offset < data.length - 9) {
      if (data[offset] !== 0xff) {
        offset += 1
        continue
      }

      const marker = data[offset + 1]
      const segmentLength = data.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: data.readUInt16BE(offset + 7),
          height: data.readUInt16BE(offset + 5)
        }
      }

      offset += 2 + segmentLength
    }
  }

  return null
}

function epubItemId(value) {
  return `item-${slugify(value, 16)}`
}

function uuidFromString(value) {
  const bytes = createHash("sha1").update(String(value)).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function createZip(entries) {
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const entry of entries) {
    const name = Buffer.from(entry.name)
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data))
    const compressed = entry.compress === false ? data : deflateRawSync(data)
    const compressionMethod = entry.compress === false ? 0 : 8
    const crc = crc32(data)
    const { time, date } = zipTimestamp(new Date())
    const localHeader = Buffer.alloc(30)

    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(compressionMethod, 8)
    localHeader.writeUInt16LE(time, 10)
    localHeader.writeUInt16LE(date, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(compressed.length, 18)
    localHeader.writeUInt32LE(data.length, 22)
    localHeader.writeUInt16LE(name.length, 26)
    localHeader.writeUInt16LE(0, 28)

    localParts.push(localHeader, name, compressed)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(compressionMethod, 10)
    centralHeader.writeUInt16LE(time, 12)
    centralHeader.writeUInt16LE(date, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(compressed.length, 20)
    centralHeader.writeUInt32LE(data.length, 24)
    centralHeader.writeUInt16LE(name.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, name)

    offset += localHeader.length + name.length + compressed.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, centralDirectory, end])
}

function zipTimestamp(date) {
  const year = Math.max(date.getFullYear(), 1980)
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  }
}

const crcTable = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

class MarkdownRenderer {
  constructor(chapter, options = {}) {
    this.chapter = chapter
    this.options = options
    this.usedIds = new Set()
    this.anchors = []
    this.exhibits = []
    this.rules = []
    this.pendingParagraphId = null
    this.pendingBlockId = null
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

      const stableMarker = stableIdFromComment(trimmed)
      if (stableMarker) {
        const nextIndex = nextNonBlankLineIndex(lines, index + 1)
        const nextBlock = nextIndex === null ? null : markdownAddressableBlock(lines, nextIndex)
        this.pendingBlockId = nextBlock?.type === stableMarker.type ? stableMarker : null
        this.pendingParagraphId = this.pendingBlockId?.type === "paragraph" ? this.pendingBlockId.id : null
        index += 1
        continue
      }

      if (trimmed.startsWith("```")) {
        this.pendingParagraphId = null
        const result = this.renderCodeFence(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (trimmed === "$$") {
        this.pendingParagraphId = null
        this.pendingBlockId = null
        const result = this.renderMathBlock(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/)
      if (heading) {
        this.pendingParagraphId = null
        this.pendingBlockId = null
        html.push(this.renderHeading(heading[1].length, heading[2]))
        index += 1
        continue
      }

      if (/^>\s?/.test(line)) {
        this.pendingParagraphId = null
        const result = this.renderBlockquote(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (this.isTableStart(lines, index)) {
        this.pendingParagraphId = null
        this.pendingBlockId = null
        const result = this.renderTable(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (/^\s*[-*]\s+/.test(line)) {
        this.pendingParagraphId = null
        this.pendingBlockId = null
        const result = this.renderList(lines, index)
        html.push(result.html)
        index = result.nextIndex
        continue
      }

      if (this.isRawHtmlBlockStart(trimmed)) {
        this.pendingParagraphId = null
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
    const lineNumber = markdownSourceLineNumber(lines, startIndex)
    const stableId = this.consumePendingBlockId("code")
    const id = this.uniqueId(idMatch?.[1] ?? stableId ?? `code-${this.chapter.number}-${String(lineNumber).padStart(3, "0")}`)
    const language = normalizeLanguage(info)
    const code = []
    let index = startIndex + 1

    while (index < lines.length && lines[index].trim() !== "```") {
      code.push(lines[index])
      index += 1
    }

    this.addAnchor(id, "code", `${language || "code"} block`)
    const isBreakable = code.length > 8
    const className = `code-figure${isBreakable ? " code-figure-breakable" : ""}`
    const breakableAttributes = isBreakable ? ` data-breakable-code data-code-lines="${code.length}"` : ""

    return {
      html: `<figure id="${id}" class="${className}" data-note-target${breakableAttributes}>
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

    const lineNumber = markdownSourceLineNumber(lines, startIndex)
    const id = this.uniqueId(`math-${this.chapter.number}-${String(lineNumber).padStart(3, "0")}`)
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
      .map(chunk => {
        const rendered = renderInlineWithSideLinks(chunk.replace(/\n/g, " "), this.options)
        const className = hasWizardSideLink(rendered.links) ? ` class="has-side-wizard"` : ""
        return `<p${className}>${renderMarginSideLinks(rendered.links)}${rendered.html}${renderInlineSideLinks(rendered.links)}</p>`
      })
      .join("\n")
    const id = this.uniqueId(this.consumePendingBlockId("aside") ?? `aside-${this.chapter.number}-${slugify(stripInline(firstLine), 8)}`)
    this.addAnchor(id, "aside", stripInline(firstLine).slice(0, 120) || "aside")

    return {
      html: `<blockquote id="${id}" data-note-target>${inner}</blockquote>`,
      nextIndex: index
    }
  }

  renderExhibit(lines, startIndex) {
    const firstLine = lines.find(line => line.trim())?.trim() ?? ""
    const idMatch = firstLine.match(/`([^`]+)`/)
    const lineNumber = markdownSourceLineNumber(lines, startIndex)
    const exhibitId = idMatch?.[1] ?? `exhibit-${this.chapter.number}-${lineNumber}`
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
      const id = this.uniqueId(offset === 0
        ? this.consumePendingBlockId("rule") ?? `rule-${this.chapter.number}-${slugify(section.label)}`
        : `rule-${this.chapter.number}-${slugify(section.label)}`)
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

  isParagraphStart(lines, index) {
    const line = lines[index] ?? ""
    const trimmed = line.trim()

    return Boolean(trimmed) &&
      !paragraphIdFromComment(trimmed) &&
      !trimmed.startsWith("```") &&
      trimmed !== "$$" &&
      !/^(#{1,6})\s+/.test(line) &&
      !/^>\s?/.test(line) &&
      !this.isTableStart(lines, index) &&
      !/^\s*[-*]\s+/.test(line) &&
      !this.isRawHtmlBlockStart(trimmed)
  }

  renderTable(lines, startIndex) {
    const rows = []
    let index = startIndex

    while (index < lines.length && /^\s*\|/.test(lines[index])) {
      rows.push(lines[index])
      index += 1
    }

    const lineNumber = markdownSourceLineNumber(lines, startIndex)
    const id = this.uniqueId(`table-${this.chapter.number}-${String(lineNumber).padStart(3, "0")}`)
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
    return renderIndentedList(lines, startIndex, renderInline)
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

    const html = block.join("\n")
    const isStandaloneImage = block.length === 1 && /^<img\b/i.test(block[0].trim())
    const isImageFigure = /^<figure\b/i.test(block[0].trim()) && /<img\b/i.test(html)
    if (isStandaloneImage || isImageFigure) {
      const id = this.uniqueId(this.consumePendingBlockId("image") ?? `image-${this.chapter.number}-${String(markdownSourceLineNumber(lines, startIndex)).padStart(3, "0")}`)
      this.addAnchor(id, "image", rawImageLabel(lines, startIndex).slice(0, 120))

      return {
        html: isStandaloneImage
          ? `<figure id="${id}" class="image-block" data-note-target>${html}</figure>`
          : addAttributesToHtmlTag(html, { id, class: "image-block", "data-note-target": "" }),
        nextIndex: index
      }
    }

    return {
      html,
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
        stableIdFromComment(trimmed) ||
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
    const isImageBlock = /^!\[[^\]]*]\([^)]+\)$/.test(text.trim())
    const markerType = isImageBlock ? "image" : "paragraph"
    const id = this.uniqueId(
      this.consumePendingBlockId(markerType) ??
      this.pendingParagraphId ??
      `${isImageBlock ? "image" : "p"}-${this.chapter.number}-${slugify(stripInline(isImageBlock ? markdownImageLabel(text) : text), 8)}`
    )
    this.pendingParagraphId = null
    this.addAnchor(id, isImageBlock ? "image" : "paragraph", stripInline(isImageBlock ? markdownImageLabel(text) : text).slice(0, 120))
    const rendered = renderInlineWithSideLinks(text, this.options)
    const classes = [
      isImageBlock ? "image-block" : "",
      hasWizardSideLink(rendered.links) ? "has-side-wizard" : ""
    ].filter(Boolean).join(" ")

    return {
      html: `<p id="${id}"${classes ? ` class="${classes}"` : ""} data-note-target>${renderMarginSideLinks(rendered.links)}${rendered.html}${renderInlineSideLinks(rendered.links)}</p>`,
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

  consumePendingBlockId(type) {
    if (this.pendingBlockId?.type !== type) return null

    const id = this.pendingBlockId.id
    this.pendingBlockId = null
    if (type === "paragraph") this.pendingParagraphId = null
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
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#7d2636">
  <title>${escapeHtml(title)}</title>
  <script>
    (() => {
      const root = document.documentElement
      root.dataset.readerRuntime = "active"
      if (root.dataset.pageKind === "chapter") root.dataset.readerBoot = "pending"
      if (window.location.hash === "#book-end") root.dataset.initialPagePosition = "pending"
      try {
        const settings = JSON.parse(localStorage.getItem("programming-for-wizards.reader-settings") || "{}")
        if (typeof settings.font === "string") root.dataset.font = settings.font
        if (typeof settings.theme === "string") root.dataset.theme = settings.theme
        if (typeof settings.motion === "string") root.dataset.motion = settings.motion
        if (typeof settings.flow === "string") root.dataset.flow = settings.flow
        if (typeof settings.fontScale === "string") root.style.setProperty("--book-font-scale", settings.fontScale + "%")
        if (typeof settings.lineHeight === "string") root.style.setProperty("--book-line-height", String(Number(settings.lineHeight) / 100))
        if (typeof settings.columnWidth === "string") root.style.setProperty("--book-column-width", settings.columnWidth + "rem")
      } catch {}
    })()
  </script>
  <link rel="manifest" href="${relativeRoot}manifest.webmanifest">
  <link rel="apple-touch-icon" href="${relativeRoot}assets/images/icons/programming-for-wizards-icon-192.png">
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
    ${initialPagePositionScript()}
    ${readerMargin(relativeRoot, readerToolsDefault)}
  </div>
</body>
</html>`
}

function initialPagePositionScript() {
  return `<script>
    (() => {
      if (window.location.hash !== "#book-end") return
      const scroller = document.querySelector("[data-page-scroller]")
      if (!scroller) {
        delete document.documentElement.dataset.initialPagePosition
        return
      }
      scroller.style.scrollBehavior = "auto"
      scroller.scrollLeft = scroller.scrollWidth
      window.requestAnimationFrame(() => {
        scroller.style.scrollBehavior = "auto"
        scroller.scrollLeft = scroller.scrollWidth
        delete document.documentElement.dataset.initialPagePosition
      })
    })()
  </script>`
}

function chapterMap(book, chapters, currentId, relativeRoot, chapterMapDefault) {
  const grouped = new Map()
  const isOpen = chapterMapDefault === "open"

  for (const chapter of chapters) {
    if (chapter.kind === "interlude") continue
    if (!grouped.has(chapter.part)) grouped.set(chapter.part, [])
    grouped.get(chapter.part).push(chapter)
  }

  const groups = [...grouped.entries()].map(([part, partChapters]) => `
<section class="map-section">
  <h2>${escapeHtml(part)}</h2>
  <ol>
    ${partChapters.map(chapter => {
      const isCurrent = chapter.id === currentId
      return `<li><a${isCurrent ? ` aria-current="page"` : ""} href="${relativeRoot}chapters/${chapter.id}.html#book-start" data-chapter-start><span>${escapeHtml(chapter.label || chapter.number)}</span>${escapeHtml(chapter.title)}</a></li>`
    }).join("")}
  </ol>
</section>`).join("")

  return `<nav class="chapter-map" aria-label="Chapters">
  <button class="chapter-map-toggle" type="button" aria-expanded="${isOpen ? "true" : "false"}" aria-controls="chapter-map-panel" aria-label="${isOpen ? "Hide" : "Show"} contents" data-chapter-map-toggle>
    <span>Contents</span>
    <span class="chapter-map-toggle-state" data-chapter-map-label>${isOpen ? "Close" : "Open"}</span>
  </button>
  <div id="chapter-map-panel" class="chapter-map-panel" data-chapter-map-panel${isOpen ? "" : " hidden"}>
  <a class="book-title" href="${relativeRoot}index.html?cover=1" data-cover-start>${escapeHtml(book.title)}</a>
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

function indexLayout(book, chapters, cover) {
  const grouped = new Map()
  for (const chapter of chapters) {
    if (chapter.kind === "interlude") continue
    if (!grouped.has(chapter.part)) grouped.set(chapter.part, [])
    grouped.get(chapter.part).push(chapter)
  }

  const firstChapter = chapters.find(chapter => chapter.kind === "chapter") ?? chapters[0]
  const backMatter = chapters.find(chapter => chapter.kind === "back-matter")
  const artTitle = cover.attributes.artTitle ?? "The Flammarion Engraving"
  const artCredit = cover.attributes.artCredit ?? "Camille Flammarion, L'atmosphère: météorologie populaire, 1888. Public domain."
  const artUrl = cover.attributes.artUrl ?? "https://commons.wikimedia.org/wiki/File:The_Flammarion_Engraving_(ca._1888).jpg"
  const coverImage = cover.attributes.coverImage ?? "assets/images/programming-for-wizards-cover-sideways.png"
  const coverImageAlt = cover.attributes.coverImageAlt ?? "Cover of Programming for Wizards, with a Flammarion-inspired engraving above the title, subtitle, author name, and small technical manuscript ornaments."

  return `<main id="main" class="manuscript manuscript-index">
  <section class="book-cover book-cover-fixed" aria-labelledby="cover-title">
    <h1 id="cover-title" class="screen-reader-only">${escapeHtml(book.title)}</h1>
    <figure class="cover-full-art">
      <img src="${escapeAttribute(coverImage)}" width="1024" height="1536" alt="${escapeAttribute(coverImageAlt)}">
      <figcaption><a href="${escapeAttribute(artUrl)}">${escapeHtml(artTitle)}</a>. ${escapeHtml(artCredit)} Cover composition uses the public-domain engraving as its visual source.</figcaption>
    </figure>
    <div class="cover-actions">
      ${firstChapter ? `<a href="chapters/${firstChapter.id}.html#book-start" data-chapter-start>Start reading</a>` : ""}
      <button class="install-button" type="button" data-install-app hidden>Install</button>
      <a href="${epubFileName}" download>Download EPUB</a>
      ${backMatter ? `<a href="chapters/${backMatter.id}.html#book-start" data-chapter-start>About the author</a>` : ""}
    </div>
    <div class="cover-note">
      ${cover.html}
    </div>
  </section>
  <section class="index-toc" aria-labelledby="toc-heading">
    <h2 id="toc-heading">Contents</h2>
    ${[...grouped.entries()].map(([part, partChapters]) => `
    <section>
      <h3>${escapeHtml(part)}</h3>
      <ol>
        ${partChapters.map(chapter => `<li><a href="chapters/${chapter.id}.html#book-start" data-chapter-start><span>${escapeHtml(chapter.label || chapter.number)}</span>${escapeHtml(chapter.title)}</a></li>`).join("")}
      </ol>
    </section>`).join("")}
  </section>
</main>`
}

function coverOrnament() {
  return `<svg class="cover-ornament" viewBox="0 0 640 960" focusable="false" aria-hidden="true">
    <rect class="cover-ornament-frame" x="28" y="28" width="584" height="904" rx="20"/>
    <rect class="cover-ornament-inner" x="52" y="52" width="536" height="856" rx="12"/>
    <path class="cover-ornament-corner" d="M82 82c34 0 56 19 66 58M82 82c0 34 19 56 58 66M558 82c-34 0-56 19-66 58M558 82c0 34-19 56-58 66M82 878c34 0 56-19 66-58M82 878c0-34 19-56 58-66M558 878c-34 0-56-19-66-58M558 878c0-34-19-56-58-66"/>
    <path class="cover-ornament-rule" d="M180 892h280M180 68h280"/>
    <circle class="cover-ornament-seal" cx="320" cy="68" r="5"/>
    <circle class="cover-ornament-seal" cx="320" cy="892" r="5"/>
  </svg>`
}

function coverIconTerminal() {
  return `<svg viewBox="0 0 40 40" focusable="false" aria-hidden="true">
    <rect x="5" y="8" width="30" height="24" rx="3"/>
    <path d="M12 17l5 4-5 4M20 26h8"/>
  </svg>`
}

function coverIconBraces() {
  return `<svg viewBox="0 0 40 40" focusable="false" aria-hidden="true">
    <path d="M17 10c-5 0-5 5-5 7s-2 3-4 3c2 0 4 1 4 3s0 7 5 7M23 10c5 0 5 5 5 7s2 3 4 3c-2 0-4 1-4 3s0 7-5 7"/>
  </svg>`
}

function coverIconGraph() {
  return `<svg viewBox="0 0 40 40" focusable="false" aria-hidden="true">
    <circle cx="12" cy="28" r="4"/><circle cx="20" cy="12" r="4"/><circle cx="30" cy="26" r="4"/>
    <path d="M14 25l4-9M23 15l5 8M16 28h10"/>
  </svg>`
}

function coverIconBook() {
  return `<svg viewBox="0 0 40 40" focusable="false" aria-hidden="true">
    <path d="M8 11h10c3 0 5 2 5 5v15c0-3-2-5-5-5H8zM32 11H22c-3 0-5 2-5 5v15c0-3 2-5 5-5h10z"/>
    <path d="M12 17h6M12 22h6M26 17h4M26 22h4"/>
  </svg>`
}

function coverIconRobot() {
  return `<svg viewBox="0 0 40 40" focusable="false" aria-hidden="true">
    <rect x="10" y="13" width="20" height="17" rx="4"/>
    <path d="M20 13V8M8 22H5M35 22h-3M15 32h10"/>
    <circle cx="16" cy="21" r="1.8"/><circle cx="24" cy="21" r="1.8"/>
  </svg>`
}

function chapterLayout(chapter, renderedBody, previous, next, chapters, chapterIndex) {
  if (chapter.kind === "interlude") {
    return interludeLayout(chapter, renderedBody, previous, next, chapters, chapterIndex)
  }

  const pageWeights = chapters.map(entry => entry.wordCount || 1).join(",")
  const glyphNumber = Number.isFinite(Number(chapter.number)) ? Number(chapter.number) : 0
  const pageLabel = chapter.kind === "chapter" ? `Chapter ${chapter.number}` : (chapter.label || chapter.part)

  return `<main id="main" class="manuscript">
  <div class="book-progress" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-book-progress>
    <span data-book-progress-bar></span>
  </div>
  <div id="book-start" class="manuscript-pages" data-page-scroller data-book-chapter-id="${escapeAttribute(chapter.id)}" data-book-chapter-index="${chapterIndex}" data-book-page-weights="${escapeAttribute(pageWeights)}">
  <header class="chapter-header ${chapter.kind === "back-matter" ? "chapter-header-back-matter" : ""}">
    <p class="chapter-kicker">${escapeHtml(chapter.part)}</p>
    <p class="chapter-number">${escapeHtml(pageLabel)}</p>
    ${chapterGlyph(glyphNumber)}
  </header>
  ${renderedBody}
  <nav class="chapter-pagination" aria-label="Chapter navigation">
    ${previous ? `<a rel="prev" href="${previous.id}.html"><span>Previous</span>${escapeHtml(previous.title)}</a>` : "<span></span>"}
    ${next ? `<a rel="next" href="${next.id}.html"><span>Next</span>${escapeHtml(next.title)}</a>` : "<span></span>"}
  </nav>
  </div>
  <div class="page-turner" data-page-controls hidden>
    <button type="button" data-page-prev aria-label="Previous page"></button>
    <button type="button" data-page-next aria-label="Next page"></button>
  </div>
</main>`
}

function interludeLayout(chapter, renderedBody, previous, next, chapters, chapterIndex) {
  const pageWeights = chapters.map(entry => entry.wordCount || 1).join(",")
  const theme = slugify(chapter.theme || "parchment")
  const image = interludeImage(chapter)

  return `<main id="main" class="manuscript manuscript-interlude interlude-theme-${escapeAttribute(theme)}">
  <div class="book-progress" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-book-progress>
    <span data-book-progress-bar></span>
  </div>
  <div id="book-start" class="manuscript-pages interlude-pages" data-page-scroller data-book-chapter-id="${escapeAttribute(chapter.id)}" data-book-chapter-index="${chapterIndex}" data-book-page-weights="${escapeAttribute(pageWeights)}">
    <h1 id="${escapeAttribute(chapter.id)}-title" class="screen-reader-only">Interlude</h1>
    <article class="interlude-card" aria-labelledby="${escapeAttribute(chapter.id)}-title" data-note-target>
      ${image}
      ${renderedBody}
    </article>
    <nav class="chapter-pagination" aria-label="Chapter navigation">
      ${previous ? `<a rel="prev" href="${previous.id}.html"><span>Previous</span>${escapeHtml(previous.title)}</a>` : "<span></span>"}
      ${next ? `<a rel="next" href="${next.id}.html"><span>Next</span>${escapeHtml(next.title)}</a>` : "<span></span>"}
    </nav>
  </div>
  <div class="page-turner" data-page-controls hidden>
    <button type="button" data-page-prev aria-label="Previous page"></button>
    <button type="button" data-page-next aria-label="Next page"></button>
  </div>
</main>`
}

function interludeImage(chapter) {
  if (!chapter.image) return ""

  const imageName = path.basename(chapter.image)
  const alt = chapter.imageAlt || ""

  return `<figure class="interlude-illustration">
    <img src="../assets/images/interludes/${escapeAttribute(imageName)}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async">
  </figure>`
}

function applySmartPunctuation(source) {
  return source.replace(/(^|[^-])--(?!-)/g, "$1—")
}

function renderInline(source, options = {}) {
  let text = source.replace(/\\([\\`*{}\[\]()#+\-.!_<>|&])/g, "$1")
  const placeholders = []
  const hold = value => {
    const key = `\u0000${placeholders.length}\u0000`
    placeholders.push(value)
    return key
  }

  text = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`))
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, href) => hold(`<img src="${escapeAttribute(href)}" alt="${escapeAttribute(alt)}">`))
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    if (options.linkCollector) {
      const wizard = firstUnseenWizardForHref(href, options)
      options.linkCollector.push(wizard ? { type: "wizard", wizard } : { type: "link", href })
      return hold(renderInline(label))
    }

    return hold(`<a href="${escapeAttribute(href)}">${renderInline(label)}</a>`)
  })
  text = preserveInlineMath(text, hold)
  text = text.replace(/<[^>\n]+>/g, tag => hold(tag))
  text = applySmartPunctuation(text)
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

function renderInlineWithSideLinks(source, options = {}) {
  const links = []
  return {
    html: renderInline(source, { ...options, linkCollector: links }),
    links
  }
}

function renderMarginSideLinks(links) {
  if (!links.length) return ""

  const classes = ["side-links", "side-links-margin", hasWizardSideLink(links) ? "side-links-has-wizard" : ""]
    .filter(Boolean)
    .join(" ")

  return `<span class="${classes}" aria-label="Related links for this paragraph">
${links.map(renderSideLinkItem).join("\n")}
</span>`
}

function renderInlineSideLinks(links) {
  if (!links.length) return ""

  return `<span class="side-links side-links-inline" aria-label="Related links for this paragraph">
${links.map(renderInlineSideLinkItem).join("\n")}
</span>`
}

function hasWizardSideLink(links) {
  return links.some(link => typeof link === "object" && link?.type === "wizard")
}

function firstUnseenWizardForHref(href, options) {
  const wizard = options.wizards?.byHref.get(normalizeHref(href))
  if (!wizard || !options.wizardState || options.wizardState.seen.has(wizard.id)) {
    return null
  }

  options.wizardState.seen.add(wizard.id)
  return wizard
}

function renderSideLinkItem(item) {
  if (typeof item === "string") {
    return renderSideUrl(item)
  }

  if (item.type === "wizard") {
    return renderWizardCard(item.wizard)
  }

  return renderSideUrl(item.href)
}

function renderInlineSideLinkItem(item) {
  if (typeof item === "string") {
    return renderSideUrl(item)
  }

  if (item.type === "wizard") {
    return renderSideUrl(item.wizard.url)
  }

  return renderSideUrl(item.href)
}

function renderSideUrl(href) {
  return `<a href="${escapeAttribute(href)}" title="${escapeAttribute(href)}">${escapeHtml(href)}</a>`
}

function renderWizardCard(wizard) {
  const style = wizard.imagePosition
    ? ` style="--wizard-portrait-position: ${escapeAttribute(wizard.imagePosition)};"`
    : ""
  const license = wizard.license ? ` data-license="${escapeAttribute(wizard.license)}"` : ""
  const source = wizard.source ? ` data-source="${escapeAttribute(wizard.source)}"` : ""
  const note = wizard.note ? `<span class="wizard-card-note">${escapeHtml(wizard.note)}</span>` : ""

  return `<a class="wizard-card" href="${escapeAttribute(wizard.url)}" aria-label="Wikipedia: ${escapeAttribute(wizard.name)}"${license}${source}>
<span class="wizard-card-image"><img src="${escapeAttribute(wizard.image)}" alt="" loading="lazy"${style}></span>
<span class="wizard-card-name">${escapeHtml(wizard.name)}</span>
${note}
</a>`
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
