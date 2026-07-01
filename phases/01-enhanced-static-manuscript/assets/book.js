(() => {
  const storageKey = "programming-for-wizards.reader-settings"
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

  for (const control of controls) {
    syncControl(control, settings)
    bindControl(control, settings)
  }

  addAnchorLinks()
})()
