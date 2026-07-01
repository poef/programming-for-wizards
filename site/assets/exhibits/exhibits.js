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

  const numberLimit = 255
  const digitSymbols = "0123456789ABCDEF"
  const romanTokens = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1]
  ]
  const romanValues = new Map([
    ["I", 1],
    ["V", 5],
    ["X", 10],
    ["L", 50],
    ["C", 100],
    ["D", 500],
    ["M", 1000]
  ])

  const classNames = (...names) => names.filter(Boolean).join(" ")

  const clampNumber = value => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return 0
    return Math.max(0, Math.min(numberLimit, Math.floor(numeric)))
  }

  const digitsForBase = (value, base) => {
    if (value === 0) return [0]

    const digits = []
    let remaining = value

    while (remaining > 0) {
      digits.unshift(remaining % base)
      remaining = Math.floor(remaining / base)
    }

    return digits
  }

  const digitName = digit => (
    digit > 9 ? `${digitSymbols[digit]} (${digit})` : String(digit)
  )

  const formatBaseValue = (value, base, prefix = "") => (
    `${prefix}${digitsForBase(value, base).map(digit => digitSymbols[digit]).join("")}`
  )

  const formatPlace = (base, power) => `${base}^${power}`
  const formatWeight = (base, power) => (power === 0 ? "1" : formatPlace(base, power))

  const positionalTerms = (value, base) => {
    const digits = digitsForBase(value, base)

    return digits.map((digit, index) => {
      const power = digits.length - index - 1
      const weight = base ** power

      return {
        base,
        contribution: digit * weight,
        digit,
        power,
        symbol: digitSymbols[digit],
        weight
      }
    })
  }

  const positionalFormula = terms => (
    `${terms.map(term => `${digitName(term.digit)} x ${formatPlace(term.base, term.power)}`).join(" + ")} = ${terms.reduce((total, term) => total + term.contribution, 0)}`
  )

  const romanParts = value => {
    const parts = []
    let remaining = value

    for (const [symbol, amount] of romanTokens) {
      while (remaining >= amount) {
        parts.push({ symbol, amount })
        remaining -= amount
      }
    }

    return parts
  }

  const romanNumeral = value => {
    if (value === 0) return "no zero"
    return romanParts(value).map(part => part.symbol).join("")
  }

  const describeRomanPart = part => {
    if (part.symbol.length === 2) {
      const [small, large] = [...part.symbol].map(symbol => romanValues.get(symbol))
      return `${part.symbol} = ${large} - ${small}`
    }

    return `${part.symbol} = ${part.amount}`
  }

  const romanFormula = value => {
    if (value === 0) return "there is no ordinary Roman numeral for zero"

    return `${romanParts(value).map(part => {
      if (part.symbol.length === 2) {
        const [small, large] = [...part.symbol].map(symbol => romanValues.get(symbol))
        return `(${large} - ${small})`
      }

      return String(part.amount)
    }).join(" + ")} = ${value}`
  }

  const carryInfoFor = (previous, value, base) => {
    if (previous === null || value !== previous + 1 || ![2, 10].includes(base)) return null

    const highestPower = digitsForBase(value, base).length - 1
    const stepsLowToHigh = []
    let carry = 1

    for (let power = 0; power <= highestPower; power += 1) {
      const weight = base ** power
      const before = Math.floor(previous / weight) % base
      const after = Math.floor(value / weight) % base

      if (carry) {
        const total = before + carry
        const carried = total >= base
        stepsLowToHigh.push({ after, before, carried, power, received: true })
        carry = carried ? 1 : 0
        continue
      }

      stepsLowToHigh.push({ after, before, carried: false, power, received: false })
    }

    const touchedPowers = new Set(stepsLowToHigh.filter(step => step.received).map(step => step.power))
    const wrappedPowers = new Set(stepsLowToHigh.filter(step => step.carried).map(step => step.power))
    const messages = stepsLowToHigh
      .filter(step => step.received)
      .map(step => {
        const wasNewColumn = step.before === 0 && step.after === 1 && previous < base ** step.power
        if (wasNewColumn) return `new ${formatWeight(base, step.power)} column receives 1`
        if (step.carried) return `${digitSymbols[step.before]} -> 0, carry 1`
        return `${digitSymbols[step.before]} + 1 -> ${digitSymbols[step.after]}`
      })

    return {
      steps: [...stepsLowToHigh].reverse(),
      text: messages.join("; ") || "No carry was needed.",
      touchedPowers,
      wrappedPowers
    }
  }

  const renderFacts = facts => el(
    "dl",
    { className: "number-facts" },
    facts.map(fact => [
      el("dt", {}, fact.label),
      el("dd", {}, fact.value)
    ])
  )

  const renderNumberFrame = ({ columns = null, facts, note = null, output, outputClass = "" }) => el(
    "div",
    { className: "number-machine-view" },
    el(
      "section",
      { className: "number-output-panel" },
      el("h3", {}, "Written"),
      el("div", { className: classNames("number-output", outputClass) }, output)
    ),
    el(
      "section",
      { className: "number-work-panel" },
      el("h3", {}, "Hidden work"),
      columns,
      renderFacts(facts),
      note ? el("p", { className: "number-note" }, note) : null
    )
  )

  const renderTallyMarks = value => {
    if (value === 0) return el("span", { className: "empty-number" }, "no marks")

    const groups = Math.floor(value / 5)
    const remainder = value % 5

    return el(
      "div",
      { className: "tally-board", "aria-label": `${value} tally marks` },
      Array.from({ length: groups }, () => (
        el("span", { className: "tally-group", "aria-hidden": "true" }, "||||/")
      )),
      remainder
        ? el("span", { className: "tally-group tally-group-partial", "aria-hidden": "true" }, "|".repeat(remainder))
        : null
    )
  }

  const renderTallyView = ({ value }) => {
    const groups = Math.floor(value / 5)
    const remainder = value % 5

    return renderNumberFrame({
      output: renderTallyMarks(value),
      outputClass: "number-output-tally",
      facts: [
        { label: "Count", value: `${value} things need ${value} marks` },
        { label: "Bundle", value: `${groups} groups of five + ${remainder} loose marks = ${value}` }
      ],
      note: "The notation barely compresses the work. That is why it feels honest, and why it gets heavy."
    })
  }

  const renderRomanBreakdown = value => {
    if (value === 0) return null

    return el(
      "div",
      { className: "roman-parts" },
      romanParts(value).map(part => el(
        "span",
        { className: classNames("roman-part", part.symbol.length === 2 && "is-subtractive") },
        el("strong", {}, part.symbol),
        el("span", {}, describeRomanPart(part))
      ))
    )
  }

  const renderRomanView = ({ value }) => renderNumberFrame({
    output: romanNumeral(value),
    outputClass: "number-output-roman",
    columns: renderRomanBreakdown(value),
    facts: [
      { label: "Rule", value: romanFormula(value) },
      { label: "Order", value: "a smaller mark before a larger mark subtracts; otherwise marks add" }
    ],
    note: value === 0
      ? "Zero does not fit the ordinary Roman system. The missing symbol is part of the machinery too."
      : "The symbols are not digits in places. They are small additions and subtractions written in a row."
  })

  const renderAbacusColumns = value => {
    const terms = positionalTerms(value, 10)

    return el(
      "div",
      { className: "abacus-columns", role: "img", "aria-label": `Abacus columns showing ${value}` },
      terms.map(term => {
        const lower = term.digit % 5
        const hasFive = term.digit >= 5

        return el(
          "div",
          { className: "abacus-column" },
          el("span", { className: "abacus-place" }, `x${formatWeight(10, term.power)}`),
          el(
            "div",
            { className: "abacus-rod" },
            el("span", { className: classNames("abacus-bead abacus-bead-five", hasFive && "is-active"), "aria-hidden": "true" }),
            el("span", { className: "abacus-divider", "aria-hidden": "true" }),
            Array.from({ length: 4 }, (_, index) => el(
              "span",
              {
                className: classNames("abacus-bead", index >= 4 - lower && "is-active"),
                "aria-hidden": "true"
              }
            ))
          ),
          el("span", { className: "abacus-digit" }, term.symbol)
        )
      })
    )
  }

  const renderAbacusView = ({ value }) => {
    const terms = positionalTerms(value, 10)

    return renderNumberFrame({
      output: renderAbacusColumns(value),
      outputClass: "number-output-abacus",
      facts: [
        { label: "Columns", value: positionalFormula(terms) },
        { label: "Beads", value: "upper bead = 5, lower bead = 1, then multiply by the column" }
      ],
      note: "The abacus makes place value physical: value is bead count times column weight."
    })
  }

  const renderPlaceColumns = (terms, carryInfo) => el(
    "div",
    { className: "place-columns" },
    terms.map(term => {
      const isTouched = carryInfo?.touchedPowers.has(term.power)
      const isWrapped = carryInfo?.wrappedPowers.has(term.power)

      return el(
        "div",
        { className: classNames("place-column", isTouched && "is-carry-touched", isWrapped && "is-carry-wrapped") },
        isTouched ? el("span", { className: "carry-badge" }, isWrapped ? "carry" : "+1") : null,
        el("span", { className: "place-digit" }, term.symbol),
        el("span", { className: "place-weight" }, `x${formatWeight(term.base, term.power)}`),
        el("span", { className: "place-contribution" }, `${digitName(term.digit)} x ${term.weight}`)
      )
    })
  )

  const renderPositionalView = ({ base, label, note, prefix = "", value, previousValue }) => {
    const terms = positionalTerms(value, base)
    const carryInfo = carryInfoFor(previousValue, value, base)
    const output = formatBaseValue(value, base, prefix)
    const carryFact = carryInfo
      ? carryInfo.text
      : `when a column passes ${digitSymbols[base - 1]}, it returns to 0 and sends 1 left`

    return renderNumberFrame({
      output,
      outputClass: `number-output-positional number-output-base-${base}`,
      columns: renderPlaceColumns(terms, carryInfo),
      facts: [
        { label, value: output },
        { label: "Expansion", value: positionalFormula(terms) },
        { label: base === 2 || base === 10 ? "Carry" : "Remainder", value: base === 2 || base === 10 ? carryFact : `each digit stores 0 through ${digitSymbols[base - 1]} in powers of ${base}` }
      ],
      note
    })
  }

  const numberViews = [
    view(
      "tally",
      "Tally",
      "Tally marks keep the count visible, but almost none of the work is compressed.",
      renderTallyView
    ),
    view(
      "roman",
      "Roman",
      "Roman numerals write a little addition and subtraction into the order of marks.",
      renderRomanView
    ),
    view(
      "abacus",
      "Abacus",
      "An abacus turns place value into columns: bead value times column weight.",
      renderAbacusView
    ),
    view(
      "decimal",
      "Decimal",
      "Decimal digits hide powers of ten and a carry wheel behind familiar symbols.",
      current => renderPositionalView({
        ...current,
        base: 10,
        label: "Decimal",
        note: "This is the everyday machine: digits are remainders, places are powers of ten."
      })
    ),
    view(
      "binary",
      "Binary",
      "Binary is the same place-value machine with only two digits.",
      current => renderPositionalView({
        ...current,
        base: 2,
        label: "Binary",
        prefix: "0b",
        note: "With only 0 and 1, carry happens often. That is why the pattern is so mechanical."
      })
    ),
    view(
      "octal",
      "Octal",
      "Octal uses powers of eight, shortening binary-shaped values into larger chunks.",
      current => renderPositionalView({
        ...current,
        base: 8,
        label: "Octal",
        prefix: "0o",
        note: "Change the base and the columns change. The number underneath does not."
      })
    ),
    view(
      "hex",
      "Hex",
      "Hexadecimal packs value into powers of sixteen, with A through F standing for 10 through 15.",
      current => renderPositionalView({
        ...current,
        base: 16,
        label: "Hex",
        prefix: "0x",
        note: "One hex digit can hold sixteen states, so it lines up neatly with four binary bits."
      })
    )
  ]

  define("numbers-are-machines", ({ root }) => {
    const stage = el("div", { className: "exhibit-stage number-machine-stage", "aria-live": "polite" })
    const summary = el("p", { className: "exhibit-summary" })
    const model = state({ previousValue: null, value: 27, view: "decimal" }, render)
    const numberInput = el("input", {
      "aria-label": "Number",
      inputmode: "numeric",
      max: String(numberLimit),
      min: "0",
      onInput: event => model.set({ previousValue: null, value: clampNumber(event.target.value) }),
      type: "number",
      value: String(model.get().value)
    })
    const numberField = el(
      "label",
      { className: "number-input-label" },
      el("span", {}, "Number"),
      numberInput
    )
    const viewChoice = choice({
      label: "Notation",
      options: numberViews.map(option => ({ value: option.id, label: option.label })),
      value: model.get().view,
      onChange: value => model.set({ view: value })
    })
    const addOne = button("Add 1", () => model.set(current => {
      const nextValue = clampNumber(current.value + 1)
      return {
        previousValue: nextValue === current.value ? null : current.value,
        value: nextValue
      }
    }), {
      className: "exhibit-reset number-action"
    })
    const reset = button("Reset", () => model.set({ previousValue: null, value: 27, view: "decimal" }), {
      className: "exhibit-reset"
    })

    enhance(root, el(
      "div",
      { className: "exhibit-shell" },
      el("p", { className: "exhibit-kicker" }, "Interactive Exhibit"),
      el("h2", {}, "Numbers Are Machines"),
      el(
        "p",
        { className: "exhibit-intro" },
        "One number can be a pile of marks, a Roman calculation, a bead machine, or a positional system. The value stays put; the hidden work moves around."
      ),
      el("div", { className: "exhibit-toolbar number-toolbar" }, numberField, viewChoice.node, el("div", { className: "number-actions" }, addOne, reset)),
      summary,
      stage,
      el(
        "p",
        { className: "exhibit-footnote" },
        "A notation is a small machine for making some operations cheap enough to think with."
      )
    ))

    function render(current) {
      const selected = numberViews.find(option => option.id === current.view) ?? numberViews[0]
      viewChoice.setValue(selected.id)
      if (document.activeElement !== numberInput) numberInput.value = String(current.value)
      summary.textContent = selected.summary
      stage.replaceChildren(selected.render(current))
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
