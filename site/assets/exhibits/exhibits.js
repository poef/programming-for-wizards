import { registerHtmlTreeExhibit } from "./exhibits/html-tree.js"
import { registerJaqtExhibit } from "./exhibits/jaqt.js"
import { registerKnittedCastleExhibit } from "./exhibits/knitted-castle.js"
import { registerNumbersExhibit } from "./exhibits/numbers.js"
import { registerSameProblemExhibit } from "./exhibits/same-problem.js"
import { classNames, renderFacts, view } from "./exhibits/shared.js"

function registerExhibits() {
  const kit = window.WizardExhibits
  if (!kit) return false

  const context = {
    ...kit,
    classNames,
    renderFacts: renderFacts(kit.el),
    view
  }

  registerSameProblemExhibit(context)
  registerNumbersExhibit(context)
  registerHtmlTreeExhibit(context)
  registerJaqtExhibit(context)
  registerKnittedCastleExhibit(context)

  kit.ready(() => {
    kit.start()
  })

  return true
}

if (!registerExhibits() && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", registerExhibits, { once: true })
}
