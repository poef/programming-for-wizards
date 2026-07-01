(() => {
  const kit = window.WizardExhibits
  if (!kit) return

  const {
    button,
    choice,
    define,
    el,
    enhance,
    marks,
    ready,
    state,
    svg,
    treeLayout
  } = kit

  const task = (id, label, deps = []) => ({ id, label, deps })
  const view = (id, label, summary, render) => ({ id, label, summary, render })

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

  const htmlSegments = [
    { text: "This is a strong ", classes: ["strong"] },
    { text: "and partially emphasized", classes: ["strong", "em"] },
    { text: " text", classes: ["em"] }
  ]

  const crossedHtml = `<strong>This is a strong <em>and partially emphasized</strong> text</em>`
  const treeSafeHtml = `<strong>This is a strong <em>and partially emphasized</em></strong><em> text</em>`
  const rangeModelSource = `[
  { mark: "strong", from: 0, to: 41 },
  { mark: "emphasis", from: 17, to: 46 }
]`

  const textNode = text => ({
    label: `"${text.length > 26 ? `${text.slice(0, 23)}...` : text}"`,
    kind: "text",
    children: []
  })

  const htmlNodeToTree = (node, isRoot = false) => {
    if (node.nodeType === 3) {
      const text = node.textContent.replace(/\s+/g, " ").trim()
      return text ? textNode(text) : null
    }

    if (node.nodeType !== 1) return null

    return {
      label: isRoot ? "fragment" : `<${node.localName}>`,
      kind: isRoot ? "root" : "element",
      children: [...node.childNodes]
        .map(child => htmlNodeToTree(child))
        .filter(Boolean)
    }
  }

  const parseHtmlFragment = source => {
    if (!window.DOMParser) {
      return {
        label: "DOMParser unavailable",
        kind: "root",
        children: []
      }
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(`<main data-exhibit-root="">${source}</main>`, "text/html")
    const root = doc.body.querySelector("[data-exhibit-root]")
    return htmlNodeToTree(root, true)
  }

  const wrapTreeLabel = label => {
    if (label.length <= 18) return [label]

    const words = label.split(" ")
    const lines = []
    let line = ""

    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (next.length > 18 && line) {
        lines.push(line)
        line = word
        continue
      }
      line = next
    }

    if (line) lines.push(line)
    return lines.slice(0, 3)
  }

  const renderTreeNode = node => {
    const lines = wrapTreeLabel(node.label)
    const nodeWidth = node.kind === "text" ? 160 : 118
    const nodeHeight = 30 + (lines.length - 1) * 16
    const firstLineY = lines.length === 1 ? 5 : -3

    return marks.group(
      {
        className: `html-tree-node html-tree-node-${node.kind}`,
        transform: `translate(${node.x} ${node.y})`
      },
      marks.rect({
        x: -nodeWidth / 2,
        y: -nodeHeight / 2,
        width: nodeWidth,
        height: nodeHeight,
        rx: 8
      }),
      marks.text(
        { y: firstLineY, "text-anchor": "middle" },
        lines.map((line, index) => svg("tspan", { x: 0, dy: index === 0 ? 0 : 16 }, line))
      )
    )
  }

  const renderTreeFigure = ({ id, title, description, tree }) => {
    const layout = treeLayout(tree, {
      leafGap: 168,
      levelGap: 88,
      marginX: 90,
      marginY: 42
    })
    const width = Math.max(layout.width, 660)
    const height = Math.max(layout.height, 300)
    const titleId = `${id}-title`
    const descId = `${id}-desc`

    return el(
      "div",
      { className: "html-tree-figure" },
      svg(
        "svg",
        {
          viewBox: `0 0 ${width} ${height}`,
          role: "img",
          "aria-labelledby": `${titleId} ${descId}`
        },
        svg("title", { id: titleId }, title),
        svg("desc", { id: descId }, description),
        marks.group(
          { className: "html-tree-links" },
          layout.links.map(link => marks.path({
            d: `M ${link.source.x} ${link.source.y + 18} C ${link.source.x} ${link.source.y + 54}, ${link.target.x} ${link.target.y - 54}, ${link.target.x} ${link.target.y - 18}`,
            class: "html-tree-link"
          }))
        ),
        marks.group(
          { className: "html-tree-nodes" },
          layout.nodes.map(renderTreeNode)
        )
      )
    )
  }

  const renderHtmlSource = source => el(
    "pre",
    { className: "html-source-code", tabindex: "0" },
    el("code", {}, source)
  )

  const renderAnnotationLanes = () => el(
    "div",
    { className: "annotation-lanes" },
    el(
      "div",
      { className: "annotation-row" },
      el("span", { className: "annotation-range annotation-range-strong", style: { gridColumn: "1 / 3" } }, "strong")
    ),
    el(
      "div",
      { className: "annotation-row" },
      el("span", { className: "annotation-range annotation-range-em", style: { gridColumn: "2 / 4" } }, "emphasis")
    ),
    el(
      "p",
      { className: "annotation-segments" },
      htmlSegments.map(segment => el(
        "span",
        { className: `annotation-segment ${segment.classes.map(name => `is-${name}`).join(" ")}` },
        segment.text
      ))
    )
  )

  const renderOverlapView = () => el(
    "div",
    { className: "html-choice-view" },
    renderAnnotationLanes(),
    el(
      "p",
      { className: "html-tree-note" },
      "The two marks overlap without nesting. That is easy to say as ranges, but awkward to say as one tree."
    )
  )

  const renderParsedHtmlView = ({ id, source, note, treeTitle, treeDescription }) => el(
    "div",
    { className: "html-choice-view html-parse-view" },
    el(
      "div",
      { className: "html-source-panel" },
      el("h3", {}, "Source"),
      renderHtmlSource(source)
    ),
    renderTreeFigure({
      id,
      title: treeTitle,
      description: treeDescription,
      tree: parseHtmlFragment(source)
    }),
    el("p", { className: "html-tree-note" }, note)
  )

  const renderRangeModelView = () => el(
    "div",
    { className: "html-choice-view html-range-model" },
    renderAnnotationLanes(),
    el(
      "div",
      { className: "html-source-panel" },
      el("h3", {}, "Range data"),
      renderHtmlSource(rangeModelSource)
    ),
    el(
      "p",
      { className: "html-tree-note" },
      "A range model can keep both annotations intact. It wins this problem, but it is no longer ordinary HTML."
    )
  )

  const htmlTreeViews = [
    view(
      "overlap",
      "Overlap",
      "Start with the shape of the problem: two annotations cross over the same sentence.",
      renderOverlapView
    ),
    view(
      "crossed",
      "Crossed HTML",
      "If you write the crossing literally, the tags stop behaving like a tree.",
      () => renderParsedHtmlView({
        id: "html-crossed-tree",
        source: crossedHtml,
        note: "The source crosses end tags. The browser still has to produce a tree, so it repairs the shape.",
        treeTitle: "Browser tree for crossed HTML",
        treeDescription: "The browser turns the crossed strong and emphasis tags into a tree."
      })
    ),
    view(
      "tree",
      "Tree HTML",
      "To stay inside HTML, one annotation has to be split so the result can nest.",
      () => renderParsedHtmlView({
        id: "html-safe-tree",
        source: treeSafeHtml,
        note: "This is valid HTML, but the emphasis is now two elements. The tree stayed simple; the annotation became more complicated.",
        treeTitle: "Tree-safe HTML",
        treeDescription: "The valid HTML tree duplicates the emphasis element so tags do not overlap."
      })
    ),
    view(
      "ranges",
      "Ranges",
      "A different representation can keep the crossing directly.",
      renderRangeModelView
    )
  ]

  define("html-chooses-a-tree", ({ root }) => {
    const stage = el("div", { className: "exhibit-stage html-tree-stage", "aria-live": "polite" })
    const summary = el("p", { className: "exhibit-summary" })
    const model = state({ view: "overlap" }, render)
    const viewChoice = choice({
      label: "Representation",
      options: htmlTreeViews.map(option => ({ value: option.id, label: option.label })),
      value: model.get().view,
      onChange: value => model.set({ view: value })
    })

    const reset = button("Reset", () => model.set({ view: "overlap" }), {
      className: "exhibit-reset"
    })

    enhance(root, el(
      "div",
      { className: "exhibit-shell" },
      el("p", { className: "exhibit-kicker" }, "Interactive Exhibit"),
      el("h2", {}, "HTML Chooses A Tree"),
      el(
        "p",
        { className: "exhibit-intro" },
        "Two annotations can overlap in a sentence. HTML can only nest elements, so the browser has to choose a tree."
      ),
      el("div", { className: "exhibit-toolbar" }, viewChoice.node, reset),
      summary,
      stage,
      el(
        "p",
        { className: "exhibit-footnote" },
        "A representation is not just storage. It decides which shapes are natural and which ones need repair work."
      )
    ))

    function render(current) {
      const selected = htmlTreeViews.find(option => option.id === current.view) ?? htmlTreeViews[0]
      viewChoice.setValue(selected.id)
      summary.textContent = selected.summary
      stage.replaceChildren(selected.render())
    }

    render(model.get())
  })

  ready(() => {
    kit.start()
  })
})()
