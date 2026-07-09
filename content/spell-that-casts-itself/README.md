# The Spell That Casts Itself

A standalone, dependency-free web toy for *Programming for Wizards*.

It implements the curiosity proposal where a sentence is also a tiny program:

> When I see a [thing], I will [action] it.

The reader can choose a target word, an action, and a replacement word. The spell then mutates a small sandboxed world of words. Some spells also affect the spell sentence itself, giving the toy its small strange-loop moment.

## Run it

Open `index.html` in a browser.

No build step is required. The app uses plain HTML, CSS, and one JavaScript module.

## Files

- `index.html` — page structure and copy
- `styles.css` — playful parchment/object styling and motion
- `spell.js` — tiny state model, renderer, and spell actions

## Design notes

The app is intentionally small and toy-like. It avoids dependencies and framework code, but does not try to be an abstract reusable library. The useful boundary is the small spell world: the spell may mutate that world and parts of its own displayed sentence, but never the surrounding page.

Important interactions are buttons, so the toy works by keyboard as well as pointer. Motion is softened and disabled through `prefers-reduced-motion`.

## Possible book integration

For a later embedded version, the app can be reduced to a custom element or initialized from a root node. The current version is standalone so it can be tried, copied, and changed directly.
