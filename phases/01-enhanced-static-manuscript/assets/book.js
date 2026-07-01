(() => {
  const storageKey = "programming-for-wizards.reader-settings"
  const readerToolsKey = "programming-for-wizards.reader-tools"
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

  const defaults = {
    font: "publication",
    fontScale: "100",
    lineHeight: "160",
    columnWidth: "42",
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

  const saveReaderToolsState = value => {
    try {
      localStorage.setItem(readerToolsKey, value)
    } catch {
      // The current page can still open and close the panel without persistence.
    }
  }

  const applySettings = settings => {
    const root = document.documentElement
    root.dataset.font = settings.font
    root.dataset.theme = settings.theme
    root.dataset.motion = settings.motion
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
    }

    control.addEventListener("input", update)
    control.addEventListener("change", update)
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
  bindReaderToolsToggle()

  for (const control of controls) {
    syncControl(control, settings)
    bindControl(control, settings)
  }

  addAnchorLinks()
})()
