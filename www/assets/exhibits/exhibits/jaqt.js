export function registerJaqtExhibit(context) {
  const { button, choice, classNames, define, el, enhance, state, view } = context

  const jaqtPeople = [
    {
      id: "hilda",
      firstName: "Hilda",
      lastName: "Ogden",
      age: 62,
      address: {
        street: "Coronation Street",
        city: "Manchester"
      }
    },
    {
      id: "stan",
      firstName: "Stan",
      lastName: "Ogden",
      age: 64,
      address: {
        street: "Other Street",
        city: "Manchester"
      }
    },
    {
      id: "kevin",
      firstName: "Kevin",
      lastName: "Webster",
      age: 28,
      address: {
        street: "Market Street",
        city: "Liverpool"
      }
    }
  ]

  const jaqtCopy = Symbol("copy this property")
  const jaqtStartsWith = prefix => value => String(value ?? "").startsWith(prefix)
  const jaqtFullName = person => `${person.firstName} ${person.lastName}`
  const jaqtIsObject = value => value && typeof value === "object" && !Array.isArray(value)

  const jaqtMatches = (pattern, item) => (
    Object.entries(pattern).every(([key, expected]) => {
      const actual = item?.[key]

      if (typeof expected === "function") return expected(actual, item)
      if (jaqtIsObject(expected)) return jaqtMatches(expected, actual)
      return actual === expected
    })
  )

  const jaqtProject = (shape, source, root = source) => (
    Object.fromEntries(
      Object.entries(shape).map(([key, rule]) => {
        if (rule === jaqtCopy) return [key, source?.[key]]
        if (typeof rule === "function") return [key, rule(root, source)]
        if (jaqtIsObject(rule)) return [key, jaqtProject(rule, source?.[key] ?? {}, root)]
        return [key, rule]
      })
    )
  )

  const jaqtFrom = items => ({
    where(pattern) {
      return jaqtFrom(items.filter(item => jaqtMatches(pattern, item)))
    },
    select(shape) {
      return jaqtFrom(items.map(item => jaqtProject(shape, item)))
    },
    value() {
      return items
    }
  })

  const jaqtDefaults = {
    city: "Manchester",
    prefix: "O",
    shape: "card"
  }

  const jaqtPrefixOptions = [
    { value: "O", label: "O" },
    { value: "W", label: "W" },
    { value: "any", label: "Any" }
  ]

  const jaqtCityOptions = [
    { value: "Manchester", label: "Manchester" },
    { value: "Liverpool", label: "Liverpool" },
    { value: "any", label: "Any" }
  ]

  const jaqtShapeOptions = [
    { value: "card", label: "Card" },
    { value: "names", label: "Names" },
    { value: "age", label: "Age" }
  ]

  const jaqtQueryValue = (value, allowed, fallback) => (
    allowed.some(option => option.value === value) ? value : fallback
  )

  const jaqtQueryFrom = current => ({
    city: jaqtQueryValue(current.city, jaqtCityOptions, jaqtDefaults.city),
    prefix: jaqtQueryValue(current.prefix, jaqtPrefixOptions, jaqtDefaults.prefix),
    shape: jaqtQueryValue(current.shape, jaqtShapeOptions, jaqtDefaults.shape)
  })

  const jaqtBuildPattern = query => {
    const pattern = {}

    if (query.prefix !== "any") pattern.lastName = jaqtStartsWith(query.prefix)
    if (query.city !== "any") pattern.address = { city: query.city }

    return pattern
  }

  const jaqtBuildShape = query => {
    if (query.shape === "names") {
      return {
        firstName: jaqtCopy,
        lastName: jaqtCopy
      }
    }

    if (query.shape === "age") {
      return {
        label: jaqtFullName,
        age: jaqtCopy,
        address: {
          city: jaqtCopy
        }
      }
    }

    return {
      firstName: jaqtCopy,
      lastName: jaqtCopy,
      address: {
        city: jaqtCopy
      },
      label: jaqtFullName
    }
  }

  const jaqtRunQuery = current => {
    const query = jaqtQueryFrom(current)
    const pattern = jaqtBuildPattern(query)
    const shape = jaqtBuildShape(query)
    const survivors = jaqtPeople.filter(person => jaqtMatches(pattern, person))

    return {
      pattern,
      query,
      result: jaqtFrom(jaqtPeople).where(pattern).select(shape).value(),
      shape,
      survivorIds: new Set(survivors.map(person => person.id)),
      survivors
    }
  }

  const jaqtFunctionStoriesFor = queryData => {
    const prefixUsed = queryData.query.prefix !== "any"
    const prefix = queryData.query.prefix
    const names = queryData.survivors.map(jaqtFullName).join(" and ") || "no records"

    return [
      {
        id: "startsWith",
        label: prefixUsed ? `startsWith("${prefix}")` : "startsWith(prefix)",
        summary: prefixUsed
          ? "A function call returns another function. The returned function can wait inside the pattern until a last name arrives."
          : "With prefix set to Any, this function is not stored in the pattern. Removing a query piece is just another object shape.",
        steps: prefixUsed
          ? [
              `created by calling startsWith with the prefix ${prefix}`,
              "stored as the value of pattern.lastName",
              "passed into matches as ordinary object data",
              "called later with each person's last name"
            ]
          : [
              "the prefix control selected Any",
              "pattern.lastName is omitted",
              "matches has no last-name function to call",
              "the rest of the pattern still works"
            ],
        result: prefixUsed
          ? jaqtPeople.map(person => `${person.lastName} -> ${jaqtStartsWith(prefix)(person.lastName)}`).join("; ")
          : "no last-name predicate"
      },
      {
        id: "fullName",
        label: "fullName",
        summary: queryData.query.shape === "names"
          ? "This helper is available, but the selected result shape does not ask for it."
          : "A named helper becomes part of the result shape. The projector calls it only after a record survives the filter.",
        steps: [
          "defined once as a JavaScript function",
          queryData.query.shape === "names" ? "left out of the current personCard shape" : "stored as personCard.label",
          "passed into project with the rest of the shape",
          queryData.query.shape === "names" ? "not called for this result shape" : "called later with each surviving person"
        ],
        result: queryData.query.shape === "names" ? "label omitted" : names
      },
      {
        id: "matches",
        label: "matches(pattern)",
        summary: "The pattern is not parsed. It is walked as an object whose values have agreed meanings.",
        steps: [
          "reads each key in the pattern object",
          "compares plain values directly",
          "recurses into nested objects",
          "calls function values with the actual field"
        ],
        result: `${queryData.survivors.length} of ${jaqtPeople.length} records survive`
      },
      {
        id: "project",
        label: "project(shape)",
        summary: "The selected result is also an object shape. The marker copies fields; functions compute fields.",
        steps: [
          `walks the ${queryData.query.shape} result shape`,
          "copies fields marked with _",
          "recurses into nested objects when needed",
          "calls function values when the shape includes them"
        ],
        result: `${queryData.result.length} result records`
      }
    ]
  }

  const jaqtFunctionStoryFor = (id, queryData) => {
    const stories = jaqtFunctionStoriesFor(queryData)
    return stories.find(story => story.id === id) ?? stories[0]
  }

  const jaqtCodeLine = (...children) => el("span", { className: "jaqt-code-line" }, children)

  const jaqtToken = (id, label, selectedFunction, onSelect) => button(label, () => onSelect(id), {
    className: classNames("jaqt-code-token", selectedFunction === id && "is-selected"),
    "aria-pressed": selectedFunction === id ? "true" : "false"
  })

  const jaqtOptionLabel = (options, value) => (
    options.find(option => option.value === value)?.label ?? value
  )

  const jaqtEditToken = ({ editingToken, id, label, onChange, onToggle, options, value }) => el(
    "span",
    { className: "jaqt-edit-wrap" },
    button(jaqtOptionLabel(options, value), () => onToggle(id), {
      "aria-expanded": editingToken === id ? "true" : "false",
      className: "jaqt-edit-token"
    }),
    editingToken === id
      ? el(
          "span",
          { className: "jaqt-edit-menu", role: "listbox", "aria-label": label },
          options.map(option => button(option.label, () => onChange(id, option.value), {
            className: classNames("jaqt-edit-option", option.value === value && "is-selected"),
            "aria-selected": option.value === value ? "true" : "false",
            role: "option"
          }))
        )
      : null
  )

  const renderJaqtCode = lines => el(
    "pre",
    { className: "jaqt-code", tabindex: "0" },
    el("code", {}, lines)
  )

  const jaqtConditionRows = (query, edit, indent = "    ") => {
    const conditions = []

    if (query.prefix !== "any") {
      conditions.push([
        'person.lastName.startsWith("',
        edit("prefix"),
        '")'
      ])
    }

    if (query.city !== "any") {
      conditions.push([
        'person.address.city === "',
        edit("city"),
        '"'
      ])
    }

    if (!conditions.length) conditions.push(["true"])

    const rows = conditions.map((parts, index) => jaqtCodeLine(
      indent,
      parts,
      index < conditions.length - 1 ? " &&" : ""
    ))

    if (query.prefix === "any") rows.push(jaqtCodeLine(indent, "// last name: ", edit("prefix")))
    if (query.city === "any") rows.push(jaqtCodeLine(indent, "// city: ", edit("city")))

    return rows
  }

  const jaqtLoopPushLines = query => {
    if (query.shape === "names") {
      return [
        "    result.push({",
        "      firstName: person.firstName,",
        "      lastName: person.lastName",
        "    })"
      ]
    }

    if (query.shape === "age") {
      return [
        "    result.push({",
        "      label: `${person.firstName} ${person.lastName}`,",
        "      age: person.age,",
        "      address: { city: person.address.city }",
        "    })"
      ]
    }

    return [
      "    result.push({",
      "      firstName: person.firstName,",
      "      lastName: person.lastName,",
      "      address: { city: person.address.city },",
      "      label: `${person.firstName} ${person.lastName}`",
      "    })"
    ]
  }

  const jaqtMapLines = query => {
    if (query.shape === "names") {
      return [
        "  .map(person => ({",
        "    firstName: person.firstName,",
        "    lastName: person.lastName",
        "  }))"
      ]
    }

    if (query.shape === "age") {
      return [
        "  .map(person => ({",
        "    label: `${person.firstName} ${person.lastName}`,",
        "    age: person.age,",
        "    address: { city: person.address.city }",
        "  }))"
      ]
    }

    return [
      "  .map(person => ({",
      "    firstName: person.firstName,",
      "    lastName: person.lastName,",
      "    address: { city: person.address.city },",
      "    label: `${person.firstName} ${person.lastName}`",
      "  }))"
    ]
  }

  const jaqtPatternLines = (query, selectedFunction, edit, onSelect) => {
    const hasPrefix = query.prefix !== "any"
    const hasCity = query.city !== "any"

    if (!hasPrefix && !hasCity) {
      return [
        jaqtCodeLine("const pattern = {} // last name: ", edit("prefix"), ", city: ", edit("city"))
      ]
    }

    return [
      jaqtCodeLine("const pattern = {"),
      hasPrefix
        ? jaqtCodeLine("  lastName: ", jaqtToken("startsWith", "startsWith(", selectedFunction, onSelect), '"', edit("prefix"), '")', hasCity ? "," : "")
        : null,
      hasCity ? jaqtCodeLine('  address: { city: "', edit("city"), '" }') : null,
      jaqtCodeLine("}")
    ].filter(Boolean)
  }

  const jaqtShapeLines = (query, selectedFunction, edit, onSelect) => {
    if (query.shape === "names") {
      return [
        jaqtCodeLine("const personCard = { // ", edit("shape")),
        jaqtCodeLine("  firstName: _,"),
        jaqtCodeLine("  lastName: _"),
        jaqtCodeLine("}")
      ]
    }

    if (query.shape === "age") {
      return [
        jaqtCodeLine("const personCard = { // ", edit("shape")),
        jaqtCodeLine("  label: ", jaqtToken("fullName", "fullName", selectedFunction, onSelect), ","),
        jaqtCodeLine("  age: _,"),
        jaqtCodeLine("  address: { city: _ }"),
        jaqtCodeLine("}")
      ]
    }

    return [
      jaqtCodeLine("const personCard = { // ", edit("shape")),
      jaqtCodeLine("  firstName: _,"),
      jaqtCodeLine("  lastName: _,"),
      jaqtCodeLine("  address: { city: _ },"),
      jaqtCodeLine("  label: ", jaqtToken("fullName", "fullName", selectedFunction, onSelect)),
      jaqtCodeLine("}")
    ]
  }

  const jaqtInlineShapeLines = (query, selectedFunction, edit, onSelect, indent = "  ") => {
    if (query.shape === "names") {
      return [
        jaqtCodeLine(`${indent}  // shape: `, edit("shape")),
        jaqtCodeLine(`${indent}  firstName: _,`),
        jaqtCodeLine(`${indent}  lastName: _`)
      ]
    }

    if (query.shape === "age") {
      return [
        jaqtCodeLine(`${indent}  // shape: `, edit("shape")),
        jaqtCodeLine(`${indent}  label: `, jaqtToken("fullName", "fullName", selectedFunction, onSelect), ","),
        jaqtCodeLine(`${indent}  age: _,`),
        jaqtCodeLine(`${indent}  address: { city: _ }`)
      ]
    }

    return [
      jaqtCodeLine(`${indent}  // shape: `, edit("shape")),
      jaqtCodeLine(`${indent}  firstName: _,`),
      jaqtCodeLine(`${indent}  lastName: _,`),
      jaqtCodeLine(`${indent}  address: { city: _ },`),
      jaqtCodeLine(`${indent}  label: `, jaqtToken("fullName", "fullName", selectedFunction, onSelect))
    ]
  }

  const jaqtCodeRenderers = {
    loop: (queryData, selectedFunction, edit) => renderJaqtCode([
      jaqtCodeLine("const result = []"),
      jaqtCodeLine(""),
      jaqtCodeLine("for (const person of people) {"),
      jaqtCodeLine("  if ("),
      jaqtConditionRows(queryData.query, edit),
      jaqtCodeLine("  ) {"),
      jaqtCodeLine("    // result shape: ", edit("shape")),
      jaqtLoopPushLines(queryData.query).map(line => jaqtCodeLine(line)),
      jaqtCodeLine("  }"),
      jaqtCodeLine("}")
    ]),
    array: (queryData, selectedFunction, edit) => renderJaqtCode([
      jaqtCodeLine("const result = people"),
      jaqtCodeLine("  .filter(person =>"),
      jaqtConditionRows(queryData.query, edit),
      jaqtCodeLine("  )"),
      jaqtCodeLine("  // result shape: ", edit("shape")),
      jaqtMapLines(queryData.query).map(line => jaqtCodeLine(line))
    ]),
    functions: (queryData, selectedFunction, edit, onSelect) => renderJaqtCode([
      queryData.query.prefix !== "any"
        ? jaqtCodeLine("const lastNameMatches = ", jaqtToken("startsWith", "startsWith", selectedFunction, onSelect), '("', edit("prefix"), '")')
        : jaqtCodeLine("const lastNameMatches = null // prefix: ", edit("prefix")),
      jaqtCodeLine(""),
      jaqtCodeLine("const ", jaqtToken("fullName", "fullName", selectedFunction, onSelect), " ="),
      jaqtCodeLine("  person => `${person.firstName} ${person.lastName}`"),
      jaqtCodeLine(""),
      jaqtCodeLine("const result = people"),
      jaqtCodeLine("  .filter(person =>"),
      queryData.query.prefix !== "any"
        ? jaqtCodeLine("    lastNameMatches(person.lastName)", queryData.query.city !== "any" ? " &&" : "")
        : null,
      queryData.query.city !== "any"
        ? jaqtCodeLine('    person.address.city === "', edit("city"), '"')
        : null,
      queryData.query.prefix === "any" && queryData.query.city === "any" ? jaqtCodeLine("    true") : null,
      jaqtCodeLine("  )"),
      jaqtCodeLine("  // result shape: ", edit("shape")),
      jaqtMapLines(queryData.query).map(line => jaqtCodeLine(line))
    ].filter(Boolean)),
    pattern: (queryData, selectedFunction, edit, onSelect) => renderJaqtCode([
      jaqtPatternLines(queryData.query, selectedFunction, edit, onSelect),
      jaqtCodeLine(""),
      jaqtShapeLines(queryData.query, selectedFunction, edit, onSelect),
      jaqtCodeLine(""),
      jaqtCodeLine("const result = people"),
      jaqtCodeLine("  .filter(person => ", jaqtToken("matches", "matches(pattern, person)", selectedFunction, onSelect), ")"),
      jaqtCodeLine("  .map(person => ", jaqtToken("project", "project(personCard, person)", selectedFunction, onSelect), ")")
    ]),
    jaqt: (queryData, selectedFunction, edit, onSelect) => renderJaqtCode([
      jaqtCodeLine("const result = from(people)"),
      jaqtCodeLine("  .where({"),
      queryData.query.prefix !== "any"
        ? jaqtCodeLine("    lastName: ", jaqtToken("startsWith", "startsWith", selectedFunction, onSelect), '("', edit("prefix"), '")', queryData.query.city !== "any" ? "," : "")
        : null,
      queryData.query.city !== "any"
        ? jaqtCodeLine('    address: { city: "', edit("city"), '" }')
        : null,
      queryData.query.prefix === "any" && queryData.query.city === "any"
        ? jaqtCodeLine("    // all people: ", edit("prefix"), ", ", edit("city"))
        : null,
      jaqtCodeLine("  })"),
      jaqtCodeLine("  .select({"),
      jaqtInlineShapeLines(queryData.query, selectedFunction, edit, onSelect),
      jaqtCodeLine("  })"),
      jaqtCodeLine("  .value()")
    ].filter(Boolean))
  }

  const jaqtStages = [
    view(
      "loop",
      "Loop",
      "The query works, but it is wrapped in walking, checking and pushing instructions.",
      null
    ),
    view(
      "array",
      "filter/map",
      "`filter()` and `map()` remove the walking machinery, so the two halves of the query can be seen.",
      null
    ),
    view(
      "functions",
      "Functions",
      "A function can become a value: created now, carried around, and called later.",
      null
    ),
    view(
      "pattern",
      "Pattern",
      "An object shaped like the data can describe which records match and which fields to return.",
      null
    ),
    view(
      "jaqt",
      "JAQT shape",
      "A few host-language conventions make the JavaScript read like a small query language.",
      null
    )
  ]

  const jaqtStageNotes = {
    loop: "The question is mixed with the procedure. You can read it, but you have to peel away the mechanics.",
    array: "The host language already has useful words for collection work. No parser was needed for this step.",
    functions: "Click the highlighted functions. Each one is a value before it is an answer.",
    pattern: "The convention is small: values compare, functions run, nested objects descend.",
    jaqt: "The border moved inward. JavaScript is still the language; the DSL is the shape of a few objects and calls."
  }

  const jaqtResultTitle = record => (
    (record.label ?? [record.firstName, record.lastName].filter(Boolean).join(" ")) || "Result"
  )

  const jaqtFlattenRecord = (record, prefix = "") => (
    Object.entries(record).flatMap(([key, value]) => {
      const label = prefix ? `${prefix}.${key}` : key
      return jaqtIsObject(value) ? jaqtFlattenRecord(value, label) : [[label, value]]
    })
  )

  const renderJaqtRecord = (record, { matched = true, result = false } = {}) => {
    const fields = result
      ? jaqtFlattenRecord(record)
      : [
          ["Last", record.lastName],
          ["City", record.address?.city ?? record.city],
          ["Age", record.age]
        ]

    return el(
      "article",
      { className: classNames("jaqt-record", !matched && "is-rejected", result && "is-result") },
      el("h4", {}, result ? jaqtResultTitle(record) : jaqtFullName(record)),
      el(
        "dl",
        {},
        fields.map(([label, value]) => [
          el("dt", {}, label),
          el("dd", {}, value ?? "none")
        ])
      )
    )
  }

  const renderJaqtRecords = (records, options = {}) => el(
    "div",
    { className: "jaqt-records" },
    records.map(record => renderJaqtRecord(record, options.forRecord?.(record) ?? options))
  )

  const renderJaqtPipeline = (stageId, queryData) => el(
    "div",
    { className: "jaqt-pipeline" },
    el(
      "section",
      {},
      el("h3", {}, "People"),
      renderJaqtRecords(jaqtPeople, {
        forRecord: record => ({ matched: stageId === "loop" || stageId === "array" ? queryData.survivorIds.has(record.id) : true })
      })
    ),
    el(
      "section",
      {},
      el("h3", {}, "Where"),
      renderJaqtRecords(jaqtPeople, {
        forRecord: record => ({ matched: queryData.survivorIds.has(record.id) })
      })
    ),
    el(
      "section",
      {},
      el("h3", {}, "Select"),
      queryData.result.length
        ? renderJaqtRecords(queryData.result, { result: true })
        : el("p", { className: "jaqt-empty-result" }, "No records match this query.")
    )
  )

  const renderJaqtFunctionLab = (selectedFunction, queryData, onSelect) => {
    const story = jaqtFunctionStoryFor(selectedFunction, queryData)
    const stories = jaqtFunctionStoriesFor(queryData)

    return el(
      "section",
      { className: "jaqt-function-lab" },
      el("h3", {}, "Function as value"),
      el(
        "div",
        { className: "jaqt-function-tabs" },
        stories.map(item => button(item.label, () => onSelect(item.id), {
          className: classNames("jaqt-function-tab", item.id === story.id && "is-selected"),
          "aria-pressed": item.id === story.id ? "true" : "false"
        }))
      ),
      el("p", { className: "jaqt-function-summary" }, story.summary),
      el(
        "ol",
        { className: "jaqt-function-steps" },
        story.steps.map(step => el("li", {}, step))
      ),
      el("p", { className: "jaqt-function-result" }, story.result)
    )
  }

  const renderJaqtStage = (currentState, { onEditChange, onEditToggle, onFunctionSelect }) => {
    const { selectedFunction, stage } = currentState
    const current = jaqtStages.find(item => item.id === stage) ?? jaqtStages[0]
    const renderCode = jaqtCodeRenderers[current.id] ?? jaqtCodeRenderers.loop
    const queryData = jaqtRunQuery(currentState)
    const edit = id => {
      const config = {
        city: {
          label: "City",
          options: jaqtCityOptions,
          value: queryData.query.city
        },
        prefix: {
          label: "Last name prefix",
          options: jaqtPrefixOptions,
          value: queryData.query.prefix
        },
        shape: {
          label: "Result shape",
          options: jaqtShapeOptions,
          value: queryData.query.shape
        }
      }[id]

      return jaqtEditToken({
        editingToken: currentState.editingToken,
        id,
        onChange: onEditChange,
        onToggle: onEditToggle,
        ...config
      })
    }

    return el(
      "div",
      { className: "jaqt-lab" },
      el(
        "div",
        { className: "jaqt-main" },
        el(
          "section",
          { className: "jaqt-code-panel" },
          el("h3", {}, "Query"),
          renderCode(queryData, selectedFunction, edit, onFunctionSelect),
          el("p", { className: "jaqt-stage-note" }, jaqtStageNotes[current.id])
        ),
        renderJaqtPipeline(current.id, queryData)
      ),
      renderJaqtFunctionLab(selectedFunction, queryData, onFunctionSelect)
    )
  }

  define("jaqt-extension-lab", ({ root }) => {
    const stage = el("div", { className: "exhibit-stage jaqt-stage", "aria-live": "polite" })
    const summary = el("p", { className: "exhibit-summary" })
    const model = state({ ...jaqtDefaults, editingToken: null, selectedFunction: "startsWith", stage: "loop" }, render)
    const stageChoice = choice({
      label: "Stage",
      options: jaqtStages.map(option => ({ value: option.id, label: option.label })),
      value: model.get().stage,
      onChange: stageId => model.set({ editingToken: null, stage: stageId })
    })
    const next = button("Next", () => model.set(current => {
      const index = jaqtStages.findIndex(option => option.id === current.stage)
      const stageId = jaqtStages[Math.min(index + 1, jaqtStages.length - 1)]?.id ?? current.stage
      return { editingToken: null, stage: stageId }
    }), {
      className: "exhibit-reset"
    })
    const reset = button("Reset", () => model.set({ ...jaqtDefaults, editingToken: null, selectedFunction: "startsWith", stage: "loop" }), {
      className: "exhibit-reset"
    })
    const selectFunction = selectedFunction => model.set({ editingToken: null, selectedFunction })
    const toggleEdit = editingToken => model.set(current => ({
      editingToken: current.editingToken === editingToken ? null : editingToken
    }))
    const changeEdit = (editingToken, value) => model.set({
      [editingToken]: value,
      editingToken: null
    })

    enhance(root, el(
      "div",
      { className: "exhibit-shell" },
      el("p", { className: "exhibit-kicker" }, "Interactive Exhibit"),
      el("h2", {}, "JAQT Extension Lab"),
      el(
        "p",
        { className: "exhibit-intro" },
        "The same query grows from ordinary JavaScript into a small host-language DSL. No parser appears; the query shape is already JavaScript."
      ),
      el("div", { className: "exhibit-toolbar" }, stageChoice.node, el("div", { className: "number-actions" }, next, reset)),
      summary,
      stage,
      el(
        "p",
        { className: "exhibit-footnote" },
        "A language can begin as a convention about where objects, functions and method names are allowed to mean something special."
      )
    ))

    function render(current) {
      const selected = jaqtStages.find(option => option.id === current.stage) ?? jaqtStages[0]
      stageChoice.setValue(selected.id)
      summary.textContent = selected.summary
      stage.replaceChildren(renderJaqtStage(current, {
        onEditChange: changeEdit,
        onEditToggle: toggleEdit,
        onFunctionSelect: selectFunction
      }))
    }

    render(model.get())
  })
}
