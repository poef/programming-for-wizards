export function registerKnittedCastleExhibit(context) {
  const { button, choice, classNames, define, el, enhance, marks, renderFacts, state, svg, view } = context

  const knitThreads = [
    {
      id: "data",
      label: "Cart data shape",
      boundary: "PriceInput",
      note: "The part reaches into the cart object instead of receiving a small price value.",
      point: [88, 78],
      tests: ["replace", "subscriptions"]
    },
    {
      id: "style",
      label: "CSS and theme",
      boundary: "Style tokens",
      note: "The part expects surrounding class names and theme variables to exist.",
      point: [98, 260],
      tests: ["replace", "reuse"]
    },
    {
      id: "lifecycle",
      label: "Framework lifecycle",
      boundary: "Mount adapter",
      note: "The part assumes a particular rendering lifecycle and hook timing.",
      point: [300, 48],
      tests: ["replace", "reuse"]
    },
    {
      id: "analytics",
      label: "Analytics",
      boundary: "Event port",
      note: "The part logs directly instead of emitting a boring event.",
      point: [510, 88],
      tests: ["replace"]
    },
    {
      id: "config",
      label: "Currency config",
      boundary: "Formatter",
      note: "The part reads global formatting choices instead of receiving a formatter.",
      point: [512, 250],
      tests: ["subscriptions", "reuse"]
    },
    {
      id: "errors",
      label: "Error policy",
      boundary: "Failure value",
      note: "The part decides how network and pricing errors should appear.",
      point: [300, 304],
      tests: ["subscriptions"]
    },
    {
      id: "permissions",
      label: "Permissions",
      boundary: "Allowed actions",
      note: "The part asks who the user is instead of receiving what may be shown.",
      point: [70, 170],
      tests: ["reuse"]
    },
    {
      id: "storage",
      label: "Storage",
      boundary: "Saved state",
      note: "The part remembers UI state in an app-specific storage shape.",
      point: [530, 170],
      tests: ["subscriptions", "reuse"]
    }
  ]

  const knitTests = [
    view(
      "replace",
      "Replace part",
      "Replace the price badge with a new one. The clean version touches the contract. The knitted version tugs on nearby assumptions.",
      null
    ),
    view(
      "subscriptions",
      "Add subscriptions",
      "A new pricing rule arrives. The useful question is how far the rule has to travel.",
      null
    ),
    view(
      "reuse",
      "Reuse elsewhere",
      "Move the part into another project. The hidden assumptions decide how much of the old world comes along.",
      null
    )
  ]

  const knitTestFor = id => knitTests.find(test => test.id === id) ?? knitTests[0]
  const knitActiveThreads = testId => knitThreads.filter(thread => thread.tests.includes(testId))
  const knitCenter = [300, 176]

  const wrapThreadLabel = label => {
    if (label.length <= 15) return [label]
    const words = label.split(" ")
    const lines = []
    let line = ""

    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (next.length > 15 && line) {
        lines.push(line)
        line = word
        continue
      }
      line = next
    }

    if (line) lines.push(line)
    return lines.slice(0, 2)
  }

  const renderKnitNode = ({ className = "", label, point, width = 124 }) => {
    const lines = wrapThreadLabel(label)
    const height = 34 + (lines.length - 1) * 15

    return marks.group(
      { className: `knit-node ${className}`, transform: `translate(${point[0]} ${point[1]})` },
      marks.rect({
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        rx: 8
      }),
      marks.text(
        { y: lines.length === 1 ? 5 : -2, "text-anchor": "middle" },
        lines.map((line, index) => svg("tspan", { x: 0, dy: index === 0 ? 0 : 15 }, line))
      )
    )
  }

  const renderKnitDiagram = ({ boundaryIds, mode, testId }) => {
    const activeIds = new Set(knitActiveThreads(testId).map(thread => thread.id))
    const boundary = new Set(boundaryIds)
    const titleId = `${mode}-knit-title`
    const descId = `${mode}-knit-desc`
    const threads = mode === "lego"
      ? knitThreads.filter(thread => activeIds.has(thread.id) || boundary.has(thread.id))
      : knitThreads

    return el(
      "div",
      { className: `knit-diagram knit-diagram-${mode}` },
      svg(
        "svg",
        {
          viewBox: "0 0 600 352",
          role: "img",
          "aria-labelledby": `${titleId} ${descId}`
        },
        svg("title", { id: titleId }, mode === "lego" ? "Lego-like boundary" : "Knitted dependency threads"),
        svg(
          "desc",
          { id: descId },
          mode === "lego"
            ? "The part connects through explicit boundary pieces."
            : "The part is tied to surrounding assumptions by dependency threads."
        ),
        marks.group(
          { className: "knit-thread-layer" },
          threads.map(thread => {
            const explicit = boundary.has(thread.id)
            const active = activeIds.has(thread.id)
            const [x1, y1] = thread.point
            const [x2, y2] = knitCenter
            const bend = mode === "lego" ? 0 : (x1 < x2 ? -38 : 38)

            return marks.path({
              d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
              class: classNames(
                "knit-thread",
                explicit ? "is-explicit" : "is-hidden",
                active && "is-active"
              )
            })
          })
        ),
        renderKnitNode({
          className: mode === "lego" ? "knit-node-component is-lego" : "knit-node-component is-knitted",
          label: mode === "lego" ? "PriceBadge boundary" : "PriceBadge",
          point: knitCenter,
          width: 142
        }),
        marks.group(
          { className: "knit-node-layer" },
          threads.map(thread => renderKnitNode({
            className: classNames(
              boundary.has(thread.id) ? "is-explicit" : "is-hidden",
              activeIds.has(thread.id) && "is-active"
            ),
            label: mode === "lego" || boundary.has(thread.id) ? thread.boundary : thread.label,
            point: thread.point
          }))
        )
      )
    )
  }

  const renderKnitMeter = ({ boundaryIds, testId }) => {
    const boundary = new Set(boundaryIds)
    const active = knitActiveThreads(testId)
    const hiddenActive = active.filter(thread => !boundary.has(thread.id))
    const explicitActive = active.length - hiddenActive.length
    const hiddenPercent = Math.round((hiddenActive.length / Math.max(active.length, 1)) * 100)

    return el(
      "div",
      { className: "knit-meter" },
      el(
        "div",
        { className: "knit-meter-bar", role: "img", "aria-label": `${hiddenActive.length} hidden assumptions remain` },
        el("span", { style: { width: `${hiddenPercent}%` } })
      ),
      renderFacts([
        { label: "Clean boundary", value: `${Math.max(1, explicitActive)} explicit touch point${explicitActive === 1 ? "" : "s"}` },
        { label: "Knitted cost", value: `${hiddenActive.length} hidden thread${hiddenActive.length === 1 ? "" : "s"} tug back` },
        { label: "Reusable shape", value: hiddenActive.length ? "still brings weather" : "travels as a part" }
      ])
    )
  }

  const renderKnitBoundaryControls = ({ boundaryIds, onToggle, testId }) => {
    const boundary = new Set(boundaryIds)
    const activeIds = new Set(knitActiveThreads(testId).map(thread => thread.id))

    return el(
      "div",
      { className: "knit-boundary-controls" },
      knitThreads.map(thread => button(
        `${boundary.has(thread.id) ? "Hide" : "Expose"} ${thread.boundary}`,
        () => onToggle(thread.id),
        {
          className: classNames(
            "knit-boundary-button",
            boundary.has(thread.id) && "is-explicit",
            activeIds.has(thread.id) && "is-active"
          ),
          "aria-pressed": boundary.has(thread.id) ? "true" : "false"
        }
      ))
    )
  }

  const renderKnitThreadNotes = ({ boundaryIds, testId }) => {
    const boundary = new Set(boundaryIds)

    return el(
      "ol",
      { className: "knit-thread-notes" },
      knitActiveThreads(testId).map(thread => el(
        "li",
        { className: boundary.has(thread.id) ? "is-explicit" : "is-hidden" },
        el("strong", {}, boundary.has(thread.id) ? thread.boundary : thread.label),
        el("span", {}, boundary.has(thread.id) ? "made explicit at the edge" : thread.note)
      ))
    )
  }

  const renderKnitLab = (current, onToggleBoundary) => {
    const selected = knitTestFor(current.test)

    return el(
      "div",
      { className: "knit-lab" },
      el(
        "div",
        { className: "knit-worlds" },
        el(
          "section",
          { className: "knit-world" },
          el("h3", {}, "Lego-like"),
          renderKnitDiagram({ boundaryIds: current.boundaryIds, mode: "lego", testId: selected.id })
        ),
        el(
          "section",
          { className: "knit-world" },
          el("h3", {}, "Knitted"),
          renderKnitDiagram({ boundaryIds: current.boundaryIds, mode: "knitted", testId: selected.id })
        )
      ),
      el(
        "div",
        { className: "knit-workbench" },
        el(
          "section",
          {},
          el("h3", {}, "Replacement test"),
          renderKnitMeter({ boundaryIds: current.boundaryIds, testId: selected.id }),
          el("p", { className: "knit-note" }, selected.summary)
        ),
        el(
          "section",
          {},
          el("h3", {}, "Make assumptions explicit"),
          renderKnitBoundaryControls({ boundaryIds: current.boundaryIds, onToggle: onToggleBoundary, testId: selected.id })
        ),
        el(
          "section",
          {},
          el("h3", {}, "Threads pulled by this test"),
          renderKnitThreadNotes({ boundaryIds: current.boundaryIds, testId: selected.id })
        )
      )
    )
  }

  define("knitted-castle-vs-lego-castle", ({ root }) => {
    const stage = el("div", { className: "exhibit-stage knit-stage", "aria-live": "polite" })
    const summary = el("p", { className: "exhibit-summary" })
    const model = state({ boundaryIds: [], test: "replace" }, render)
    const testChoice = choice({
      label: "Test",
      options: knitTests.map(option => ({ value: option.id, label: option.label })),
      value: model.get().test,
      onChange: test => model.set({ test })
    })
    const reset = button("Reset", () => model.set({ boundaryIds: [], test: "replace" }), {
      className: "exhibit-reset"
    })
    const toggleBoundary = id => model.set(current => {
      const ids = new Set(current.boundaryIds)
      if (ids.has(id)) ids.delete(id)
      else ids.add(id)
      return { boundaryIds: [...ids] }
    })

    enhance(root, el(
      "div",
      { className: "exhibit-shell" },
      el("p", { className: "exhibit-kicker" }, "Interactive Exhibit"),
      el("h2", {}, "Knitted Castle vs Lego Castle"),
      el(
        "p",
        { className: "exhibit-intro" },
        "Try to replace or reuse one useful part. The visible question is not whether the part works, but how much of its old world it expects to bring along."
      ),
      el("div", { className: "exhibit-toolbar" }, testChoice.node, reset),
      summary,
      stage,
      el(
        "p",
        { className: "exhibit-footnote" },
        "Reuse gets easier when hidden assumptions become boring boundary pieces: inputs, adapters, events, data, and small contracts."
      )
    ))

    function render(current) {
      const selected = knitTestFor(current.test)
      testChoice.setValue(selected.id)
      summary.textContent = selected.summary
      stage.replaceChildren(renderKnitLab(current, toggleBoundary))
    }

    render(model.get())
  })
}
