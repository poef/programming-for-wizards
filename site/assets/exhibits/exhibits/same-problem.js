export function registerSameProblemExhibit(context) {
  const { button, choice, define, el, enhance, marks, state, svg, view } = context

  const task = (id, label, deps = []) => ({ id, label, deps })

  const tasks = [
    task("name", "Name the spell"),
    task("examples", "Gather examples", ["name"]),
    task("shape", "Choose a representation", ["name"]),
    task("draft", "Write the draft", ["examples", "shape"]),
    task("test", "Try it with a reader", ["draft"]),
    task("publish", "Publish the chapter", ["test"])
  ]

  const byId = items => new Map(items.map(item => [item.id, item]))

  const dependentsFor = (items, id) => items
    .filter(item => item.deps.includes(id))
    .map(item => item.label)

  const namesFor = (lookup, ids) => ids.map(id => lookup.get(id)?.label ?? id)

  const dependencyEdges = items => items.flatMap(item => (
    item.deps.map(dep => ({ from: dep, to: item.id }))
  ))

  const wrapGraphLabel = label => {
    const planned = {
      "Choose a representation": ["Choose a", "representation"],
      "Try it with a reader": ["Try it with", "a reader"]
    }

    return planned[label] ?? [label]
  }

  const graphDescription = (items, lookup) => items.map(item => (
    item.deps.length
      ? `${item.label} waits for ${namesFor(lookup, item.deps).join(" and ")}.`
      : `${item.label} can start immediately.`
  )).join(" ")

  const renderGraphLabel = (item, node) => {
    const lines = wrapGraphLabel(item.label)
    const labelWidth = 128
    const labelHeight = 24 + (lines.length - 1) * 16
    const firstLineY = lines.length === 1 ? 5 : -3

    return marks.group(
      {
        className: "dependency-label",
        transform: `translate(${node.label[0]} ${node.label[1]})`
      },
      marks.rect({
        x: -labelWidth / 2,
        y: -labelHeight / 2,
        width: labelWidth,
        height: labelHeight,
        rx: 8
      }),
      marks.text(
        { y: firstLineY, "text-anchor": "middle" },
        lines.map((line, index) => svg("tspan", { x: 0, dy: index === 0 ? 0 : 16 }, line))
      )
    )
  }

  const renderList = items => {
    const lookup = byId(items)

    return el(
      "ol",
      { className: "exhibit-task-list" },
      items.map(item => el(
        "li",
        {},
        el("strong", {}, item.label),
        el(
          "span",
          {},
          item.deps.length
            ? `waits for ${namesFor(lookup, item.deps).join(" and ")}`
            : "can start immediately"
        )
      ))
    )
  }

  const renderTable = items => {
    const lookup = byId(items)

    return el(
      "div",
      { className: "exhibit-table-wrap" },
      el(
        "table",
        { className: "exhibit-table" },
        el(
          "thead",
          {},
          el("tr", {}, el("th", {}, "Task"), el("th", {}, "Waits for"), el("th", {}, "Unlocks"))
        ),
        el(
          "tbody",
          {},
          items.map(item => el(
            "tr",
            {},
            el("th", { scope: "row" }, item.label),
            el("td", {}, item.deps.length ? namesFor(lookup, item.deps).join(", ") : "nothing"),
            el("td", {}, dependentsFor(items, item.id).join(", ") || "nothing")
          ))
        )
      )
    )
  }

  const renderGraph = items => {
    const nodes = {
      name: { point: [80, 170], label: [80, 228] },
      examples: { point: [240, 95], label: [240, 42] },
      shape: { point: [240, 245], label: [240, 298] },
      draft: { point: [410, 170], label: [410, 228] },
      test: { point: [555, 170], label: [555, 112] },
      publish: { point: [700, 170], label: [700, 228] }
    }
    const lookup = byId(items)
    const titleId = "same-problem-graph-title"
    const descId = "same-problem-graph-desc"

    return el(
      "div",
      { className: "dependency-graph" },
      svg(
        "svg",
        {
          viewBox: "0 0 780 340",
          role: "img",
          "aria-labelledby": `${titleId} ${descId}`
        },
        svg("title", { id: titleId }, "Task dependency graph"),
        svg(
          "desc",
          { id: descId },
          graphDescription(items, lookup)
        ),
        marks.group(
          { className: "dependency-edges" },
          dependencyEdges(items).map(edge => {
            const [x1, y1] = nodes[edge.from].point
            const [x2, y2] = nodes[edge.to].point
            const bend = y1 === y2 ? 0 : (y2 - y1) * 0.42
            return marks.path({
              d: `M ${x1 + 34} ${y1} C ${x1 + 86} ${y1 + bend}, ${x2 - 86} ${y2 - bend}, ${x2 - 34} ${y2}`,
              class: "dependency-edge"
            })
          })
        ),
        marks.group(
          { className: "dependency-nodes" },
          items.map((item, index) => {
            const node = nodes[item.id]
            const [x, y] = node.point
            return marks.group(
              { className: `dependency-node dependency-node-${index % 3}`, transform: `translate(${x} ${y})` },
              marks.circle({ r: 28 })
            )
          })
        ),
        marks.group(
          { className: "dependency-labels" },
          items.map(item => renderGraphLabel(item, nodes[item.id]))
        )
      )
    )
  }

  const views = [
    view(
      "list",
      "List",
      "The facts are present, but the reader has to remember the dependencies while scanning the list.",
      renderList
    ),
    view(
      "table",
      "Table",
      "The same facts become columns. Waiting and unlocking are now visible properties.",
      renderTable
    ),
    view(
      "graph",
      "Graph",
      "The work has not changed. The representation changed, so the order can be seen instead of remembered.",
      renderGraph
    )
  ]

  define("same-problem-different-world", ({ root }) => {
    const stage = el("div", { className: "exhibit-stage", "aria-live": "polite" })
    const summary = el("p", { className: "exhibit-summary" })
    const model = state({ view: "list" }, render)
    const viewChoice = choice({
      label: "Representation",
      options: views.map(option => ({ value: option.id, label: option.label })),
      value: model.get().view,
      onChange: value => model.set({ view: value })
    })

    const reset = button("Reset", () => model.set({ view: "list" }), {
      className: "exhibit-reset"
    })

    enhance(root, el(
      "div",
      { className: "exhibit-shell" },
      el("p", { className: "exhibit-kicker" }, "Interactive Exhibit"),
      el("h2", {}, "Same Problem, Different World"),
      el(
        "p",
        { className: "exhibit-intro" },
        "A small project can be written as a list, a table, or a graph. The tasks stay the same. The useful questions change."
      ),
      el("div", { className: "exhibit-toolbar" }, viewChoice.node, reset),
      summary,
      stage,
      el(
        "p",
        { className: "exhibit-footnote" },
        "This is the book's favorite trick in miniature: do not only improve the answer, improve the world the answer lives in."
      )
    ))

    function render(current) {
      const selected = views.find(option => option.id === current.view) ?? views[0]
      viewChoice.setValue(selected.id)
      summary.textContent = selected.summary
      stage.replaceChildren(selected.render(tasks))
    }

    render(model.get())
  })
}
