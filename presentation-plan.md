---
tags: programming for wizards, presentation, digital book
---
# Presentation plan: from book to grimoire

This book should not feel like a normal book that happens to live on a screen.

It should still have the virtues of a book: a path, a voice, a sequence, chapters that can be read in order, sentences that matter. But it should also slowly reveal that the page is not paper. The reader should not merely read about representations, boundaries, languages and systems. They should occasionally be able to touch them.

The target is not a textbook with exercises, and not a website with articles. It is closer to a grimoire: a readable manuscript that contains small working spells.

## Lineage

A useful stepping stone is *Alice for the iPad*: still recognizably a book, but with illustrations that respond to touch, tilt and motion. That is not the final model for this book, but it is an important point on the path. It shows how a digital book can keep the shape of reading while letting the page become a little alive.

Bret Victor's work points further. The important idea is not that interactive things are fun. The important idea is that an explanation can become an environment to think in. A reader can change an assumption, see a consequence, and build an intuition that would be harder to get from text alone.

For *Programming for Wizards*, the path is:

```text
book -> illustrated digital book -> living manuscript -> explorable grimoire
```

The book should not jump straight to the final form. It should have a clear path of implementation, so that every stage remains readable and useful.

## The basic shape

Each chapter should remain a readable essay. The prose leads. The interaction appears when the reader has enough context to care.

The digital version adds three layers around the text:

1. **Living illustrations**  
   Small animated or touchable pieces that create atmosphere and make the metaphor concrete.

2. **Explorable exhibits**  
   Focused interactive explanations where the reader changes a representation, boundary, rule or language and sees the consequence.

3. **Marginal notes**  
   A reader-owned note system in the margin, so the book can become a place for thinking, not only reading.

The fantasy layer should be structural, not decorative. The book should not become fake parchment with candles and dragons pasted around the edges. It should feel like a clean digital manuscript that has inherited some medieval habits: margins, glosses, diagrams, initials, rule cards, maps and strange little machines in the page.

## Page anatomy

A chapter page should have four visible zones on desktop:

```text
+----------------+------------------------------+--------------------+
| chapter map    | main manuscript column        | reader margin      |
| / navigation   | prose, code, figures, exhibits| notes, references  |
+----------------+------------------------------+--------------------+
```

On smaller screens, the margins collapse:

- chapter map becomes a menu;
- notes become a drawer;
- references become expandable footnotes;
- exhibits remain inline, but can open full-screen when needed.

The main column should stay calm and readable. The text is not decoration around the app. The app is an extension of the text.

## Chapters as rooms

The fantasy theme can be used as an organizing metaphor.

Each chapter is a room in the wizard's tower:

- Numbers: the counting room.
- Logic: the room of doors and tables.
- Language: the whispering library.
- The Web as address/document/platform: the corridor of doors, trees and mirrors.
- DSLs: the spell-forge.
- The knitted castle: the tangled hall.
- Architecture: the arch chamber.
- Commons/data/home: the map room.

This should not require heavy illustration. A small chapter icon, a map-like table of contents and a few recurring visual motifs are enough.

## Wizard's rules as cards

Each chapter earns a Wizard's rule at the end. In the digital version, these rules can become cards collected by the reader as they move through the book.

The cards should not be gamified with points or achievements. The purpose is not to make reading addictive. The purpose is to make the book's structure visible.

At the end, Rule Zero can rearrange the whole collection:

> Wizard's rule zero: there are no rules.

The interaction should make the point gently: the rules were tools, not laws.

## Exhibits as spells

The existing exhibit placeholders are a good start. They should be treated as named spell exhibits.

A spell exhibit has:

- a stable id;
- a short name;
- one thing the reader can change;
- one consequence the reader can see;
- one connection to the chapter's rule.

A good exhibit begins with something familiar, makes the friction visible, then lets the reader change the representation or boundary.

A bad exhibit is a toy that could be removed without weakening the chapter.

## Interaction rules

### The prose leads

Do not start chapters with widgets. Start with a question, scene, quote, problem, or piece of history. The reader should know why the exhibit matters before they touch it.

### One exhibit, one idea

An exhibit should not become a general playground unless the chapter needs a playground. Most exhibits should teach one reframe.

### Let the reader break something

The best exhibits often allow the reader to do the wrong thing.

Examples:

- Try to write overlapping annotations as HTML.
- Try to reuse a component whose hidden assumptions cross the wrong boundary.
- Try to connect data from three apps that all use private ids.

The failure is not a bug in the exhibit. It is the point.

### Show the machinery when it matters

Some exhibits should have a "show the machinery" button. That reveals the small code or data structure behind the spell.

This matches the book's argument: magic is not supernatural. It is invented machinery that someone learned to hide well.

### Keep a static fallback

Every exhibit should have a readable fallback: an image, transcript, diagram or short explanation. The book must not become unreadable when JavaScript fails, when a future browser changes, or when someone prints it.

A wizard does not trap a book inside a fragile app.

## Implementation stages

### Stage 1: Enhanced static manuscript

Turn the Markdown chapters into a static site.

Add:

- chapter map;
- readable typography;
- side margins;
- styled Wizard's rule cards;
- styled exhibit placeholders;
- references and marginal notes layout;
- stable paragraph anchors.

No complex demos yet.

### Stage 2: Living illustrations

Add small, robust SVG/CSS/JavaScript pieces:

- tally marks becoming positional columns;
- a URL becoming a route through protocol, host and path;
- nested tags becoming a tree;
- a knitted castle gathering threads;
- stones forming an arch.

These illustrations should be useful even if they are simple.

### Stage 3: Core explorable exhibits

Build the strongest five exhibits first:

1. `numbers-are-machines`
2. `html-chooses-a-tree`
3. `jaqt-extension-lab`
4. `knitted-castle-vs-lego-castle`
5. `linked-data-addresses`

If those five work, the format works.

### Stage 4: Reader marginalia

Add a small notes app in the margin. First store notes locally. Later allow the reader to store notes in their Solid pod.

This turns the book from a thing to consume into a place where the reader can keep their own thinking.

### Stage 5: Solid-published edition

Host the finished book as static Web resources, ideally from a Solid pod or Solid-compatible storage.

This should be more than deployment convenience. It should demonstrate the book's own argument: the Web as address, document, platform, commons, data and home.

## What this should feel like

A normal book says:

> Here is an idea.

This book should say:

> Here is an idea. Touch it. Break it. Now look again.

The reader should finish the book with the feeling that the format and the argument were the same thing.
