const WORDS = ["spell", "dragon", "door", "name", "rule", "word", "world", "mirror", "goblin"];
const ACTIONS = ["count", "hide", "rename", "wake", "quote"];
const REPLACEMENTS = ["dragon", "door", "rule", "mirror", "goblin", "spell"];

const STARTING_WORLD = [
  "The", "spell", "found", "a", "dragon", "behind", "the", "door", ".",
  "The", "dragon", "had", "written", "another", "spell", ".",
  "The", "door", "asked", "for", "a", "name", ".",
  "The", "name", "became", "a", "rule", ".",
  "The", "rule", "looked", "at", "the", "world", "and", "winked", "."
];

const app = document.querySelector("[data-spell-app]");
const sentenceEl = app.querySelector("[data-spell-sentence]");
const targetOptionsEl = app.querySelector("[data-target-options]");
const actionOptionsEl = app.querySelector("[data-action-options]");
const replacementOptionsEl = app.querySelector("[data-replacement-options]");
const worldEl = app.querySelector("[data-world]");
const mirrorEl = app.querySelector("[data-mirror]");
const statusEl = app.querySelector("[data-status]");

const state = {
  target: "spell",
  action: "count",
  replacement: "dragon",
  tokens: makeTokens(STARTING_WORLD),
  mirror: [],
  lastMessage: "The sentence is waiting. It looks harmless, which is exactly how sentences behave.",
  lastAction: null,
  selfEffects: []
};

function makeTokens(words) {
  return words.map((word, index) => ({
    id: `${index}-${word}`,
    text: word,
    original: word,
    effect: null,
    count: null,
    hiddenLabel: null
  }));
}

