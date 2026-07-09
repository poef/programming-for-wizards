(() => {
  const storageKey = "programming-for-wizards.reader-settings"
  const readerToolsKey = "programming-for-wizards.reader-tools"
  const chapterMapKey = "programming-for-wizards.chapter-map"
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
  const assetBaseUrl = new URL(".", document.currentScript?.src || window.location.href)

  const defaults = {
    font: "publication",
    fontScale: "100",
    lineHeight: "160",
    columnWidth: "48",
    flow: "paged",
    typography: "browser",
    theme: "light",
    motion: "auto"
  }

  const loadSettings = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}")
      return { ...defaults, ...stored }
    } catch {
      return { ...defaults }
    }
  }

  const saveSettings = settings => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings))
    } catch {
      // Reader settings should still work for the current page if storage is unavailable.
    }
  }

  const loadReaderToolsState = () => {
    try {
      const stored = localStorage.getItem(readerToolsKey)
      if (stored === "open" || stored === "closed") return stored
    } catch {
      // The generated page default is still usable when storage is unavailable.
    }

    return document.documentElement.dataset.readerTools === "open" ? "open" : "closed"
  }

  const loadChapterMapState = () => {
    try {
      const stored = localStorage.getItem(chapterMapKey)
      if (stored === "open" || stored === "closed") return stored
    } catch {
      // The generated page default is still usable when storage is unavailable.
    }

    return document.documentElement.dataset.chapterMap === "open" ? "open" : "closed"
  }

  const saveReaderToolsState = value => {
    try {
      localStorage.setItem(readerToolsKey, value)
    } catch {
      // The current page can still open and close the panel without persistence.
    }
  }

  const saveChapterMapState = value => {
    try {
      localStorage.setItem(chapterMapKey, value)
    } catch {
      // The current page can still open and close the panel without persistence.
    }
  }

  const applySettings = settings => {
    const root = document.documentElement
    root.dataset.font = settings.font
    root.dataset.theme = settings.theme
    root.dataset.motion = settings.motion
    root.dataset.flow = settings.flow
    root.dataset.typography = settings.typography
    root.style.setProperty("--book-font-scale", `${settings.fontScale}%`)
    root.style.setProperty("--book-line-height", String(Number(settings.lineHeight) / 100))
    root.style.setProperty("--book-column-width", `${settings.columnWidth}rem`)
  }

  const syncControl = (control, settings) => {
    const key = control.dataset.setting
    if (key && hasOwn(settings, key)) {
      control.value = settings[key]
    }
  }

  const bindControl = (control, settings) => {
    const key = control.dataset.setting
    if (!key || !hasOwn(settings, key)) return

    const update = () => {
      settings[key] = control.value
      applySettings(settings)
      saveSettings(settings)
      document.dispatchEvent(new CustomEvent("reader-settings-change", { detail: { settings } }))
    }

    control.addEventListener("input", update)
    control.addEventListener("change", update)
  }

  const applyChapterMapState = value => {
    const root = document.documentElement
    const toggle = document.querySelector("[data-chapter-map-toggle]")
    const panel = document.querySelector("[data-chapter-map-panel]")
    const label = document.querySelector("[data-chapter-map-label]")
    const isOpen = value === "open"

    root.dataset.chapterMap = isOpen ? "open" : "closed"
    if (!toggle || !panel) return

    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false")
    toggle.setAttribute("aria-label", `${isOpen ? "Hide" : "Show"} contents`)
    panel.hidden = !isOpen

    if (label) {
      label.textContent = isOpen ? "Close" : "Open"
    }
  }

  const bindChapterMapToggle = () => {
    const toggle = document.querySelector("[data-chapter-map-toggle]")
    if (!toggle) return

    let current = loadChapterMapState()
    applyChapterMapState(current)

    toggle.addEventListener("click", () => {
      current = current === "open" ? "closed" : "open"
      applyChapterMapState(current)
      saveChapterMapState(current)
    })
  }

  const applyReaderToolsState = value => {
    const root = document.documentElement
    const toggle = document.querySelector("[data-reader-tools-toggle]")
    const panel = document.querySelector("[data-reader-tools-panel]")
    const label = document.querySelector("[data-reader-tools-label]")
    const isOpen = value === "open"

    root.dataset.readerTools = isOpen ? "open" : "closed"
    if (!toggle || !panel) return

    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false")
    toggle.setAttribute("aria-label", `${isOpen ? "Hide" : "Show"} reader tools`)
    panel.hidden = !isOpen

    if (label) {
      label.textContent = isOpen ? "Close" : "Open"
    }
  }

  const bindReaderToolsToggle = () => {
    const toggle = document.querySelector("[data-reader-tools-toggle]")
    if (!toggle) return

    let current = loadReaderToolsState()
    applyReaderToolsState(current)

    toggle.addEventListener("click", () => {
      current = current === "open" ? "closed" : "open"
      applyReaderToolsState(current)
      saveReaderToolsState(current)
    })
  }

  const bindPageControls = settings => {
    const root = document.documentElement
    const manuscript = document.querySelector("[data-page-scroller]")
    const controls = document.querySelector("[data-page-controls]")
    const previous = document.querySelector("[data-page-prev]")
    const next = document.querySelector("[data-page-next]")
    const status = document.querySelector("[data-page-status]")
    const progress = document.querySelector("[data-book-progress]")
    const progressBar = document.querySelector("[data-book-progress-bar]")
    if (!manuscript || !controls || !previous || !next) return

    const previousChapter = document.querySelector(".chapter-pagination a[rel='prev']")
    const nextChapter = document.querySelector(".chapter-pagination a[rel='next']")
    const pageWeights = (manuscript.dataset.bookPageWeights || "")
      .split(",")
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0)
    const chapterIndex = Number(manuscript.dataset.bookChapterIndex || 0)
    let pageCount = 1
    let pageIndex = 0
    let resizeFrame = 0
    let effectiveFlow = root.dataset.flow
    let openAtChapterEnd = window.location.hash === "#book-end"

    if (openAtChapterEnd) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
    }

    const isPaged = () => document.documentElement.dataset.flow === "paged"
    const canUsePagedFlow = () => {
      if (settings.flow !== "paged") return false

      const rect = manuscript.getBoundingClientRect()
      const rootFontSize = Number.parseFloat(getComputedStyle(root).fontSize) || 16
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (effectiveFlow === "paged") {
        return viewportWidth >= 66 * rootFontSize && rect.width >= 460 && viewportHeight >= 590
      }

      return viewportWidth >= 69 * rootFontSize && rect.width >= 620 && viewportHeight >= 650
    }

    const applyEffectiveFlow = () => {
      const flow = canUsePagedFlow() ? "paged" : "scroll"
      effectiveFlow = flow
      root.dataset.flow = flow
      root.dataset.flowFallback = settings.flow === "paged" && flow === "scroll" ? "scroll" : "none"
      return flow
    }

    const pageGap = () => Number.parseFloat(getComputedStyle(manuscript).columnGap) || 0
    const pageStride = () => Math.max(1, manuscript.clientWidth + pageGap())
    const pageCounts = () => {
      const currentWeight = pageWeights[chapterIndex] || 1
      const pagesPerWord = pageCount / currentWeight
      return pageWeights.map(weight => Math.max(1, Math.round(weight * pagesPerWord)))
    }

    const globalPageInfo = () => {
      const counts = pageCounts()
      const before = counts.slice(0, chapterIndex).reduce((total, count) => total + count, 0)
      const total = counts.reduce((sum, count) => sum + count, 0)
      return {
        current: before + pageIndex + 1,
        total: Math.max(total, before + pageCount)
      }
    }

    const navigateToPreviousChapter = () => {
      if (!previousChapter) return
      const url = new URL(previousChapter.href)
      url.hash = "book-end"
      window.location.href = url.href
    }

    const navigateToNextChapter = () => {
      if (nextChapter) window.location.href = nextChapter.href
    }

    const update = ({ snap = false } = {}) => {
      const flow = applyEffectiveFlow()

      if (flow !== "paged") {
        controls.hidden = true
        manuscript.scrollLeft = 0
        if (progress) progress.hidden = true
        return
      }

      controls.hidden = false
      if (progress) progress.hidden = false

      const stride = pageStride()
      pageCount = Math.max(1, Math.round((manuscript.scrollWidth + pageGap()) / stride))

      if (openAtChapterEnd) {
        pageIndex = pageCount - 1
        manuscript.scrollLeft = pageIndex * stride
      } else if (snap) {
        pageIndex = Math.min(pageCount - 1, Math.max(0, pageIndex))
        manuscript.scrollLeft = pageIndex * stride
      } else {
        pageIndex = Math.min(pageCount - 1, Math.max(0, Math.round(manuscript.scrollLeft / stride)))
      }

      const global = globalPageInfo()
      const progressValue = global.total > 1 ? ((global.current - 1) / (global.total - 1)) * 100 : 100

      if (status) status.textContent = `Page ${global.current} of ${global.total}`
      previous.disabled = pageIndex === 0 && !previousChapter
      next.disabled = pageIndex >= pageCount - 1 && !nextChapter
      previous.setAttribute("aria-label", pageIndex === 0 ? "Previous chapter" : "Previous page")
      next.setAttribute("aria-label", pageIndex >= pageCount - 1 ? "Next chapter" : "Next page")

      if (progressBar) {
        progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progressValue / 100))})`
      }

      if (progress) {
        progress.setAttribute("aria-valuenow", String(Math.round(progressValue)))
      }
    }

    const goToPage = (index, behavior = settings.motion === "reduced" ? "auto" : "smooth") => {
      if (!isPaged()) return
      openAtChapterEnd = false
      if (index < 0) {
        navigateToPreviousChapter()
        return
      }
      if (index >= pageCount) {
        navigateToNextChapter()
        return
      }

      const nextIndex = Math.min(pageCount - 1, Math.max(0, index))
      manuscript.scrollTo({ left: nextIndex * pageStride(), behavior })
      pageIndex = nextIndex
      window.setTimeout(update, 160)
    }

    previous.addEventListener("click", () => goToPage(pageIndex - 1))
    next.addEventListener("click", () => goToPage(pageIndex + 1))
    manuscript.addEventListener("scroll", update, { passive: true })

    document.addEventListener("keydown", event => {
      if (!isPaged()) return
      if (/^(?:input|select|textarea|button)$/i.test(event.target?.tagName ?? "")) return

      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault()
        goToPage(pageIndex + 1)
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault()
        goToPage(pageIndex - 1)
      }
    })

    const scheduleResizeUpdate = () => {
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(() => update({ snap: true }))
    }

    const resizeObserver = new ResizeObserver(scheduleResizeUpdate)
    resizeObserver.observe(manuscript)
    window.addEventListener("resize", scheduleResizeUpdate)
    document.addEventListener("reader-settings-change", () => update({ snap: true }))
    document.addEventListener("reader-layout-change", () => update({ snap: true }))
    window.addEventListener("load", () => {
      window.setTimeout(() => {
        update()
      }, 100)
    })
    window.addEventListener("hashchange", () => window.setTimeout(update, 100))
    window.setTimeout(update, 0)
  }

  const bindPretextTypography = settings => {
    const targetSelector = [
      ".manuscript-pages > h1",
      ".manuscript-pages > h2",
      ".manuscript-pages > h3",
      ".manuscript-pages > h4",
      ".manuscript-pages > p",
      ".manuscript-index h1",
      ".manuscript-index .lede"
    ].join(",")
    let pretextPromise = null
    let resizeFrame = 0
    let renderToken = 0

    const loadPretext = () => {
      pretextPromise ??= import(new URL("pretext/rich-inline.js", assetBaseUrl).href)
      return pretextPromise
    }

    const isMarginAnchor = node =>
      node.nodeType === Node.ELEMENT_NODE &&
      (node.classList.contains("margin-anchor") || node.classList.contains("anchor-link"))

    const sourceFor = target => target.querySelector(":scope > .pretext-source")
    const renderFor = target => target.querySelector(":scope > .pretext-render")

    const canRenderTarget = target => {
      if (target.closest(".chapter-header, .chapter-pagination, .wizard-rule, .exhibit-placeholder, figure, table")) {
        return false
      }

      if (target.matches(".manuscript-pages > h1 + p")) {
        return false
      }

      if (target.querySelector("img")) {
        return false
      }

      return true
    }

    const ensurePretextStructure = target => {
      let source = sourceFor(target)
      let render = renderFor(target)

      if (!source) {
        source = document.createElement("span")
        source.className = "pretext-source"
        source.setAttribute("aria-hidden", "true")
        source.inert = true

        for (const node of [...target.childNodes]) {
          if (!isMarginAnchor(node)) source.append(node)
        }

        target.prepend(source)
      }

      if (!render) {
        render = document.createElement("span")
        render.className = "pretext-render"
        source.after(render)
      }

      return { source, render }
    }

    const restoreTarget = target => {
      const source = sourceFor(target)
      const render = renderFor(target)

      if (source) {
        while (source.firstChild) {
          target.insertBefore(source.firstChild, source)
        }
        source.remove()
      }

      render?.remove()
      target.classList.remove("pretext-active")
    }

    const restoreAll = () => {
      for (const target of document.querySelectorAll(".pretext-active")) {
        restoreTarget(target)
      }
    }

    const computedLineHeight = style => {
      const lineHeight = Number.parseFloat(style.lineHeight)
      if (Number.isFinite(lineHeight)) return lineHeight

      const fontSize = Number.parseFloat(style.fontSize)
      return (Number.isFinite(fontSize) ? fontSize : 16) * 1.2
    }

    const countSpaces = text => {
      const matches = text.trim().match(/\s+/g)
      return matches ? matches.length : 0
    }

    const cloneInlineElement = element => {
      const tagName = element.tagName.toLowerCase()
      const allowed = new Set(["a", "em", "strong", "code", "i", "b", "sub", "sup", "small", "mark", "kbd", "samp", "var"])
      const clone = document.createElement(allowed.has(tagName) ? tagName : "span")

      if (tagName === "a") {
        for (const attribute of ["href", "title", "target", "rel"]) {
          const value = element.getAttribute(attribute)
          if (value) clone.setAttribute(attribute, value)
        }
      }

      if (tagName === "code" || tagName === "span") {
        const className = element.getAttribute("class")
        if (className) clone.setAttribute("class", className)
      }

      return clone
    }

    const ancestorsFor = (node, source) => {
      const ancestors = []
      let current = node.parentElement

      while (current && current !== source) {
        ancestors.unshift(current)
        current = current.parentElement
      }

      return ancestors
    }

    const collectRichItems = source => {
      const items = []

      const visit = node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!node.nodeValue) return

          const parent = node.parentElement || source
          const style = getComputedStyle(parent)
          const letterSpacing = Number.parseFloat(style.letterSpacing)

          items.push({
            text: node.nodeValue,
            font: style.font,
            letterSpacing: Number.isFinite(letterSpacing) ? letterSpacing : 0,
            break: parent.closest("code, kbd, samp") ? "never" : "normal",
            ancestors: ancestorsFor(node, source)
          })
          return
        }

        if (node.nodeType !== Node.ELEMENT_NODE || isMarginAnchor(node)) return

        for (const child of node.childNodes) {
          visit(child)
        }
      }

      for (const child of source.childNodes) {
        visit(child)
      }

      return items
    }

    const appendFragment = (lineNode, item, text) => {
      if (!item || !text) return

      const textNode = document.createTextNode(text)
      let outer = null
      let current = null

      for (const ancestor of item.ancestors) {
        const clone = cloneInlineElement(ancestor)
        if (!outer) {
          outer = clone
        } else {
          current.append(clone)
        }
        current = clone
      }

      if (current) {
        current.append(textNode)
        lineNode.append(outer)
      } else {
        lineNode.append(textNode)
      }
    }

    const lineSpaceCount = line =>
      line.fragments.reduce((total, fragment) => {
        return total + (fragment.gapBefore > 0 ? 1 : 0) + countSpaces(fragment.text)
      }, 0)

    const trimLineEnd = lineNode => {
      let current = lineNode.lastChild

      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          current.nodeValue = current.nodeValue.replace(/\s+$/, "")
          if (current.nodeValue) return
          const previous = current.previousSibling
          current.remove()
          current = previous
          continue
        }

        if (current.nodeType === Node.ELEMENT_NODE && current.lastChild) {
          current = current.lastChild
          continue
        }

        return
      }
    }

    const clearOrphanBreaks = () => {
      for (const target of document.querySelectorAll(".pretext-orphan-break")) {
        target.classList.remove("pretext-orphan-break")
        target.style.breakBefore = ""
      }

      for (const line of document.querySelectorAll(".pretext-line-break")) {
        line.classList.remove("pretext-line-break")
        line.style.breakBefore = ""
      }
    }

    const applyOrphanControl = () => {
      clearOrphanBreaks()

      const root = document.documentElement
      const scroller = document.querySelector("[data-page-scroller]")
      if (!scroller || root.dataset.flow !== "paged") return

      const targets = [...scroller.querySelectorAll(":scope > p.pretext-active")]
      if (!targets.length) return

      const gap = Number.parseFloat(getComputedStyle(scroller).columnGap) || 0
      const stride = Math.max(1, scroller.clientWidth + gap)
      const preferredLinesAtSplit = 3

      const lineColumn = line => {
        const rect = line.getBoundingClientRect()
        const scrollerRect = scroller.getBoundingClientRect()
        const x = rect.left - scrollerRect.left + scroller.scrollLeft
        return Math.max(0, Math.floor((x + gap / 2) / stride))
      }

      const runLength = (lines, start, column) => {
        let count = 0

        for (let index = start; index < lines.length; index += 1) {
          if (lineColumn(lines[index]) !== column) break
          count += 1
        }

        return count
      }

      const addLineBreak = line => {
        line.classList.add("pretext-line-break")
        line.style.breakBefore = "column"
      }

      for (let pass = 0; pass < 8; pass += 1) {
        let changed = false

        for (const target of targets) {
          const lines = [...target.querySelectorAll(":scope > .pretext-render > .pretext-line")]
          const minimumLinesAtSplit = lines.length < preferredLinesAtSplit * 2 ? 2 : preferredLinesAtSplit
          if (lines.length <= minimumLinesAtSplit) continue

          let runStart = 0
          let previousColumn = lineColumn(lines[0])

          for (let index = 1; index < lines.length; index += 1) {
            const column = lineColumn(lines[index])
            if (column === previousColumn) continue

            const previousCount = index - runStart
            const nextCount = runLength(lines, index, column)

            if (previousCount > 0 && previousCount < minimumLinesAtSplit && !target.classList.contains("pretext-orphan-break")) {
              target.classList.add("pretext-orphan-break")
              target.style.breakBefore = "column"
              changed = true
              break
            }

            if (nextCount > 0 && nextCount < minimumLinesAtSplit) {
              const breakIndex = Math.max(runStart, index - (minimumLinesAtSplit - nextCount))
              const breakLine = lines[breakIndex]
              const previousCountAfterBreak = breakIndex - runStart

              if (breakIndex === 0 && !target.classList.contains("pretext-orphan-break")) {
                target.classList.add("pretext-orphan-break")
                target.style.breakBefore = "column"
                changed = true
                break
              }

              if (previousCountAfterBreak < minimumLinesAtSplit) {
                if (!target.classList.contains("pretext-orphan-break")) {
                  target.classList.add("pretext-orphan-break")
                  target.style.breakBefore = "column"
                  changed = true
                  break
                }

                continue
              }

              if (breakLine && !breakLine.classList.contains("pretext-line-break")) {
                addLineBreak(breakLine)
                changed = true
                break
              }
            }

            runStart = index
            previousColumn = column
          }

          if (changed) {
            break
          }
        }

        if (!changed) break
      }
    }

    const renderTarget = (target, pretext) => {
      if (!canRenderTarget(target)) {
        restoreTarget(target)
        return
      }

      const { source, render } = ensurePretextStructure(target)
      const items = collectRichItems(source)
      const style = getComputedStyle(target)
      const availableWidth = target.clientWidth
      const lineHeight = computedLineHeight(style)
      const isProse = target.tagName === "P"

      if (!availableWidth || !items.some(item => item.text.trim())) {
        restoreTarget(target)
        return
      }

      const prepared = pretext.prepareRichInline(items)
      const renderAtWidth = maxWidth => {
        const lines = []
        let cursor
        let guard = 0

        while (guard < 1000) {
          const lineRange = pretext.layoutNextRichInlineLineRange(prepared, maxWidth, cursor)
          if (!lineRange) break
          const line = pretext.materializeRichInlineLineRange(prepared, lineRange)
          lines.push(line)
          cursor = line.end
          guard += 1
        }

        render.textContent = ""
        render.style.lineHeight = `${lineHeight}px`

        for (const [index, line] of lines.entries()) {
          const lineNode = document.createElement("span")
          lineNode.className = "pretext-line"

          for (const fragment of line.fragments) {
            if (fragment.gapBefore > 0) lineNode.append(" ")
            appendFragment(lineNode, items[fragment.itemIndex], fragment.text)
          }

          trimLineEnd(lineNode)

          if (isProse && index < lines.length - 1) {
            const spaces = lineSpaceCount(line)
            const extra = spaces > 0 ? Math.max(0, (maxWidth - line.width) / spaces) : 0
            if (extra > 0) {
              const fontSize = Number.parseFloat(style.fontSize) || 16
              lineNode.style.wordSpacing = `${Math.min(extra, fontSize * 0.5)}px`
            }
          }

          render.append(lineNode)
        }
      }

      let layoutWidth = availableWidth
      renderAtWidth(layoutWidth)
      target.classList.add("pretext-active")

      for (let pass = 0; pass < 3; pass += 1) {
        const overflow = [...render.querySelectorAll(":scope > .pretext-line")]
          .reduce((maximum, line) => Math.max(maximum, line.scrollWidth - availableWidth), 0)

        if (overflow <= 1) break
        layoutWidth = Math.max(availableWidth * 0.75, layoutWidth - overflow - 2)
        renderAtWidth(layoutWidth)
      }
    }

    const renderAll = async () => {
      const token = ++renderToken

      if (settings.typography !== "pretext") {
        restoreAll()
        document.dispatchEvent(new CustomEvent("reader-layout-change"))
        return
      }

      let pretext
      try {
        pretext = await loadPretext()
      } catch {
        restoreAll()
        document.documentElement.dataset.typography = "browser"
        document.dispatchEvent(new CustomEvent("reader-layout-change"))
        return
      }

      if (token !== renderToken) return

      for (const target of document.querySelectorAll(targetSelector)) {
        renderTarget(target, pretext)
      }

      applyOrphanControl()
      document.dispatchEvent(new CustomEvent("reader-layout-change"))
    }

    const scheduleRender = () => {
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(renderAll)
    }

    window.addEventListener("resize", scheduleRender)
    document.addEventListener("reader-settings-change", scheduleRender)
    window.addEventListener("load", () => window.setTimeout(scheduleRender, 100))

    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleRender).catch(() => {})
    }

    scheduleRender()
  }

  const addAnchorLinks = () => {
    for (const target of document.querySelectorAll("[data-note-target][id]")) {
      if (target.querySelector(":scope > .margin-anchor")) continue

      const anchor = document.createElement("a")
      anchor.className = "margin-anchor"
      anchor.href = `#${target.id}`
      anchor.setAttribute("aria-label", "Copy link to this passage")
      anchor.textContent = "#"
      target.append(anchor)
    }
  }

  const settings = loadSettings()
  const controls = document.querySelectorAll("[data-setting]")

  applySettings(settings)
  bindChapterMapToggle()
  bindReaderToolsToggle()

  for (const control of controls) {
    syncControl(control, settings)
    bindControl(control, settings)
  }

  bindPretextTypography(settings)
  bindPageControls(settings)
  addAnchorLinks()
})()
