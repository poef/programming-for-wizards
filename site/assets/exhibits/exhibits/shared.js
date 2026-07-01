export const classNames = (...names) => names.filter(Boolean).join(" ")

export const view = (id, label, summary, render) => ({ id, label, summary, render })

export const renderFacts = el => facts => el(
  "dl",
  { className: "number-facts" },
  facts.map(fact => [
    el("dt", {}, fact.label),
    el("dd", {}, fact.value)
  ])
)
