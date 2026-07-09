export function registerNumbersExhibit(context) {
  const { define, enhance, view } = context

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
  const htmlString = (strings, ...values) => (
    values.map((value, index) => `${strings[index]}${value}`).join("") + strings[strings.length - 1]
  )
  const fragment = source => document.createRange().createContextualFragment(source)

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

  const renderFacts = facts => htmlString`
    <dl class="number-facts">
      ${facts.map(fact => htmlString`<dt>${fact.label}</dt><dd>${fact.value}</dd>`).join("")}
    </dl>
  `

  const renderNumberFrame = ({ columns = "", facts, note = "", output, outputClass = "" }) => fragment(htmlString`
    <div class="number-machine-view">
      <section class="number-output-panel">
        <h3>Written</h3>
        <div class="${classNames("number-output", outputClass)}">${output}</div>
      </section>
      <section class="number-work-panel">
        <h3>Hidden work</h3>
        ${columns}
        ${renderFacts(facts)}
        ${note ? htmlString`<p class="number-note">${note}</p>` : ""}
      </section>
    </div>
  `)

  const renderTallyMarks = value => {
    if (value === 0) return `<span class="empty-number">no marks</span>`

    const groups = Math.floor(value / 5)
    const remainder = value % 5

    return htmlString`
      <div class="tally-board" aria-label="${value} tally marks">
        ${Array.from({ length: groups }, () => `<span class="tally-group" aria-hidden="true">||||/</span>`).join("")}
        ${remainder ? htmlString`<span class="tally-group tally-group-partial" aria-hidden="true">${"|".repeat(remainder)}</span>` : ""}
      </div>
    `
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
    if (value === 0) return ""

    return htmlString`
      <div class="roman-parts">
        ${romanParts(value).map(part => htmlString`
          <span class="${classNames("roman-part", part.symbol.length === 2 && "is-subtractive")}">
            <strong>${part.symbol}</strong>
            <span>${describeRomanPart(part)}</span>
          </span>
        `).join("")}
      </div>
    `
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

    return htmlString`
      <div class="abacus-columns" role="img" aria-label="Abacus columns showing ${value}">
        ${terms.map(term => {
        const lower = term.digit % 5
        const hasFive = term.digit >= 5

        return htmlString`
          <div class="abacus-column">
            <span class="abacus-place">x${formatWeight(10, term.power)}</span>
            <div class="abacus-rod">
              <span class="${classNames("abacus-bead abacus-bead-five", hasFive && "is-active")}" aria-hidden="true"></span>
              <span class="abacus-divider" aria-hidden="true"></span>
              ${Array.from({ length: 4 }, (_, index) => (
                `<span class="${classNames("abacus-bead", index >= 4 - lower && "is-active")}" aria-hidden="true"></span>`
              )).join("")}
            </div>
            <span class="abacus-digit">${term.symbol}</span>
          </div>
        `
      }).join("")}
      </div>
    `
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

  const renderPlaceColumns = (terms, carryInfo) => htmlString`
    <div class="place-columns">
      ${terms.map(term => {
      const isTouched = carryInfo?.touchedPowers.has(term.power)
      const isWrapped = carryInfo?.wrappedPowers.has(term.power)

      return htmlString`
        <div class="${classNames("place-column", isTouched && "is-carry-touched", isWrapped && "is-carry-wrapped")}">
          ${isTouched ? htmlString`<span class="carry-badge">${isWrapped ? "carry" : "+1"}</span>` : ""}
          <span class="place-digit">${term.symbol}</span>
          <span class="place-weight">x${formatWeight(term.base, term.power)}</span>
          <span class="place-contribution">${digitName(term.digit)} x ${term.weight}</span>
        </div>
      `
    }).join("")}
    </div>
  `

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

  const positionalViews = [
    ["decimal", "Decimal", "Decimal digits hide powers of ten and a carry wheel behind familiar symbols.", { base: 10, label: "Decimal", note: "This is the everyday machine: digits are remainders, places are powers of ten." }],
    ["binary", "Binary", "Binary is the same place-value machine with only two digits.", { base: 2, label: "Binary", prefix: "0b", note: "With only 0 and 1, carry happens often. That is why the pattern is so mechanical." }],
    ["octal", "Octal", "Octal uses powers of eight, shortening binary-shaped values into larger chunks.", { base: 8, label: "Octal", prefix: "0o", note: "Change the base and the columns change. The number underneath does not." }],
    ["hex", "Hex", "Hexadecimal packs value into powers of sixteen, with A through F standing for 10 through 15.", { base: 16, label: "Hex", prefix: "0x", note: "One hex digit can hold sixteen states, so it lines up neatly with four binary bits." }]
  ]

  const numberViews = [
    view("tally", "Tally", "Tally marks keep the count visible, but almost none of the work is compressed.", renderTallyView),
    view("roman", "Roman", "Roman numerals write a little addition and subtraction into the order of marks.", renderRomanView),
    view("abacus", "Abacus", "An abacus turns place value into columns: bead value times column weight.", renderAbacusView),
    ...positionalViews.map(([id, label, summary, config]) => view(id, label, summary, current => renderPositionalView({ ...current, ...config })))
  ]

  const renderNumberShellTemplate = () => {
    const html = window.html ?? htmlString
    const viewButtons = numberViews.map(option => html`
      <button type="button" data-number-view="${option.id}" data-simply-command="setView" data-simply-value="${option.id}">${option.label}</button>
    `).join("")

    return html`
      <div class="exhibit-shell">
        <p class="exhibit-kicker">Interactive Exhibit</p>
        <h2>Numbers Are Machines</h2>
        <p class="exhibit-intro">
          One number can be a pile of marks, a Roman calculation, a bead machine, or a positional system. The value stays put; the hidden work moves around.
        </p>
        <div class="exhibit-toolbar number-toolbar">
          <label class="number-input-label">
            <span>Number</span>
            <input aria-label="Number" data-number-input data-simply-command="setNumber" data-simply-immediate="true" inputmode="numeric" max="${numberLimit}" min="0" type="number" value="27">
          </label>
          <fieldset class="exhibit-choice" data-number-view-buttons>
            <legend>Notation</legend>
            ${viewButtons}
          </fieldset>
          <div class="number-actions">
            <button type="button" class="exhibit-reset number-action" data-simply-command="addOne">Add 1</button>
            <button type="button" class="exhibit-reset" data-simply-command="reset">Reset</button>
          </div>
        </div>
        <p class="exhibit-summary" data-simply-field="summary"></p>
        <div class="exhibit-stage number-machine-stage" data-number-stage aria-live="polite"></div>
        <p class="exhibit-footnote">
          A notation is a small machine for making some operations cheap enough to think with.
        </p>
      </div>
    `
  }

  define("numbers-are-machines", ({ root }) => {
    renderSimplyFlowNumbers(root)
  })

  function renderSimplyFlowNumbers(root) {
    const simply = window.simply
    enhance(root, fragment(renderNumberShellTemplate()))

    const app = simply.app({
      container: root,
      data: {
        previousValue: null,
        summary: numberViews.find(option => option.id === "decimal")?.summary ?? "",
        value: 27,
        view: "decimal"
      },
      commands: {
        setNumber(source, value) {
          this.data.previousValue = null
          this.data.value = clampNumber(value)
        },
        setView(source, value) {
          this.data.view = value
        },
        addOne() {
          const nextValue = clampNumber(this.data.value + 1)
          this.data.previousValue = nextValue === this.data.value ? null : this.data.value
          this.data.value = nextValue
        },
        reset() {
          this.data.previousValue = null
          this.data.value = 27
          this.data.view = "decimal"
        }
      }
    })
    const stage = root.querySelector("[data-number-stage]")
    const numberInput = root.querySelector("[data-number-input]")
    const viewButtons = [...root.querySelectorAll("[data-number-view]")]

    simply.effect(() => {
      const value = clampNumber(app.data.value)
      const current = {
        previousValue: app.data.previousValue,
        value,
        view: app.data.view
      }
      const selected = numberViews.find(option => option.id === current.view) ?? numberViews[0]

      if (app.data.view !== selected.id) app.data.view = selected.id
      app.data.summary = selected.summary

      for (const viewButton of viewButtons) {
        viewButton.setAttribute("aria-pressed", viewButton.dataset.numberView === selected.id ? "true" : "false")
      }

      if (document.activeElement !== numberInput) {
        numberInput.value = String(value)
      }

      stage.replaceChildren(selected.render(current))
    })
  }
}
