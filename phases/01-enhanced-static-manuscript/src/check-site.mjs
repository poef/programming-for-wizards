import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)))
const contentDir = path.join(rootDir, "content")
const bookPath = path.join(contentDir, "book.json")
const siteDir = path.join(rootDir, "www")
const siteChapterDir = path.join(siteDir, "chapters")
const manifestPath = path.join(siteDir, "data", "manifest.json")

const errors = []
const notes = []

async function main() {
  const book = await readBook()
  const chapters = await readSourceChapters(book)
  const manifest = await readJson(manifestPath)
  const htmlFiles = await listFiles(siteDir, isGeneratedBookHtml)
  const htmlByFile = new Map()
  const idsByFile = new Map()

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8")
    htmlByFile.set(file, html)
    idsByFile.set(file, collectIds(file, html))
  }

  await checkGeneratedChapters(chapters, manifest)
  checkManifestExpectations(book, chapters, manifest)
  checkGeneratedExhibits(chapters, manifest, htmlByFile)
  checkGeneratedRules(chapters, manifest, htmlByFile)
  checkNestedListRendering(htmlByFile)
  checkSmartPunctuationRendering(htmlByFile)
  checkChapterStartNavigation(htmlByFile)
  checkCoverStartNavigation(htmlByFile)
  checkHtmlPages(htmlByFile)
  await checkLocalLinks(htmlByFile, idsByFile)
  checkManifestAnchors(manifest, idsByFile)

  if (errors.length) {
    console.error("Site check failed:")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log("Site check passed:")
  for (const note of notes) {
    console.log(`- ${note}`)
  }
}

function isGeneratedBookHtml(file) {
  return file.endsWith(".html") && !path.relative(path.join(siteDir, "assets"), file).startsWith("..")
    ? false
    : file.endsWith(".html")
}

async function readBook() {
  return readJson(bookPath)
}

async function readSourceChapters(book) {
  const chapters = []
  const seenParts = new Set()
  const seenChapters = new Set()
  const seenNumbers = new Set()

  if (!Array.isArray(book.parts)) {
    fail("content/book.json must contain a parts array")
    return chapters
  }

  for (const [partIndex, part] of book.parts.entries()) {
    if (!part?.id || !part?.title || !Array.isArray(part.chapters)) {
      fail(`Invalid part entry in content/book.json at parts[${partIndex}]`)
      continue
    }

    if (seenParts.has(part.id)) {
      fail(`Duplicate part id in content/book.json: ${part.id}`)
    }
    seenParts.add(part.id)

    for (const [chapterIndex, chapter] of part.chapters.entries()) {
      if (!chapter?.id || !chapter?.number || !chapter?.source) {
        fail(`Invalid chapter entry in content/book.json at parts[${partIndex}].chapters[${chapterIndex}]`)
        continue
      }

      if (seenChapters.has(chapter.id)) {
        fail(`Duplicate chapter id in content/book.json: ${chapter.id}`)
      }
      seenChapters.add(chapter.id)

      if (seenNumbers.has(chapter.number)) {
        fail(`Duplicate chapter number in content/book.json: ${chapter.number}`)
      }
      seenNumbers.add(chapter.number)

      const sourceFile = safeContentPath(chapter.source)
      const source = await readFile(sourceFile, "utf8")

      chapters.push({
        id: chapter.id,
        number: chapter.number,
        file: chapter.source,
        source,
        htmlFile: path.join(siteChapterDir, `${chapter.id}.html`),
        exhibits: collectSourceExhibits(chapter.id, source),
        rules: collectSourceRules(chapter.id, source)
      })
    }
  }

  return chapters
}

function safeContentPath(relativePath) {
  const resolved = path.normalize(path.join(contentDir, relativePath))
  const distance = path.relative(contentDir, resolved)
  if (distance.startsWith("..") || path.isAbsolute(distance)) {
    fail(`Chapter source must stay inside content/: ${relativePath}`)
  }
  return resolved
}

