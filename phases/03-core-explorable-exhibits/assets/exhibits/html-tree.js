export function registerHtmlTreeExhibit(context) {
  const { button, choice, define, el, enhance, marks, state, svg, treeLayout, view } = context

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
}