function normalize(word) {
  return word.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function isWord(token) {
  return /[a-z0-9]/i.test(token.text);
}

function matches(text, target = state.target) {
  return normalize(text) === normalize(target);
}

function setChoice(kind, value) {
  state[kind] = value;
  state.selfEffects = [];
  state.lastMessage = `The spell now says: when I see a ${state.target}, I will ${state.action} it.`;
  render();
}

function resetWorld() {
  state.target = "spell";
  state.action = "count";
  state.replacement = "dragon";
  state.tokens = makeTokens(STARTING_WORLD);
  state.mirror = [];
  state.selfEffects = [];
  state.lastAction = null;
  state.lastMessage = "The broom sweeps the little world back into its first arrangement.";
  render();
}

function chooseDangerousSpell() {
  state.target = "spell";
  state.action = "hide";
  state.replacement = "dragon";
  castSpell();
}

function chooseCrookedSpell() {
  state.target = "spell";
  state.action = "rename";
  state.replacement = "dragon";
  castSpell();
}

function castSpell() {
  clearTemporaryEffects();

  const beforeTarget = state.target;
  const worldMatches = state.tokens.filter(token => isWord(token) && matches(token.text, beforeTarget));
  const selfMatches = getSelfMatches(beforeTarget);
  const totalMatches = worldMatches.length + selfMatches.length;

  if (!totalMatches) {
    state.lastAction = null;
    state.mirror = [];
    state.selfEffects = [];
    state.lastMessage = `Nothing in the little world answered to “${beforeTarget}.” The spell coughed politely.`;
    render();
    return;
  }

  const selfChanged = applySelfEffect(selfMatches, beforeTarget);
  applyWorldEffect(worldMatches, beforeTarget);

  state.lastAction = state.action;
  state.lastMessage = makeMessage(beforeTarget, worldMatches.length, selfMatches.length, selfChanged);
  render(true);
}

function clearTemporaryEffects() {
  state.mirror = [];
  state.selfEffects = [];
  state.tokens = state.tokens.map(token => ({
    ...token,
    effect: null,
    count: null,
    hiddenLabel: null
  }));
}

function getSelfMatches(target) {
  const selfWords = getSentenceParts().filter(part => part.kind !== "punctuation");
  return selfWords.filter(part => matches(part.text, target));
}

function getSentenceParts() {
  const parts = [
    { kind: "literal", id: "when", text: "When" },
    { kind: "literal", id: "i-1", text: "I" },
    { kind: "literal", id: "see", text: "see" },
    { kind: "literal", id: "a", text: "a" },
    { kind: "magic", id: "target", role: "thing", text: state.target },
    { kind: "punctuation", id: "comma", text: "," },
    { kind: "literal", id: "i-2", text: "I" },
    { kind: "literal", id: "will", text: "will" },
    { kind: "magic", id: "action", role: "action", text: state.action },
    { kind: "literal", id: "it", text: "it" }
  ];

  if (state.action === "rename") {
    parts.push(
      { kind: "literal", id: "to", text: "to" },
      { kind: "magic", id: "replacement", role: "new name", text: state.replacement }
    );
  }

  parts.push({ kind: "punctuation", id: "period", text: "." });
  return parts;
}

function applyWorldEffect(worldMatches, targetAtCast) {
  if (state.action === "count") {
    worldMatches.forEach((token, index) => {
      token.effect = "counted";
      token.count = index + 1;
    });
    return;
  }

  if (state.action === "hide") {
    worldMatches.forEach(token => {
      token.effect = "hidden";
      token.hiddenLabel = token.text;
    });
    return;
  }

  if (state.action === "rename") {
    worldMatches.forEach(token => {
      token.text = preserveCapitalization(token.text, state.replacement);
      token.effect = "renamed";
    });
    return;
  }

  if (state.action === "wake") {
    worldMatches.forEach(token => {
      token.effect = "awake";
    });
    return;
  }

  if (state.action === "quote") {
    state.mirror = worldMatches.map(token => token.text);
    worldMatches.forEach(token => {
      token.effect = "quoted";
    });
    state.selfEffects = [
      ...state.selfEffects,
      ...getSelfMatches(targetAtCast).map(part => ({ id: part.id, effect: "quoted" }))
    ];
  }
}

function applySelfEffect(selfMatches, targetAtCast) {
  if (!selfMatches.length) {
    return false;
  }

  if (state.action === "count") {
    state.selfEffects = selfMatches.map((part, index) => ({ id: part.id, effect: "counted", count: index + 1 }));
    return false;
  }

  if (state.action === "hide") {
    state.selfEffects = selfMatches.map(part => ({ id: part.id, effect: "hidden" }));
    return true;
  }

  if (state.action === "rename") {
    const hitsTargetTile = selfMatches.some(part => part.id === "target");
    const effects = selfMatches.map(part => ({ id: part.id, effect: "renamed" }));
    state.selfEffects = effects;

    if (hitsTargetTile) {
      state.target = state.replacement;
      return true;
    }
    return false;
  }

  if (state.action === "wake") {
    state.selfEffects = selfMatches.map(part => ({ id: part.id, effect: "awake" }));
    return false;
  }

  if (state.action === "quote") {
    state.mirror = [...state.mirror, ...selfMatches.map(part => part.text)];
    state.selfEffects = selfMatches.map(part => ({ id: part.id, effect: "quoted" }));
    return false;
  }

  return false;
}

function preserveCapitalization(before, after) {
  if (!before) {
    return after;
  }
  return /^[A-Z]/.test(before) ? after.charAt(0).toUpperCase() + after.slice(1) : after;
}

function makeMessage(targetAtCast, worldCount, selfCount, selfChanged) {
  const countText = `${worldCount} word${worldCount === 1 ? "" : "s"} in the world`;
  const selfText = selfCount ? ` and ${selfCount} word${selfCount === 1 ? "" : "s"} in the spell itself` : "";

  if (state.action === "count") {
    return `The spell became a bookkeeper. It counted ${countText}${selfText}.`;
  }

  if (state.action === "hide") {
    return selfChanged
      ? `The spell hid “${targetAtCast},” including part of itself. That is why every good spell needs an undo broom.`
      : `The spell put little doors over ${countText}. The words are still there, but now they are being theatrical.`;
  }

  if (state.action === "rename") {
    return selfChanged
      ? `The spell renamed its own target from “${targetAtCast}” to “${state.target}.” The next cast is already a different spell.`
      : `The spell changed ${countText} into “${state.replacement}.” The world now answers to a different name.`;
  }

  if (state.action === "wake") {
    return `The spell woke ${countText}${selfText}. They may not be wiser, but they are definitely less still.`;
  }

  if (state.action === "quote") {
    return `The spell copied ${countText}${selfText} into the mirror. A rule has noticed its own evidence.`;
  }

  return "The spell did something suspiciously sentence-shaped.";
}

function render(shouldBurst = false) {
  renderSentence();
  renderOptions();
  renderWorld();
  renderMirror();
  statusEl.textContent = state.lastMessage;

  if (shouldBurst) {
    app.classList.remove("burst");
    requestAnimationFrame(() => app.classList.add("burst"));
  }
}

function renderSentence() {
  sentenceEl.replaceChildren(...getSentenceParts().map(part => {
    const effect = state.selfEffects.find(item => item.id === part.id);
    const span = document.createElement("span");
    span.textContent = getVisibleSentenceText(part, effect);
    span.className = getSentenceClass(part, effect);

    if (part.kind === "magic") {
      span.dataset.role = part.role;
    }

    if (effect?.effect === "counted") {
      span.dataset.count = effect.count;
    }

    if (effect?.effect === "hidden") {
      span.setAttribute("aria-label", `${part.text}, hidden by the spell`);
    }

    return span;
  }));
}

function getVisibleSentenceText(part, effect) {
  if (effect?.effect === "renamed" && part.id === "target") {
    return state.target;
  }
  return part.text;
}

function getSentenceClass(part, effect) {
  const classes = [];

  if (part.kind === "literal") {
    classes.push("literal-word");
  }
  if (part.kind === "magic") {
    classes.push("magic-word");
  }
  if (part.kind === "punctuation") {
    classes.push("punctuation");
  }

  if (effect) {
    classes.push(`effect-${effect.effect}`, "effect-self-hit");
  }

  return classes.join(" ");
}

function renderOptions() {
  renderChoiceButtons(targetOptionsEl, WORDS, "target");
  renderChoiceButtons(actionOptionsEl, ACTIONS, "action");
  renderChoiceButtons(replacementOptionsEl, REPLACEMENTS, "replacement");
}

function renderChoiceButtons(container, choices, kind) {
  container.replaceChildren(...choices.map(choice => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = choice;
    button.setAttribute("aria-pressed", String(state[kind] === choice));
    button.addEventListener("click", () => setChoice(kind, choice));
    return button;
  }));
}

