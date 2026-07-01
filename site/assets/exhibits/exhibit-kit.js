(() => {
  const svgNamespace = "http://www.w3.org/2000/svg"
  const registry = new Map()

  const append = (node, child) => {
    if (child === null || child === undefined || child === false) return
    if (Array.isArray(child)) {
      for (const item of child) append(node, item)
      return
    }
    if (child instanceof Node) {
      node.append(child)
      return
    }
    node.append(document.createTextNode(String(child)))
  }

  const setAttributes = (node, attributes = {}) => {
    for (const [name, value] of Object.entries(attributes)) {
      if (value === null || value === undefined || value === false) continue

      if (name === "className") {
        node.setAttribute("class", value)
        continue
      }

      if (name === "dataset") {
        for (const [key, datasetValue] of Object.entries(value)) {
          node.dataset[key] = datasetValue
        }
        continue
      }

      if (name === "style") {
        Object.assign(node.style, value)
        continue
      }

      if (name.startsWith("on") && typeof value === "function") {
        node.addEventListener(name.slice(2).toLowerCase(), value)
        continue
      }

      if (value === true) {
        node.setAttribute(name, "")
        continue
      }

      node.setAttribute(name, value)
    }
  }

  const el = (tagName, attributes, ...children) => {
    const node = document.createElement(tagName)
    setAttributes(node, attributes)
    for (const child of children) append(node, child)
    return node
  }

  const svg = (tagName, attributes, ...children) => {
    const node = document.createElementNS(svgNamespace, tagName)
    setAttributes(node, attributes)
    for (const child of children) append(node, child)
    return node
  }

  const enhance = (root, content) => {
    root.replaceChildren(content)
    root.classList.add("exhibit-live")
    root.dataset.exhibitStatus = "interactive"
  }

  const define = (id, render) => {
    registry.set(id, render)
  }

  const start = () => {
    for (const root of document.querySelectorAll("[data-exhibit-id]")) {
      const render = registry.get(root.dataset.exhibitId)
      if (!render) continue

      try {
        render({ root, kit: api })
      } catch (error) {
        root.dataset.exhibitError = "true"
        console.error(`Exhibit ${root.dataset.exhibitId} failed`, error)
      }
    }
  }

  const ready = callback => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true })
      return
    }
    callback()
  }

  const state = (initial, onChange) => {
    let value = { ...initial }

    return {
      get: () => ({ ...value }),
      set: update => {
        value = {
          ...value,
          ...(typeof update === "function" ? update({ ...value }) : update)
        }
        onChange({ ...value })
      }
    }
  }

  const button = (label, onClick, attributes = {}) => el(
    "button",
    { type: "button", ...attributes, onClick },
    label
  )

  const choice = ({ label, options, value, onChange }) => {
    const buttons = new Map()
    const node = el(
      "fieldset",
      { className: "exhibit-choice" },
      el("legend", {}, label),
      options.map(option => {
        const optionButton = button(option.label, () => onChange(option.value))
        buttons.set(option.value, optionButton)
        return optionButton
      })
    )

    const setValue = nextValue => {
      for (const [optionValue, optionButton] of buttons.entries()) {
        optionButton.setAttribute("aria-pressed", optionValue === nextValue ? "true" : "false")
      }
    }

    setValue(value)
    return { node, setValue }
  }

  const scaleLinear = ([domainStart, domainEnd], [rangeStart, rangeEnd]) => {
    const domainSize = domainEnd - domainStart || 1
    const rangeSize = rangeEnd - rangeStart
    return value => rangeStart + ((value - domainStart) / domainSize) * rangeSize
  }

  const scalePoint = (domain, [rangeStart, rangeEnd]) => {
    const step = domain.length > 1 ? (rangeEnd - rangeStart) / (domain.length - 1) : 0
    const positions = new Map(domain.map((value, index) => [value, rangeStart + step * index]))
    return value => positions.get(value) ?? rangeStart
  }

  const marks = {
    group: (attributes, ...children) => svg("g", attributes, ...children),
    line: attributes => svg("line", attributes),
    path: attributes => svg("path", attributes),
    rect: attributes => svg("rect", attributes),
    text: (attributes, text) => svg("text", attributes, text),
    circle: attributes => svg("circle", attributes)
  }

  const api = {
    button,
    choice,
    define,
    el,
    enhance,
    marks,
    ready,
    scaleLinear,
    scalePoint,
    start,
    state,
    svg
  }

  window.WizardExhibits = api
})()
