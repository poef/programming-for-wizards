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
5. End with the chapter's wizard rule.

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
| `query-language-lab` | 10 | Make the tokenizer/parser/transpiler visible. |
| `where-should-behavior-live` | 11 | Compare data+functions with behavior bound to data. |
| `binding-time-slider` | 11 | Show where dependencies are bound and how that affects change. |
| `knitted-castle-vs-lego-castle` | 12 | Make dependency growth visible. |
| `pyramid-arch-bazaar` | 13 | Compare growth strategies under changing requirements. |
| `change-arrives-before-perfect` | 13 | Show why late perfection loses to early adaptation. |

## Implementation note

For a first digital version, each exhibit can be a small standalone HTML file loaded in an iframe or web component. The chapter only needs a placeholder block with a stable id. The demo implementation can come later without rewriting the prose.
