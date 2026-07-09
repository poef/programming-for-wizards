(() => {
  const storageKey = "programming-for-wizards.reader-settings"
  const readerToolsKey = "programming-for-wizards.reader-tools"
  const chapterMapKey = "programming-for-wizards.chapter-map"
  const readingProgressKey = "programming-for-wizards.reading-progress"
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

  const revealReader = () => {
    delete document.documentElement.dataset.initialPagePosition
    delete document.documentElement.dataset.readerBoot
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
    const chapterId = manuscript.dataset.bookChapterId || window.location.pathname
    const chapterIndex = Number(manuscript.dataset.bookChapterIndex || 0)
    let pageCount = 1
    let pageIndex = 0
    let resizeFrame = 0
    let saveFrame = 0
    let effectiveFlow = root.dataset.flow
    const initialHash = window.location.hash
    let openAtChapterEnd = initialHash === "#book-end"
    let restoredProgress = false
    let pendingProgressTarget = null

    if (openAtChapterEnd) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
    }

    const readProgress = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(readingProgressKey) || "{}")
        return stored && typeof stored === "object" ? stored : {}
      } catch {
        return {}
      }
    }

    const writeProgress = progress => {
      try {
        localStorage.setItem(readingProgressKey, JSON.stringify(progress))
      } catch {
        // Reading position should not make the reader fail when storage is unavailable.
      }
    }

    const saveChapterProgress = targetId => {
      if (!targetId) return

      const progress = readProgress()
      progress[chapterId] = {
        targetId,
        path: window.location.pathname,
        updatedAt: new Date().toISOString()
      }
      progress.last = {
        chapterId,
        targetId,
        path: window.location.pathname,
        updatedAt: progress[chapterId].updatedAt
      }
      writeProgress(progress)
    }

    function loadChapterProgress(id) {
      return readProgress()[id] ?? null
    }

    if (!initialHash) {
      pendingProgressTarget = loadChapterProgress(chapterId)?.targetId ?? null
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
    const progressTargets = () => [...manuscript.querySelectorAll("p[data-note-target][id]")]
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

    const firstVisibleProgressTarget = () => {
      const targets = progressTargets()
      if (!targets.length) return null

      if (isPaged()) {
        const scrollerRect = manuscript.getBoundingClientRect()
        return targets.find(target => {
          const rect = target.getBoundingClientRect()
          return (
            rect.right > scrollerRect.left + 1 &&
            rect.left < scrollerRect.right - 1 &&
            rect.bottom > scrollerRect.top + 1 &&
            rect.top < scrollerRect.bottom - 1
          )
        }) ?? null
      }

      return targets.find(target => {
        const rect = target.getBoundingClientRect()
        return rect.bottom > 1 && rect.top < window.innerHeight - 1
      }) ?? null
    }

    const saveCurrentPosition = () => {
      const target = firstVisibleProgressTarget()
      if (target) saveChapterProgress(target.id)
    }

    const scheduleSaveCurrentPosition = () => {
      window.cancelAnimationFrame(saveFrame)
      saveFrame = window.requestAnimationFrame(saveCurrentPosition)
    }

    const restoreSavedPosition = flow => {
      if (restoredProgress || !pendingProgressTarget) return false

      const target = document.getElementById(pendingProgressTarget)
      if (!target) {
        restoredProgress = true
        pendingProgressTarget = null
        return false
      }

      if (flow === "paged") {
        const stride = pageStride()
        const scrollerRect = manuscript.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        const targetLeft = targetRect.left - scrollerRect.left + manuscript.scrollLeft
        const targetPage = Math.min(
          pageCount - 1,
          Math.max(0, Math.floor((targetLeft + pageGap() / 2) / stride))
        )

        pageIndex = targetPage
        manuscript.scrollLeft = pageIndex * stride
      } else {
        target.scrollIntoView({ block: "start", inline: "nearest" })
      }

      restoredProgress = true
      pendingProgressTarget = null
      window.setTimeout(saveCurrentPosition, 100)
      return true
    }

    const update = ({ snap = false } = {}) => {
      const flow = applyEffectiveFlow()

      if (flow !== "paged") {
        controls.hidden = true
        manuscript.scrollLeft = 0
        if (progress) progress.hidden = true
        restoreSavedPosition(flow)
        scheduleSaveCurrentPosition()
        revealReader()
        return
      }

      controls.hidden = false
      if (progress) progress.hidden = false

      const stride = pageStride()
      pageCount = Math.max(1, Math.round((manuscript.scrollWidth + pageGap()) / stride))

      if (openAtChapterEnd) {
        pageIndex = pageCount - 1
        manuscript.scrollLeft = pageIndex * stride
      } else if (restoreSavedPosition(flow)) {
        // Restoring by paragraph anchor already set pageIndex and scrollLeft.
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

      scheduleSaveCurrentPosition()
      revealReader()
    }

    const goToPage = (index, behavior = settings.motion === "reduced" ? "auto" : "smooth") => {
      if (!isPaged()) return
      openAtChapterEnd = false
      if (index < 0) {
        saveCurrentPosition()
        navigateToPreviousChapter()
        return
      }
      if (index >= pageCount) {
        saveCurrentPosition()
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
    window.addEventListener("scroll", scheduleSaveCurrentPosition, { passive: true })
    window.addEventListener("pagehide", saveCurrentPosition)

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
      saveCurrentPosition()
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

  const bindMarginAnchorPositions = () => {
    let frame = 0

    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sync)
    }

    const sync = () => {
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const inlineOffset = rootFontSize * 1.35

      for (const anchor of document.querySelectorAll(".margin-anchor")) {
        const target = anchor.parentElement
        if (!target) continue

        const rect = target.getBoundingClientRect()
        const style = getComputedStyle(target)
        const lineHeight = Number.parseFloat(style.lineHeight) || (Number.parseFloat(style.fontSize) || rootFontSize) * 1.6
        const top = rect.top + lineHeight * 0.25
        const left = Math.max(4, rect.left - inlineOffset)

        anchor.style.setProperty("--margin-anchor-top", `${top}px`)
        anchor.style.setProperty("--margin-anchor-left", `${left}px`)
      }
    }

    const pageScroller = document.querySelector("[data-page-scroller]")
    pageScroller?.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("load", () => window.setTimeout(schedule, 100))
    document.addEventListener("reader-settings-change", schedule)
    document.addEventListener("reader-layout-change", schedule)
    document.addEventListener("pointerover", event => {
      if (event.target?.closest?.("[data-note-target]")) schedule()
    })
    document.addEventListener("focusin", event => {
      if (event.target?.classList?.contains("margin-anchor")) schedule()
    })

    schedule()
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
  bindMarginAnchorPositions()
})()
