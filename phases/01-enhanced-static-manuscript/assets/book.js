(() => {
  const storageKey = "programming-for-wizards.reader-settings"
  const readerToolsKey = "programming-for-wizards.reader-tools"
  const chapterMapKey = "programming-for-wizards.chapter-map"
  const readingProgressKey = "programming-for-wizards.reading-progress"
  const chapterStartKey = "programming-for-wizards.chapter-start"
  const pwaLastLocationKey = "programming-for-wizards.pwa-last-location"
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

  const releasePointerButtonFocus = event => {
    if (event.detail === 0) return
    event.currentTarget?.blur?.()
  }

  const isStandaloneApp = () => window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone

  const appRootUrl = () => {
    const manifest = document.querySelector('link[rel="manifest"]')
    return manifest ? new URL(".", manifest.href) : new URL("./", window.location.href)
  }

  const appRelativeUrl = url => {
    const root = appRootUrl()
    if (url.origin !== root.origin) return null
    if (!url.pathname.startsWith(root.pathname)) return null

    const relativePath = url.pathname.slice(root.pathname.length) || "index.html"
    return `${relativePath}${url.search}${url.hash}`
  }

  const rememberPwaLocation = () => {
    if (!isStandaloneApp()) return
    if (document.documentElement.dataset.pageKind !== "chapter") return

    try {
      const relative = appRelativeUrl(new URL(window.location.href))
      if (relative) localStorage.setItem(pwaLastLocationKey, relative)
    } catch {
      // PWA resume should never interfere with ordinary reading.
    }
  }

  const bindPwaLaunchResume = () => {
    const root = document.documentElement

    if (root.dataset.pageKind === "index" && isStandaloneApp()) {
      const params = new URLSearchParams(window.location.search)
      if (params.get("app") === "1") {
        let target = ""

        try {
          target = localStorage.getItem(pwaLastLocationKey) || ""
        } catch {
          target = ""
        }

        if (!target) {
          const firstChapter = document.querySelector("a[data-chapter-start]")
          if (firstChapter) target = appRelativeUrl(new URL(firstChapter.href, window.location.href)) || firstChapter.href
        }

        if (target) {
          window.location.replace(new URL(target, appRootUrl()).href)
          return
        }
      }
    }

    window.addEventListener("pagehide", rememberPwaLocation)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") rememberPwaLocation()
    })
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

    toggle.addEventListener("click", event => {
      current = current === "open" ? "closed" : "open"
      applyChapterMapState(current)
      saveChapterMapState(current)
      releasePointerButtonFocus(event)
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

    toggle.addEventListener("click", event => {
      current = current === "open" ? "closed" : "open"
      applyReaderToolsState(current)
      saveReaderToolsState(current)
      releasePointerButtonFocus(event)
    })
  }

  const bindChapterStartLinks = () => {
    document.addEventListener("click", event => {
      const link = event.target?.closest?.("a[data-chapter-start]")
      if (!link || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (link.target && link.target !== "_self") return

      try {
        const url = new URL(link.href, window.location.href)
        if (url.origin === window.location.origin) {
          sessionStorage.setItem(chapterStartKey, url.pathname)
        }
      } catch {
        // TOC navigation still works when session storage is unavailable.
      }
    })
  }

  const registerServiceWorker = () => {
    if (!("serviceWorker" in navigator)) return

    const manifest = document.querySelector('link[rel="manifest"]')
    const workerUrl = manifest
      ? new URL("sw.js", manifest.href)
      : new URL("sw.js", window.location.href)

    window.addEventListener("load", () => {
      navigator.serviceWorker.register(workerUrl.href).catch(() => {
        // The site remains fully usable without service worker support.
      })
    })
  }

  const bindInstallButton = () => {
    const button = document.querySelector("[data-install-app]")
    if (!button) return

    if (isStandaloneApp()) return

    let promptEvent = null

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault()
      promptEvent = event
      button.hidden = false
    })

    button.addEventListener("click", async event => {
      releasePointerButtonFocus(event)
      if (!promptEvent) return

      const installPrompt = promptEvent
      promptEvent = null
      button.hidden = true
      installPrompt.prompt()

      try {
        await installPrompt.userChoice
      } catch {
        // Some browsers do not expose a resolved install choice consistently.
      }
    })

    window.addEventListener("appinstalled", () => {
      promptEvent = null
      button.hidden = true
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
    let lastPageReliefDirty = true
    let codeStartBreaksDirty = true
    let portraitLiftsDirty = true

    if (openAtChapterEnd) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
    }

    const consumeChapterStart = () => {
      try {
        const stored = sessionStorage.getItem(chapterStartKey)
        if (stored !== window.location.pathname) return false

        sessionStorage.removeItem(chapterStartKey)
        return true
      } catch {
        return false
      }
    }

    const readProgress = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(readingProgressKey) || "null")
        if (!stored || typeof stored !== "object") return null

        // Older versions stored a separate position for every chapter. Keep only
        // the global `last` record when reading that format, so moving between
        // chapters never revives an unrelated position from an earlier visit.
        const progress = stored.last && typeof stored.last === "object"
          ? stored.last
          : stored

        if (typeof progress.chapterId !== "string" || typeof progress.targetId !== "string") {
          return null
        }

        return progress
      } catch {
        return null
      }
    }

    const writeProgress = progress => {
      try {
        localStorage.setItem(readingProgressKey, JSON.stringify(progress))
      } catch {
        // Reading position should not make the reader fail when storage is unavailable.
      }
    }

    const saveReadingProgress = targetId => {
      if (!targetId) return

      writeProgress({
        chapterId,
        targetId,
        path: window.location.pathname,
        updatedAt: new Date().toISOString()
      })
    }

    const loadReadingProgress = () => {
      const progress = readProgress()
      return progress?.chapterId === chapterId ? progress : null
    }

    if (!initialHash && !consumeChapterStart()) {
      pendingProgressTarget = loadReadingProgress()?.targetId ?? null
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
    const measuredPageCount = () => Math.max(1, Math.round((manuscript.scrollWidth + pageGap()) / pageStride()))
    const markPagedLayoutDirty = () => {
      codeStartBreaksDirty = true
      lastPageReliefDirty = true
      portraitLiftsDirty = true
    }
    const setLastPageRelief = value => {
      manuscript.style.setProperty("--book-last-page-extra", `${Math.max(0, value)}px`)
    }
    const textLineHeight = () => {
      const style = getComputedStyle(manuscript)
      const lineHeight = Number.parseFloat(style.lineHeight)
      const fontSize = Number.parseFloat(style.fontSize) || 16
      return Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : fontSize * 1.6
    }
    const applyLastPageRelief = () => {
      if (!lastPageReliefDirty) return

      lastPageReliefDirty = false
      setLastPageRelief(0)

      const baseCount = measuredPageCount()
      if (baseCount <= 1) return

      // CSS columns cannot make only the final column taller; this tiny global
      // adjustment is used only when it removes an otherwise stranded last page.
      const maxExtra = textLineHeight() * 2
      const stepCount = 8

      for (let step = 1; step <= stepCount; step += 1) {
        const extra = (maxExtra / stepCount) * step
        setLastPageRelief(extra)
        if (measuredPageCount() < baseCount) return
      }

      setLastPageRelief(0)
    }
    const codeStartThreshold = figure => {
      const pre = figure.querySelector("pre")
      const caption = figure.querySelector("figcaption")
      const figureStyle = getComputedStyle(figure)
      const preStyle = pre ? getComputedStyle(pre) : null
      const captionHeight = caption?.getBoundingClientRect().height ?? 0
      const preLineHeight = preStyle ? Number.parseFloat(preStyle.lineHeight) : 0
      const fontSize = preStyle ? Number.parseFloat(preStyle.fontSize) : Number.parseFloat(figureStyle.fontSize)
      const lineHeight = Number.isFinite(preLineHeight) && preLineHeight > 0
        ? preLineHeight
        : (Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.5 : textLineHeight())
      const paddingBlock =
        (Number.parseFloat(figureStyle.paddingTop) || 0) +
        (Number.parseFloat(figureStyle.paddingBottom) || 0)
      const preMarginTop = preStyle ? Number.parseFloat(preStyle.marginTop) || 0 : 0

      return paddingBlock + captionHeight + preMarginTop + lineHeight * 2
    }
    const shouldPushCodeStart = figure => {
      const fragments = [...figure.getClientRects()]
        .filter(rect => rect.width > 1 && rect.height > 1)
        .sort((a, b) => a.left - b.left || a.top - b.top)
      const first = fragments[0]
      if (!first) return false

      return first.height < codeStartThreshold(figure)
    }
    const applyCodeStartBreaks = () => {
      if (!codeStartBreaksDirty) return

      codeStartBreaksDirty = false
      setLastPageRelief(0)

      const figures = [...manuscript.querySelectorAll(".code-figure-breakable")]
      let changed = false

      for (const figure of figures) {
        figure.classList.remove("code-figure-start-next-page")
      }

      for (let pass = 0; pass < 3; pass += 1) {
        let passChanged = false

        for (const figure of figures) {
          if (figure.classList.contains("code-figure-start-next-page")) continue
          if (!shouldPushCodeStart(figure)) continue

          figure.classList.add("code-figure-start-next-page")
          passChanged = true
          changed = true
        }

        if (!passChanged) break
      }

      if (changed) lastPageReliefDirty = true
    }
    const firstFragment = element => {
      if (!element) return null

      return [...element.getClientRects()]
        .filter(rect => rect.width > 1 && rect.height > 1)
        .sort((a, b) => a.left - b.left || a.top - b.top)[0] ?? null
    }
    const pageForRect = rect => {
      const scrollerRect = manuscript.getBoundingClientRect()
      const left = rect.left - scrollerRect.left + manuscript.scrollLeft
      return Math.max(0, Math.floor((left + pageGap() / 2) / pageStride()))
    }
    const resetPortraitLifts = () => {
      for (const sideLinks of manuscript.querySelectorAll(".side-links-has-wizard")) {
        sideLinks.style.removeProperty("--wizard-portrait-lift")
      }
    }
    const applyPortraitLifts = () => {
      if (!portraitLiftsDirty) return

      portraitLiftsDirty = false
      resetPortraitLifts()
      if (!isPaged()) return

      const sideLinksBlocks = [...manuscript.querySelectorAll(".side-links-has-wizard")]
      const step = textLineHeight()
      let changed = false

      for (let pass = 0; pass < 10; pass += 1) {
        let passChanged = false

        for (const sideLinks of sideLinksBlocks) {
          const paragraph = sideLinks.closest("p")
          const paragraphRect = firstFragment(paragraph)
          const sideLinksRect = firstFragment(sideLinks)
          if (!paragraphRect || !sideLinksRect) continue
          if (pageForRect(sideLinksRect) <= pageForRect(paragraphRect)) continue

          const currentLift = Number.parseFloat(sideLinks.style.getPropertyValue("--wizard-portrait-lift")) || 0
          const maxLift = Math.min(sideLinksRect.height * 0.75, manuscript.clientHeight * 0.45)
          if (currentLift >= maxLift) continue

          sideLinks.style.setProperty("--wizard-portrait-lift", `${Math.min(maxLift, currentLift + step)}px`)
          passChanged = true
          changed = true
        }

        if (!passChanged) break
      }

      if (changed) lastPageReliefDirty = true
    }
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
      if (target) saveReadingProgress(target.id)
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
        resetPortraitLifts()
        if (progress) progress.hidden = true
        restoreSavedPosition(flow)
        scheduleSaveCurrentPosition()
        revealReader()
        return
      }

      controls.hidden = false
      if (progress) progress.hidden = false

      const stride = pageStride()
      applyCodeStartBreaks()
      applyPortraitLifts()
      applyLastPageRelief()
      pageCount = measuredPageCount()

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

    const targetUsesArrowKeys = target => {
      const element = target?.closest?.("input, select, textarea, [role]") ?? null
      if (!element) return false

      const tag = element.tagName?.toLowerCase?.() ?? ""
      const type = element.getAttribute("type")?.toLowerCase() ?? ""
      const role = element.getAttribute("role")?.toLowerCase() ?? ""

      if (tag === "select" || tag === "textarea") return true
      if (tag === "input") {
        return type !== "button" && type !== "submit" && type !== "reset"
      }

      return /^(?:combobox|listbox|menu|menubar|radiogroup|scrollbar|slider|spinbutton|tablist|tree|treegrid)$/.test(role)
    }

    const targetHandlesPointer = target => Boolean(target?.closest?.([
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "label",
      "iframe",
      "audio",
      "video",
      "[contenteditable]",
      "[role]",
      "[data-exhibit-id]",
      ".margin-anchor"
    ].join(",")))
    let pageTapStart = null

    manuscript.addEventListener("pointerdown", event => {
      if (!isPaged() || event.defaultPrevented || !event.isPrimary) return
      if (event.button !== 0) return
      if (targetHandlesPointer(event.target)) return

      pageTapStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
      }
    }, { passive: true })

    manuscript.addEventListener("pointerup", event => {
      if (!pageTapStart || pageTapStart.id !== event.pointerId) return

      const start = pageTapStart
      pageTapStart = null

      if (!isPaged() || event.defaultPrevented || targetHandlesPointer(event.target)) return

      const deltaX = event.clientX - start.x
      const deltaY = event.clientY - start.y
      if (Math.hypot(deltaX, deltaY) > 12) return

      const rect = manuscript.getBoundingClientRect()
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return
      }

      event.preventDefault()
      goToPage(event.clientX < rect.left + rect.width / 2 ? pageIndex - 1 : pageIndex + 1)
    })

    manuscript.addEventListener("pointercancel", () => {
      pageTapStart = null
    })

    previous.addEventListener("click", event => {
      goToPage(pageIndex - 1)
      releasePointerButtonFocus(event)
    })
    next.addEventListener("click", event => {
      goToPage(pageIndex + 1)
      releasePointerButtonFocus(event)
    })
    manuscript.addEventListener("scroll", update, { passive: true })
    window.addEventListener("scroll", scheduleSaveCurrentPosition, { passive: true })
    window.addEventListener("pagehide", saveCurrentPosition)

    document.addEventListener("keydown", event => {
      if (!isPaged()) return

      if ((event.key === "ArrowRight" || event.key === "ArrowLeft") && targetUsesArrowKeys(event.target)) {
        return
      }

      if ((event.key === "Home" || event.key === "End") && targetUsesArrowKeys(event.target)) {
        return
      }

      if ((event.key === "PageDown" || event.key === " ") && /^(?:input|select|textarea|button)$/i.test(event.target?.tagName ?? "")) {
        return
      }

      if (event.key === "PageUp" && /^(?:input|select|textarea|button)$/i.test(event.target?.tagName ?? "")) {
        return
      }

      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault()
        goToPage(pageIndex + 1)
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault()
        goToPage(pageIndex - 1)
      }

      if (event.key === "Home") {
        event.preventDefault()
        goToPage(0)
      }

      if (event.key === "End") {
        event.preventDefault()
        goToPage(pageCount - 1)
      }
    })

    const scheduleResizeUpdate = () => {
      saveCurrentPosition()
      markPagedLayoutDirty()
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(() => update({ snap: true }))
    }

    const resizeObserver = new ResizeObserver(scheduleResizeUpdate)
    resizeObserver.observe(manuscript)
    window.addEventListener("resize", scheduleResizeUpdate)
    document.addEventListener("reader-settings-change", () => {
      markPagedLayoutDirty()
      update({ snap: true })
    })
    document.addEventListener("reader-layout-change", () => {
      markPagedLayoutDirty()
      update({ snap: true })
    })
    window.addEventListener("load", () => {
      window.setTimeout(() => {
        markPagedLayoutDirty()
        update()
      }, 100)
    })
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        markPagedLayoutDirty()
        update({ snap: true })
      }).catch(() => {})
    }
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
  bindChapterStartLinks()
  bindPwaLaunchResume()
  registerServiceWorker()
  bindInstallButton()

  for (const control of controls) {
    syncControl(control, settings)
    bindControl(control, settings)
  }

  bindPageControls(settings)
  addAnchorLinks()
  bindMarginAnchorPositions()
})()