function renderWorld() {
  worldEl.replaceChildren(...state.tokens.map(token => {
    if (!isWord(token)) {
      const punctuation = document.createElement("span");
      punctuation.className = "punctuation";
      punctuation.textContent = token.text;
      return punctuation;
    }

    const span = document.createElement("span");
    span.className = getWorldClass(token);
    span.textContent = token.text;

    if (token.effect === "counted") {
      span.dataset.count = token.count;
    }

    if (token.effect === "hidden") {
      span.setAttribute("aria-label", `${token.hiddenLabel}, hidden by the spell`);
    }

    return span;
  }).flatMap(addSpaces));
}

function addSpaces(node, index, list) {
  if (index === list.length - 1) {
    return [node];
  }

  const next = list[index + 1];
  const nextIsPunctuation = next.classList?.contains("punctuation");

  if (nextIsPunctuation) {
    return [node];
  }

  return [node, document.createTextNode(" ")];
}

function getWorldClass(token) {
  const classes = ["world-word"];
  if (token.effect) {
    classes.push(`effect-${token.effect}`);
  }
  return classes.join(" ");
}

function renderMirror() {
  if (!state.mirror.length) {
    mirrorEl.textContent = "A quiet mirror. It copies only what a spell asks it to copy.";
    return;
  }

  mirrorEl.replaceChildren(
    document.createTextNode("The mirror holds "),
    ...state.mirror.map((word, index) => {
      const span = document.createElement("span");
      span.className = "quoted-word";
      span.textContent = word;
      return index === state.mirror.length - 1 ? span : [span, document.createTextNode(" ")];
    }).flat(),
    document.createTextNode(".")
  );
}

app.addEventListener("click", event => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) {
    return;
  }

  if (action === "cast") {
    castSpell();
  }
  if (action === "reset") {
    resetWorld();
  }
  if (action === "self-hide") {
    chooseDangerousSpell();
  }
  if (action === "self-rename") {
    chooseCrookedSpell();
  }
});

render();
