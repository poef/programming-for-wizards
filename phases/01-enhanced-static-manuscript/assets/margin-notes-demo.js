const ready = document.readyState === "loading"
  ? new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }))
  : Promise.resolve()

ready.then(async () => {
  if (document.documentElement.dataset.pageKind !== "chapter") return

  const assetVersion = new URL(import.meta.url).searchParams.get("v") || "dev"
  let marginNotes
  try {
    marginNotes = await import(`./margin-notes/index.js?v=${encodeURIComponent(assetVersion)}`)
  } catch (error) {
    console.info("[margin-notes] Local demo bundle is not available.", error)
    return
  }

  const anchors = Array.from(document.querySelectorAll(".manuscript-pages [data-note-target]"))
    .filter(element => element.id)
    .map(element => ({
      id: element.id,
      element,
      slot: passageMarginNotesSlot(element),
      label: elementLabel(element)
    }))

  if (anchors.length === 0) return

  const container = document.createElement("aside")
  container.id = "margin-notes-local-demo"
  container.hidden = true
  document.body.append(container)

  const chapterId = document.querySelector("[data-book-chapter-id]")?.dataset.bookChapterId
    || location.pathname.replace(/^.*\/([^/]+)\.html$/, "$1")

  const app = marginNotes.MarginNotesAPI.mount({
    anchors,
    container: { element: container },
    namespace: "programming-for-wizards",
    storeKey: `programming-for-wizards.margin-notes.${chapterId}`,
    expandedStackBackground: "var(--color-page)",
    theme: marginNotesThemeFromBook()
  })
  window.programmingForWizardsMarginNotes = app

  bindMarginNotesLifecycle(app, [
    bindMarginNotesTheme(app),
    bindPassageMarginTabOrder()
  ])
})

function elementLabel(element) {
  return element.textContent
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
}

function passageMarginNotesSlot(element) {
  const existingSlot = element.querySelector(":scope > [data-passage-margin] [data-passage-margin-notes]")
  if (existingSlot) return existingSlot

  const margin = document.createElement("span")
  margin.className = "passage-margin"
  margin.dataset.passageMargin = ""
  margin.setAttribute("aria-label", "Margin for this passage")

  const slot = document.createElement("span")
  slot.className = "passage-margin-notes"
  slot.dataset.passageMarginNotes = ""
  margin.append(slot)
  element.prepend(margin)

  return slot
}

function marginNotesThemeFromBook() {
  return marginNotesThemeFromReaderTheme(document.documentElement.dataset.theme)
}

function marginNotesThemeFromReaderTheme(theme) {
  if (theme === "dark") return "dark"
  if (theme === "system" || theme === "auto") return "system"
  return "light"
}

function bindMarginNotesTheme(app) {
  const update = theme => {
    void app.setTheme(marginNotesThemeFromReaderTheme(theme))
  }

  const onReaderSettingsChange = event => {
    update(event.detail?.settings?.theme || document.documentElement.dataset.theme)
  }
  document.addEventListener("reader-settings-change", onReaderSettingsChange)

  const observer = new MutationObserver(() => {
    update(document.documentElement.dataset.theme)
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  })

  return () => {
    document.removeEventListener("reader-settings-change", onReaderSettingsChange)
    observer.disconnect()
  }
}

function bindMarginNotesLifecycle(app, cleanups) {
  const destroy = app.destroy.bind(app)

  app.destroy = async function destroyProgrammingForWizardsMarginNotes() {
    for (const cleanup of cleanups.splice(0)) {
      cleanup()
    }
    await destroy()
  }
}

function bindPassageMarginTabOrder() {
  const onKeydown = event => {
    if (event.key !== "Tab") return

    const addButton = event.target.closest?.(".passage-margin .margin-notes-target-add-btn")
    const sideLink = event.target.closest?.(".passage-margin .side-links-margin a")
    if (!addButton && !sideLink) return

    const passage = (addButton || sideLink).closest("[data-note-target][id]")
    if (!passage) return

    const target = addButton
      ? focusTargetFromAddButton({ addButton, passage, reverse: event.shiftKey })
      : focusTargetFromSideLink({ sideLink, passage, reverse: event.shiftKey })
    if (!target) return

    event.preventDefault()
    target.focus({ preventScroll: true })
    if (!event.shiftKey) target.scrollIntoView({ block: "nearest", inline: "nearest" })
  }

  document.addEventListener("keydown", onKeydown, true)
  return () => document.removeEventListener("keydown", onKeydown, true)
}

function focusTargetFromAddButton({ passage, reverse }) {
  if (reverse) return passage

  const firstSideLink = sideLinksForPassage(passage)[0]
  if (firstSideLink) return firstSideLink

  const passages = Array.from(document.querySelectorAll(".manuscript-pages [data-note-target][id]"))
  const passageIndex = passages.indexOf(passage)
  return passages.slice(passageIndex + 1).find(element => {
    return !element.hasAttribute("hidden")
  })
}

function focusTargetFromSideLink({ sideLink, passage, reverse }) {
  const sideLinks = sideLinksForPassage(passage)
  const index = sideLinks.indexOf(sideLink)

  if (reverse) {
    return sideLinks[index - 1] || passage.querySelector(".passage-margin .margin-notes-target-add-btn")
  }

  return sideLinks[index + 1] || nextPassage({ passage })
}

function sideLinksForPassage(passage) {
  return Array.from(passage.querySelectorAll(":scope > .passage-margin .side-links-margin a")).filter(element => {
    return element.getClientRects().length > 0
  })
}

function nextPassage({ passage }) {
  const passages = Array.from(document.querySelectorAll(".manuscript-pages [data-note-target][id]"))
  const passageIndex = passages.indexOf(passage)
  return passages.slice(passageIndex + 1).find(element => {
    return !element.hasAttribute("hidden")
  })
}