function collectSourceExhibits(chapterId, source) {
  return [...source.matchAll(/^> \*\*Interactive exhibit placeholder: `([^`]+)`\*\*/gm)]
    .map(match => ({
      chapter: chapterId,
      id: match[1],
      line: lineNumberAt(source, match.index)
    }))
}

function collectSourceRules(chapterId, source) {
  return [...source.matchAll(/^> \*\*(Wizard[^*]+)\*\*$/gm)]
    .map(match => ({
      chapter: chapterId,
      label: match[1],
      line: lineNumberAt(source, match.index)
    }))
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"))
  } catch (error) {
    fail(`Could not read JSON from ${relative(file)}: ${error.message}`)
    return {}
  }
}

async function listFiles(directory, predicate) {
  const results = []
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      results.push(...await listFiles(file, predicate))
      continue
    }

    if (predicate(file)) {
      results.push(file)
    }
  }

  return results.sort((a, b) => a.localeCompare(b))
}

async function checkGeneratedChapters(chapters, manifest) {
  const manifestChapterIds = new Set((manifest.chapters ?? []).map(chapter => chapter.id))

  equal(
    manifest.chapters?.length ?? 0,
    chapters.length,
    `manifest chapter count should match source chapter count`
  )

  for (const chapter of chapters) {
    if (!manifestChapterIds.has(chapter.id)) {
      fail(`Manifest is missing chapter ${chapter.id}`)
    }

    if (!await exists(chapter.htmlFile)) {
      fail(`Generated HTML is missing for ${chapter.id}: ${relative(chapter.htmlFile)}`)
    }
  }

  notes.push(`${chapters.length} source chapters have generated HTML`)
}

function checkManifestExpectations(book, chapters, manifest) {
  if (manifest.id !== book.id) {
    fail(`Manifest id should be ${JSON.stringify(book.id)}, got ${JSON.stringify(manifest.id)}`)
  }

  if (manifest.title !== book.title) {
    fail(`Manifest title should be ${JSON.stringify(book.title)}, got ${JSON.stringify(manifest.title)}`)
  }

  if (manifest.features?.readerSettings !== true) {
    fail("Manifest should declare readerSettings: true")
  }

  if (manifest.features?.exhibitRuntime !== true) {
    fail("Manifest should declare exhibitRuntime: true")
  }

  if (manifest.features?.mathRendering !== true) {
    fail("Manifest should declare mathRendering: true")
  }

  for (const chapter of manifest.chapters ?? []) {
    const expectedUrl = `chapters/${chapter.id}.html`
    if (chapter.url !== expectedUrl) {
      fail(`Manifest chapter ${chapter.id} has url ${chapter.url}, expected ${expectedUrl}`)
    }
  }

  const sourceIds = new Set(chapters.map(chapter => chapter.id))
  for (const chapter of manifest.chapters ?? []) {
    if (!sourceIds.has(chapter.id)) {
      fail(`Manifest contains chapter without source file: ${chapter.id}`)
    }
  }
}

function checkGeneratedExhibits(chapters, manifest, htmlByFile) {
  const expected = chapters.flatMap(chapter => chapter.exhibits)
  const expectedKeys = new Set(expected.map(exhibit => key(exhibit.chapter, exhibit.id)))
  const manifestKeys = new Set((manifest.exhibits ?? []).map(exhibit => key(exhibit.chapter, exhibit.id)))
  const htmlKeys = new Set()

  for (const [file, html] of htmlByFile) {
    const chapter = chapterIdFromHtmlFile(file)
    for (const match of html.matchAll(/<aside\b[^>]*\bdata-exhibit-id="([^"]+)"/g)) {
      htmlKeys.add(key(chapter, match[1]))
    }
  }

  compareSets("exhibit in manifest", expectedKeys, manifestKeys)
  compareSets("exhibit in generated HTML", expectedKeys, htmlKeys)

  const interactive = (manifest.exhibits ?? []).filter(exhibit => exhibit.status === "interactive")
  notes.push(`${expected.length} exhibits are represented in manifest and HTML; ${interactive.length} interactive`)
}

function checkGeneratedRules(chapters, manifest, htmlByFile) {
  const expected = chapters.flatMap(chapter => chapter.rules)
  const expectedKeys = new Set(expected.map(rule => key(rule.chapter, rule.label)))
  const manifestKeys = new Set((manifest.rules ?? []).map(rule => key(rule.chapter, rule.label)))
  const htmlLabelsByChapter = new Set()

  for (const [file, html] of htmlByFile) {
    const chapter = chapterIdFromHtmlFile(file)
    for (const match of html.matchAll(/<p class="rule-label">([^<]+)<\/p>/g)) {
      htmlLabelsByChapter.add(key(chapter, decodeEntities(match[1])))
    }
  }

  compareSets("Wizard rule in manifest", expectedKeys, manifestKeys)
  compareSets("Wizard rule in generated HTML", expectedKeys, htmlLabelsByChapter)

  notes.push(`${expected.length} Wizard rule cards are represented in manifest and HTML`)
}

function checkNestedListRendering(htmlByFile) {
  const chapterFile = path.join(siteChapterDir, "06-the-web-as-document.html")
  const html = htmlByFile.get(chapterFile) ?? ""
  const expectedTree = /<ul><li>strong<ul><li>This is a strong<\/li><li>em<ul><li>and partially emphasized<\/li><\/ul><\/li><\/ul><\/li><li>em<ul><li>text<\/li><\/ul><\/li><\/ul>/

  if (!expectedTree.test(html)) {
    fail("Chapter 6 Markdown tree should render as nested HTML lists")
    return
  }

  notes.push("Indented Markdown lists retain their nested structure")
}

function checkSmartPunctuationRendering(htmlByFile) {
  const chapterFile = path.join(siteChapterDir, "06-the-web-as-document.html")
  const html = htmlByFile.get(chapterFile) ?? ""

  if (!html.includes("the meaning—the semantics—of a text")) {
    fail("Double hyphens in prose should render as em dashes")
    return
  }

  if (!html.includes("SGML—Standard Generalized Markup Language")) {
    fail("Double hyphens in link labels should render as em dashes")
    return
  }

  const codeChapterFile = path.join(siteChapterDir, "08-programming-languages-are-for-humans.html")
  const codeHtml = htmlByFile.get(codeChapterFile) ?? ""
  if (!codeHtml.includes("*-----------------------")) {
    fail("Smart punctuation should not alter hyphen runs inside code blocks")
    return
  }

  notes.push("Double hyphens in prose render as em dashes without changing code")
}


function checkChapterStartNavigation(htmlByFile) {
  let chapterStartLinks = 0

  for (const [file, html] of htmlByFile) {
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*\bdata-chapter-start\b[^>]*>/g)) {
      chapterStartLinks += 1
      if (!match[1].endsWith("#book-start")) {
        fail(`${relative(file)} has a chapter-start link without an explicit #book-start destination`)
      }
    }

    if (file.startsWith(siteChapterDir) && !html.includes('id="book-start"')) {
      fail(`${relative(file)} is missing the chapter-start anchor`)
    }
  }

  if (!chapterStartLinks) {
    fail("Generated pages should contain chapter-start links")
    return
  }

  notes.push(`${chapterStartLinks} contents links explicitly open chapters at their beginning`)
}

