---
tags: Programming for wizards
---
# Programming for Wizards

This book is for people who suspect software could be simpler, stranger, smaller, and more humane than it usually is.

It is not meant to teach you the next framework, the proper way to write a loop, or the correct amount of tabs. It is meant to teach a more dangerous habit: looking at a problem until you can see the shape someone else missed.

Here, "wizard" is not a rank or credential. It is an invitation to look closely at how problems are shaped, how tools shape people in return, and where a smaller, stranger, more humane path might exist.

Wizards do not merely write solutions. They learn to notice the world around a problem, and sometimes change the shape of it.

## Repository layout

- [content/book.json](content/book.json): the explicit book structure used by the static site: title, author, cover, parts, chapter order, chapter numbers, back matter, and source files. Chapter and back matter display titles are read from each manuscript H1.
- [content/frontmatter](content/frontmatter): source for the generated cover page.
- [content/chapters](content/chapters): the manuscript chapter files. Their reading order is controlled by `content/book.json`, not by filename sorting.
- [content/backmatter](content/backmatter): end matter such as the author bio.
- [content/notes](content/notes): presentation, accessibility, exhibit, Solid and restructuring notes.
- [phases](phases): one home for each product phase, from the static manuscript through the Solid-published edition.
- [shared/assets](shared/assets): source assets that are shared across phases.
- [www](www): generated static build output.

## Build

The first build is an enhanced static manuscript. It uses local Node scripts and a small typography runtime for the optional book-style text setting.

```sh
npm run build
```

Open [www/index.html](www/index.html) after building.

The generated site table of contents and chapter navigation use the order, cover, parts, and back matter from [content/book.json](content/book.json), while chapter and back matter display titles come from each file's H1. To rearrange chapters, move them between parts, or add/remove back matter pages, edit `content/book.json` and rebuild.

The static site also loads MathJax for TeX-style formulas in the manuscript. Use `$...$` for inline formulas and `$$...$$` for display formulas. Standalone display blocks may also be written as a line containing `$$`, followed by the formula, followed by another `$$` line.

To rebuild and validate the generated book:

```sh
npm run check
```

To serve the generated files locally:

```sh
npm run serve
```

For development, build once, serve, and rebuild when source files change:

```sh
npm run dev
```

## Table of contents

This is a human-readable snapshot. The canonical source for the generated site structure is [content/book.json](content/book.json).

### Prologue: You are allowed to make it up

- [01. This is not a programming book](content/chapters/01-this-is-not-a-programming-book.md)

### Part I: Representations are spells

- [02. Numbers: bigger than you think](content/chapters/02-numbers-hiding-calculations-in-symbols.md)
- [03. Logic: the truth is out there](content/chapters/03-logic-turning-truth-into-machinery.md)
- [04. Language: the oldest trick](content/chapters/04-language-the-tool-that-changes-the-thinker.md)

### Part II: The Web, from address to platform

- [05. The Web: one string to rule them all](content/chapters/05-the-web-as-address.md)
- [06. The Web: the shape of words](content/chapters/06-the-web-as-document.md)
- [07. The Web: waking up the words](content/chapters/07-the-web-as-platform.md)

### Part III: Inventing languages

- [08. Teaching machines our words](content/chapters/08-programming-languages-are-for-humans.md)
- [09. Every program grows a language](content/chapters/09-every-program-contains-a-language.md)
- [10. Code exhibit: extending JavaScript with JAQT](content/chapters/10-code-exhibit-extending-javascript-with-jaqt.md)

### Part IV: Boundaries and reusable pieces

- [11. The knitted castle](content/chapters/11-the-knitted-castle.md)
- [12. Objects: binding data, behavior, and time](content/chapters/12-objects-binding-data-behavior-and-time.md)

### Part V: Architecture, change, commons, and home

- [13. Architecture: arches, pyramids, and change](content/chapters/13-architecture-arches-pyramids-and-change.md)
- [14. The Web as commons: innovation happens elsewhere](content/chapters/14-the-web-as-commons.md)
- [15. The Web as data: things should have addresses too](content/chapters/15-the-web-as-data.md)
- [16. The Web as home: who owns your home directory?](content/chapters/16-the-web-as-home.md)

### Epilogue

- [17. Epilogue: shifting ground](content/chapters/17-rule-zero-there-are-no-rules.md)

### Back Matter

- [Bio. About the author](content/backmatter/about-the-author.md)

### Working notes

- [Presentation plan: from book to grimoire](content/notes/presentation-plan.md)
- [Interactive exhibit backlog](content/notes/interactive-exhibits.md)
- [Reader notes and Solid publishing](content/notes/reader-notes-and-solid.md)
- [Visual design and accessibility guidelines](content/notes/visual-design-and-accessibility.md)
- [Restructuring notes](content/notes/restructuring-notes.md)
