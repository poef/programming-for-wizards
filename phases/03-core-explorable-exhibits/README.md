# Phase 3: Core Explorable Exhibits

Goal: build the strongest interactive explanations first.

This phase owns the small exhibit runtime. The runtime should feel like a library that happened because several exhibits needed the same few ideas:

- plain DOM and SVG helpers;
- small state helpers;
- reusable controls;
- simple data-to-mark functions inspired by visualization libraries;
- progressive enhancement over static manuscript fallbacks.

Use browser-native features first. Borrow a library when it makes the exhibit smaller, clearer, or more correct than local code would. Keep borrowed ideas behind small replaceable functions so the book remains view-source friendly.

Initial exhibits:

- `same-problem-different-world`
- `numbers-are-machines`
- `html-chooses-a-tree`
- `jaqt-extension-lab`
- `knitted-castle-vs-lego-castle`
- `linked-data-addresses`

Each exhibit should keep a static fallback and a keyboard-accessible path through the interaction.

Source files:

- [assets/exhibit-kit.js](assets/exhibit-kit.js): tiny reusable exhibit primitives.
- [assets/exhibits.js](assets/exhibits.js): exhibit definitions mounted by `data-exhibit-id`.
- [assets/exhibits.css](assets/exhibits.css): exhibit-specific presentation.