function checkCoverStartNavigation(htmlByFile) {
  let coverStartLinks = 0

  for (const [file, html] of htmlByFile) {
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*\bdata-cover-start\b[^>]*>/g)) {
      coverStartLinks += 1
      if (!match[1].endsWith("index.html?cover=1")) {
        fail(`${relative(file)} has a cover-start link without an explicit ?cover=1 destination`)
      }
    }
  }

  if (!coverStartLinks) {
    fail("Generated pages should contain explicit cover-start links")
    return
  }

  notes.push(`${coverStartLinks} book-title links explicitly open the cover`)
}


function checkHtmlPages(htmlByFile) {
  for (const [file, html] of htmlByFile) {
    const relativeFile = relative(file)

    if (html.includes("\u0000")) {
      fail(`${relativeFile} contains a NUL byte`)
    }

    const leakedPatterns = [
      ["code fence marker", /```/],
      ["raw exhibit placeholder label", /Interactive exhibit placeholder/],
      ["raw Wizard rule marker", /\*\*Wizard[^*]+\*\*/],
      ["Markdown image marker", /!\[[^\]]*]/],
      ["Markdown link marker", /\[[^\]]+]\([^)]+\)/]
    ]

    for (const [label, pattern] of leakedPatterns) {
      if (pattern.test(html)) {
        fail(`${relativeFile} contains leaked ${label}`)
      }
    }

    if (!/<script\s+defer\s+src="(?:\.\.\/)?assets\/book\.js"><\/script>/.test(html)) {
      fail(`${relativeFile} is missing the reader settings script`)
    }

    if (!/window\.MathJax\s*=/.test(html)) {
      fail(`${relativeFile} is missing the MathJax configuration`)
    }

    if (!/<script\s+defer\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@3\/es5\/tex-chtml\.js"><\/script>/.test(html)) {
      fail(`${relativeFile} is missing the MathJax loader`)
    }

    if (!html.includes('["\\\\[", "\\\\]"]')) {
      fail(`${relativeFile} has incorrectly escaped MathJax display delimiters`)
    }

    if (/<div class="math-display">\\\[/.test(html)) {
      fail(`${relativeFile} should emit display math with $$ delimiters, not \[ delimiters`)
    }

    if (!/<link\s+rel="stylesheet"\s+href="(?:\.\.\/)?assets\/exhibits\/exhibits\.css">/.test(html)) {
      fail(`${relativeFile} is missing the exhibit stylesheet`)
    }

    if (!/<script\s+defer\s+src="(?:\.\.\/)?assets\/exhibits\/exhibit-kit\.js"><\/script>/.test(html)) {
      fail(`${relativeFile} is missing the exhibit kit script`)
    }

    if (!/<script\s+type="module"\s+src="(?:\.\.\/)?assets\/exhibits\/exhibits\.js"><\/script>/.test(html)) {
      fail(`${relativeFile} is missing the exhibit registry script`)
    }

    if (!/<script\s+type="module"\s+src="(?:\.\.\/)?assets\/margin-notes-demo\.js\?v=[a-f0-9]{10}"><\/script>/.test(html)) {
      fail(`${relativeFile} is missing the versioned margin-notes demo script`)
    }

    if (!/\bdata-reader-tools-toggle\b/.test(html)) {
      fail(`${relativeFile} is missing the reader tools toggle`)
    }

    if (!/\bdata-reader-tools-panel\b/.test(html)) {
      fail(`${relativeFile} is missing the reader tools panel`)
    }

    if (!/\bdata-chapter-map-toggle\b/.test(html)) {
      fail(`${relativeFile} is missing the chapter map toggle`)
    }

    if (!/\bdata-chapter-map-panel\b/.test(html)) {
      fail(`${relativeFile} is missing the chapter map panel`)
    }

    const settingControls = [...html.matchAll(/\bdata-setting="/g)].length
    if (settingControls !== 7) {
      fail(`${relativeFile} has ${settingControls} reader setting controls, expected 7`)
    }

    if (relativeFile.includes(`${path.sep}chapters${path.sep}`) && !/\bdata-page-controls\b/.test(html)) {
      fail(`${relativeFile} is missing paged reader controls`)
    }

    if (relativeFile.includes(`${path.sep}chapters${path.sep}`) && !/\bdata-book-progress\b/.test(html)) {
      fail(`${relativeFile} is missing book progress controls`)
    }

    if (relativeFile.includes(`${path.sep}chapters${path.sep}`) && !/\bdata-book-page-weights\b/.test(html)) {
      fail(`${relativeFile} is missing book page weights`)
    }
  }

  notes.push(`${htmlByFile.size} generated HTML pages include reader controls and exhibit scripts`)
}

async function checkLocalLinks(htmlByFile, idsByFile) {
  for (const [file, html] of htmlByFile) {
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const url = match[1]
      if (shouldSkipUrl(url)) continue

      const resolved = resolveLocalUrl(file, url)
      if (!resolved) continue

      const { targetFile, fragment } = resolved
      if (!await exists(targetFile)) {
        fail(`${relative(file)} links to missing local file ${url}`)
        continue
      }

      if (fragment) {
        const ids = idsByFile.get(targetFile) ?? collectIds(targetFile, await readFile(targetFile, "utf8"))
        if (!ids.all.has(fragment)) {
          fail(`${relative(file)} links to missing fragment ${url}`)
        }
      }
    }
  }

  notes.push("all generated local href/src targets resolve")
}

function checkManifestAnchors(manifest, idsByFile) {
  for (const anchor of manifest.anchors ?? []) {
    const [urlPath, fragment] = String(anchor.url ?? "").split("#")
    const targetFile = path.join(siteDir, urlPath)
    const ids = idsByFile.get(targetFile)

    if (!ids) {
      fail(`Manifest anchor ${anchor.id} points to missing page ${anchor.url}`)
      continue
    }

    if (!fragment || !ids.all.has(fragment)) {
      fail(`Manifest anchor ${anchor.id} points to missing fragment ${anchor.url}`)
    }
  }

  notes.push(`${manifest.anchors?.length ?? 0} manifest anchors point to generated IDs`)
}

function collectIds(file, html) {
  const all = new Set()
  const duplicates = new Set()

  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    const id = match[1]
    if (all.has(id)) duplicates.add(id)
    all.add(id)
  }

  for (const id of duplicates) {
    fail(`${relative(file)} has duplicate id "${id}"`)
  }

  return { all, duplicates }
}

function compareSets(label, expected, actual) {
  for (const item of expected) {
    if (!actual.has(item)) {
      fail(`Missing ${label}: ${item}`)
    }
  }

  for (const item of actual) {
    if (!expected.has(item)) {
      fail(`Unexpected ${label}: ${item}`)
    }
  }
}

function shouldSkipUrl(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)
}

function resolveLocalUrl(fromFile, url) {
  const [rawPathAndQuery, rawFragment = ""] = url.split("#")
  const [rawPath] = rawPathAndQuery.split("?")
  const fragment = safeDecode(rawFragment)

  if (!rawPath) {
    return { targetFile: fromFile, fragment }
  }

  const cleanPath = safeDecode(rawPath)
  const targetFile = cleanPath.startsWith("/")
    ? path.normalize(path.join(siteDir, cleanPath.slice(1)))
    : path.normalize(path.join(path.dirname(fromFile), cleanPath))

  if (!targetFile.startsWith(siteDir)) {
    fail(`${relative(fromFile)} links outside generated site: ${url}`)
    return null
  }

  return { targetFile, fragment }
}

function chapterIdFromHtmlFile(file) {
  if (!file.startsWith(siteChapterDir)) return null
  return path.basename(file, ".html")
}

async function exists(file) {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

function equal(actual, expected, message) {
  if (actual !== expected) {
    fail(`${message}: expected ${expected}, got ${actual}`)
  }
}

function key(chapter, value) {
  return `${chapter}:${value}`
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split("\n").length
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function decodeEntities(value) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}

function relative(file) {
  return path.relative(rootDir, file)
}

function fail(message) {
  errors.push(message)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
