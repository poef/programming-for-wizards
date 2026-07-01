---
tags: programming for wizards
---
# Interactive exhibit backlog

The book should not feel like paper with a few toys glued on. The interactive pieces should carry the argument. Each exhibit should begin with an ordinary problem, make the friction visible, and then let the reader feel the reframe.

## Exhibit pattern

1. Start with a familiar problem.
2. Let the obvious solution become awkward.
3. Change the representation, boundary, language, or rule.
4. Show that the problem got smaller.
5. End with the chapter's wizard's rule.

## Current placeholders

| Placeholder | Chapter | Purpose |
| - | - | - |
| `same-problem-different-world` | 01 | Establish the book's core move: change the world, not only the solution. |
| `numbers-are-machines` | 02 | Show that notation hides calculation. |
| `truth-table-riddle` | 03 | Turn a riddle into mechanical reasoning. |
| `nand-all-the-way-down` | 03 | Show that machines can be built from a tiny logical primitive. |
| `words-change-the-problem` | 04 | Show that names change what can be seen. |
| `url-as-compressed-map` | 05 | Show protocol, host, path, query and fragment as one boundary-crossing string. |
| `html-chooses-a-tree` | 06 | Show the benefits and cost of HTML's tree representation. |
| `prototype-becomes-platform` | 07 | Show how a small prototype accretes platform concerns. |
| `same-program-many-languages` | 08 | Show that languages are human thinking tools. |
| `tiny-dsl-boundary` | 09 | Show a gradual path from functions to tables to DSL. |
| `jaqt-extension-lab` | 10 | Let a query grow from a loop to `filter()`/`map()`, then to functions-as-values, object-shaped patterns, and the final JAQT-shaped form. |
| `where-should-behavior-live` | 12 | Compare data+functions with behavior bound to data. |
| `binding-time-slider` | 12 | Show where dependencies are bound and how that affects change. |
| `knitted-castle-vs-lego-castle` | 11 | Show how reusable parts become entangled by hidden assumptions, and how explicit boundaries keep pieces Lego-like. |
| `pyramid-arch-bazaar` | 13 | Compare growth strategies under changing requirements. |
| `change-arrives-before-perfect` | 13 | Show why late perfection loses to early adaptation. |
| `innovation-happens-elsewhere` | 14 | Show why closed systems have to predict every useful future, while open boundaries let outside tools and ideas attach. |
| `linked-data-addresses` | 15 | Show private app identifiers becoming shared Web-addressable things and properties, so facts from different tools can meet. |
| `web-home-directory` | 16 | Show app-owned data versus user-owned identity and data, making replacement cheap. |


## Reader notes as a book-level feature

The marginal notes feature is not a chapter exhibit, but it should be treated as part of the same digital format. The reader should be able to attach notes to paragraphs, code blocks, figures and exhibits. The first version can store notes locally; a later version can store them in the reader's Solid pod.

See [Reader notes and Solid publishing](reader-notes-and-solid.md).

## Implementation note

For a first digital version, each exhibit can be a small standalone HTML file loaded in an iframe or web component. The chapter only needs a placeholder block with a stable id. The demo implementation can come later without rewriting the prose.

## 16. The Web as home: `web-home-directory`

Show two models side by side. In the app-owned model, each app contains its own account, identity and data. In the user-owned model, identity and data live in a user-controlled space and applications receive permission to use parts of it. Let the reader replace an app and show which model makes replacement cheap.

