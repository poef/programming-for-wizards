(() => {
  const storageKey = "programming-for-wizards.reader-settings"
  const readerToolsKey = "programming-for-wizards.reader-tools"
  const chapterMapKey = "programming-for-wizards.chapter-map"
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

  const defaults = {
    font: "publication",
    fontScale: "100",
    lineHeight: "160",
    columnWidth: "48",
    flow: "paged",
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
    const manuscript = document.querySelector("[data-page-scroller]")
    const controls = document.querySelector("[data-page-controls]")
    const previous = document.querySelector("[data-page-prev]")
    const next = document.querySelector("[data-page-next]")
    const status = document.querySelector("[data-page-status]")
    const progress = document.querySelector("[data-book-progress]")
    const progressBar = document.querySelector("[data-book-progress-bar]")
    if (!manuscript || !controls || !previous || !next || !status) return

    const previousChapter = document.querySelector(".chapter-pagination a[rel='prev']")
    const nextChapter = document.querySelector(".chapter-pagination a[rel='next']")
    const pageWeights = (manuscript.dataset.bookPageWeights || "")
      .split(",")
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0)
    const chapterIndex = Number(manuscript.dataset.bookChapterIndex || 0)
    let pageCount = 1
    let pageIndex = 0

    const isPaged = () => document.documentElement.dataset.flow === "paged"
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
      window.location.href = previousChapter.href
    }

    const navigateToNextChapter = () => {
      if (nextChapter) window.location.href = nextChapter.href
    }

    const update = () => {
      if (!isPaged()) {
        controls.hidden = true
        manuscript.scrollLeft = 0
        if (progress) progress.hidden = true
        return
      }

      controls.hidden = false
      if (progress) progress.hidden = false

      const stride = pageStride()
      pageCount = Math.max(1, Math.round((manuscript.scrollWidth + pageGap()) / stride))
      pageIndex = Math.min(pageCount - 1, Math.max(0, Math.round(manuscript.scrollLeft / stride)))

      const global = globalPageInfo()
      const progressValue = global.total > 1 ? ((global.current - 1) / (global.total - 1)) * 100 : 100

      status.textContent = `Page ${global.current} of ${global.total}`
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

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(manuscript)
    document.addEventListener("reader-settings-change", update)
    window.addEventListener("load", () => {
      window.setTimeout(() => {
        update()
      }, 100)
    })
    window.addEventListener("hashchange", () => window.setTimeout(update, 100))
    window.setTimeout(update, 0)
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

  bindPageControls(settings)
  addAnchorLinks()
})()
