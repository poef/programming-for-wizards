export function registerNumbersExhibit(context) {
  const { button, choice, define, el, enhance, state, view } = context

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
}
