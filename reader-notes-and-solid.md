---
tags: programming for wizards, notes, solid, marginalia
---
# Reader notes and Solid publishing

The book should leave room for the reader.

This is both a presentation choice and a conceptual one. Medieval manuscripts often had generous margins: glosses, corrections, references, arguments, jokes, drawings and later hands speaking back to the text. A digital-first version of this book should recover some of that feeling.

The margin is not empty decoration. It is where the reader thinks.

## Marginal notes

Each paragraph, figure, code block and exhibit should be addressable. A reader should be able to add a note beside the thing they are responding to.

The simplest interaction:

1. The reader hovers or taps near a paragraph.
2. A small note button appears in the margin.
3. The reader writes a note.
4. The note stays attached to that paragraph.
5. The reader can hide, edit, export or delete their notes.

On desktop, notes live in the side margin. On mobile, they live in a drawer or bottom sheet.

## Stable paragraph ids

Notes need stable anchors. That means the generated site should give meaningful ids to blocks of content.

A simple first version:

```html
<p id="p-05-url-small-door">
    It is a small door.
</p>
```

The id should not be based only on paragraph number, because paragraph numbers change during editing. It should be based on a short slug, possibly generated once and then kept stable.

When a paragraph is rewritten heavily, it is acceptable for notes to become orphaned. The notes app should show those as notes attached to an older version of the text.

## Local-first notes

The first notes app should store data locally. That keeps the feature small and makes it work without login.

A minimal local note could look like this:

```json
{
    "id": "note-2026-07-01-001",
    "book": "programming-for-wizards",
    "chapter": "05-the-web-as-address",
    "target": "p-05-url-small-door",
    "created": "2026-07-01T12:00:00Z",
    "updated": "2026-07-01T12:04:00Z",
    "text": "This is close to the book's main theme: a tiny representation can open a much larger world."
}
```

For the first version, `localStorage` may be enough. If the notes become larger or need offline indexing, use IndexedDB.

Important operations:

- add note;
- edit note;
- delete note;
- show all notes in a chapter;
- export notes as JSON or Markdown;
- import notes again.

The reader's notes should never require an account.

## Later: notes in a Solid pod

The later version can store notes in the reader's Solid pod.

That makes the note system part of the book's argument. The reader's thoughts about the book should belong to the reader, not to the book site.

A Solid-backed note can be stored as a small document in the reader's storage. The book only needs permission to read and write the notes the reader chooses to keep there.

A possible storage shape:

```text
/notes/programming-for-wizards/
    index.ttl
    note-2026-07-01-001.ttl
    note-2026-07-01-002.ttl
```

A note document could describe:

- the book;
- the chapter;
- the target block id;
- the note text;
- timestamps;
- optional tags;
- optional relation to a Wizard's rule or exhibit.

The exact vocabulary can be decided later. The important thing is the boundary: the book provides the interface, but the reader owns the notes.

## Publishing the book from a Solid pod

The final book should be publishable as static Web resources. Ideally, it should also be possible to host it from a Solid pod or Solid-compatible Web storage.

This fits the final arc of the book:

- the Web as address: every chapter and block can be pointed at;
- the Web as document: the manuscript remains readable;
- the Web as platform: the book can run its exhibits;
- the Web as commons: other people can link, remix, cite and build around it;
- the Web as data: notes and references can have explicit meaning;
- the Web as home: the reader's notes can live with the reader.

A Solid-hosted edition should avoid server-side dependencies. The book should be a collection of static files:

```text
/index.html
/chapters/05-the-web-as-address.html
/assets/book.css
/assets/book.js
/exhibits/html-chooses-a-tree/index.html
/data/manifest.json
```

The site may be generated from Markdown, but the published result should be ordinary Web files.

## A small manifest

The generated book should include a manifest that describes chapters, exhibits, rules and anchors.

Example:

```json
{
    "id": "programming-for-wizards",
    "title": "Programming for Wizards",
    "chapters": [
        {
            "id": "05-the-web-as-address",
            "title": "The Web as address: a spell for pointing anywhere",
            "url": "chapters/05-the-web-as-address.html",
            "rule": "Wizard's fourth rule"
        }
    ],
    "features": {
        "notes": true,
        "solidNotes": "planned"
    }
}
```

The notes app can use this manifest to know what it can attach notes to.

## Privacy and ownership

The notes feature should be designed from the beginning with a simple promise:

> The reader's notes are the reader's notes.

That means:

- no hidden analytics in notes;
- no remote storage unless the reader chooses it;
- export must be possible;
- deletion must be real;
- Solid storage should be optional, not required.

This is not just a privacy feature. It is part of the book's thesis.

Software should be small and replaceable. That includes the software used to read the book.

## First implementation sketch

The first version can be very small.

HTML:

```html
<p id="p-05-url-small-door" data-note-target>
    It is a small door.
</p>
```

JavaScript concept:

```js
const notes = loadNotes()

for (const target of document.querySelectorAll("[data-note-target]")) {
    attachNoteButton(target, {
        onSave(text) {
            saveNote({
                chapter: currentChapterId,
                target: target.id,
                text
            })
        }
    })
}
```

This is enough to prove the interaction.

Do not start with synchronization, accounts, sharing, collaborative annotations, moderation, comments or social features. Those are different systems.

Start with the margin.
