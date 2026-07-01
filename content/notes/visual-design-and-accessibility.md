---
tags: programming for wizards, visual design, accessibility
---
# Visual design and accessibility guidelines

The digital version should feel like a serious publication that has learned a few habits from old manuscripts and magical books.

It should not become a game.

The fantasy layer is there to support the argument, not to distract from it. The reader is not collecting points, unlocking achievements, fighting monsters or navigating a fake medieval interface. They are reading a book with a strong voice, generous margins, visible references, rule cards and interactive exhibits that help them think.

The desired feeling is:

```text
serious publication + historical manuscript habits + living diagrams
```

not:

```text
fantasy game menu + parchment texture + decorative widgets
```

## Visual principles

### The text is primary

The prose remains the spine of the book. Layout, images, animations and exhibits must serve the reading path.

A chapter should still work if all decorative assets are removed. If a decoration is required to understand the argument, it is not decoration anymore and needs text, alt text, captions and a static fallback.

### Historical/fantastical, not fake-medieval

Use historical and public-domain material as inspiration: initials, marginalia, diagrams, maps, ornaments, manuscript layouts, old scientific illustrations, bookplates, rule cards and hand-drawn-looking symbols.

Avoid fake parchment backgrounds behind long text, heavy blackletter paragraphs, random dragons, swords, candle borders, or anything that makes the book look like a theme park.

The page should look like a modern Web publication that knows about manuscript culture, not like a scanned fantasy prop.

### Open assets only

Use public-domain or open-source assets where possible.

Every asset that ships with the book should have a clear source record:

```md
| File | Source | Creator | Date | License | Original link | Notes |
|---|---|---|---|---|---|---|
```

This includes cropped, recolored, traced or otherwise processed assets. Public domain does not mean source history should be lost. Keeping source records fits the scholarly/manuscript feeling of the project and prevents later uncertainty.

Good kinds of assets to look for:

- illuminated initials;
- manuscript borders and ornaments;
- marginal figures and pointing hands;
- historical diagrams and maps;
- line art suitable for SVG tracing;
- simple open-source UI icons for buttons and controls.

Do not use AI-generated medieval/fantasy art as the basis for the visual identity. It would work against the book's respect for history, authorship and provenance.

## Accessibility principles

Accessibility is part of the design, not a later cleanup pass.

The book should be pleasant to read for people using keyboards, screen readers, zoom, high-contrast settings, reduced-motion settings, simple fonts, mobile devices and ordinary browsers with JavaScript disabled or partially blocked.

### Progressive enhancement

Start with semantic HTML and readable content.

Then add:

1. layout;
2. marginal notes;
3. living illustrations;
4. explorable exhibits;
5. optional Solid features.

The lower layers must keep working when a higher layer fails.

A reader should never be locked out of the book because a script failed, an exhibit broke, a Solid login did not work, or a browser does not support one advanced API.

### Semantic structure

Generated chapter pages should use normal document structure:

- one `h1` per chapter;
- meaningful headings in order;
- paragraphs as paragraphs;
- figures with captions;
- code blocks as code blocks;
- links as links;
- buttons for actions, not clickable `div`s;
- form controls for editable settings.

Use ARIA only where normal HTML does not express the interaction. Do not use ARIA to hide bad markup.

### Keyboard access

All interactive features must be usable with a keyboard:

- navigation;
- opening and closing notes;
- editing notes;
- changing font settings;
- expanding references;
- using exhibit controls;
- opening static fallbacks;
- exporting notes.

Focus should be visible. Focus should not get trapped unless the user is inside a real dialog, and dialogs must be closable with Escape.

### Motion and animation

Animations should be calm and optional.

Respect `prefers-reduced-motion`. If an exhibit uses movement to explain something, provide a non-moving equivalent: steps, snapshots, labels or a static diagram.

Do not require tilt, shaking, dragging or precise pointer movement. Those can be delightful extras, but every important interaction needs an accessible alternative.

### Color and contrast

Do not encode meaning only in color.

Use color together with labels, shapes, icons or text. Make sure text, links, controls, note indicators and exhibit states have sufficient contrast in both light and dark themes.

The manuscript-inspired palette should stay quiet. Readability wins over atmosphere.

### Fonts and reader choice

The default typography may use bookish or historical fonts, but the reader must be able to switch to simpler fonts easily.

At minimum, provide reader settings for:

- publication style font;
- simple serif;
- simple sans-serif;
- high-legibility / dyslexia-friendly option;
- monospace for code remains separate;
- font size;
- line height;
- column width;
- light/dark/high-contrast theme.

Do not claim that one font solves dyslexia for everyone. Treat the dyslexia-friendly option as one useful reader preference among several.

Decorative fonts may be used for chapter initials, room labels or rule cards, but not for long passages. If a decorative heading font becomes hard to read, it has failed.

### Marginal notes and accessibility

The reader margin should be generous, but it should not be the only place where notes are available.

On desktop, notes can sit beside the relevant paragraph. On narrow screens, notes should become a drawer, list or inline expandable section.

Every note needs:

- a clear target;
- a keyboard-accessible edit button;
- a readable timestamp or metadata view when needed;
- export and deletion;
- no account requirement for local notes.

Screen readers should be able to discover whether a paragraph has notes and move between the text and its notes without losing context.

### Exhibits and fallbacks

Every exhibit needs:

- a title;
- a short instruction;
- labels for controls;
- keyboard interaction;
- screen-reader-friendly description of the current state where practical;
- a static fallback;
- a way to reset the exhibit;
- a way to reveal the underlying machinery when that matters.

An exhibit that can only be understood visually should have a text explanation. An exhibit that can only be operated with a pointer is not finished.

## Implementation hints

Use CSS custom properties for typography and theme settings:

```css
:root {
    --book-font-body: var(--font-publication);
    --book-font-heading: var(--font-publication-heading);
    --book-line-height: 1.6;
    --book-column-width: 42rem;
}

[data-font="simple-sans"] {
    --book-font-body: system-ui, sans-serif;
    --book-font-heading: system-ui, sans-serif;
}

[data-font="simple-serif"] {
    --book-font-body: Georgia, serif;
    --book-font-heading: Georgia, serif;
}

[data-font="high-legibility"] {
    --book-font-body: var(--font-high-legibility, system-ui, sans-serif);
    --book-font-heading: var(--font-high-legibility, system-ui, sans-serif);
}
```

Reader settings should be stored locally first, just like notes. Later, they may optionally be stored in a Solid pod.

The book should remember reader preferences, but it should also respect browser and operating-system preferences.

## The rule of thumb

Whenever visual style and usability disagree, usability wins.

The book can be strange, old, magical and beautiful. But it must never punish the reader for reading it.
