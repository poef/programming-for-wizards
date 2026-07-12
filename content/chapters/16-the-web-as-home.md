---
tags: programming for wizards
---

# The Web as home: who owns your home directory?

Earlier we saw the network becoming the operating system.

But where is the user's home directory, and who controls it?

Linked data gave us names and meanings that can cross application boundaries. It did not give the data a home.

On a normal computer, the home-directory question has an obvious answer, at least in theory. Your documents, photos, music, projects, notes, saved games, half-written novels and badly named folders live somewhere that is more yours than the applications are.

You can install another text editor without rewriting every document. You can open an image in a different program. You can remove an application and, if the world is not too cursed, your files remain.

The Web grew up differently.

Your mail lives in the mail application. Your photos live in the photo application. Your calendar lives in the calendar application. Each service brings its own account, storage, permissions, interface, business model and export button if you are lucky.

This is understandable. It is also strange.

When an application owns the interface, account, data and permissions, it can arrange the whole room around itself. That is convenient architecture.

But the boundary is in the wrong place.

The application has become the container for the user's life.

Software moved into the network. The user's home did not come with it.

## The old shape and another shape

One way to describe the modern Web is:

```text id="app-owned-world"
application -> account -> data
```

The application is the starting point. You choose an application, create an account inside it, and your data begins to accumulate there.

There is another possible shape:

```text id="user-owned-world"
identity -> data -> applications
```

The person is the starting point. The data lives near that person. Applications receive permission to read or change parts of it.

That looks like a small rearrangement. It is not.

In the first shape, replacing an application means moving your life from one system to another.

In the second, replacing an application can be closer to changing tools on a workbench.

Small, replaceable software requires a place where the important things are not owned by the software.

Linked data helps different tools understand the same things. It does not create this second shape by itself. We still need identity, storage and permission to exist independently of the application.

## Connecting to Solid

There is a project called [Solid](https://solidproject.org/) that explores this second shape.

Solid separates identity and data from applications. A person has an identity on the Web. Their data can live in storage they choose, usually called a pod. Applications ask for permission to read or change parts of it.

The application is no longer automatically the place where the data lives.

This is not a Solid manual. The details matter, but the wizardly part is the boundary it proposes.

Linked data describes what the data means and how it relates to other things.

Solid determines where that data lives, who controls it, and which applications may use it.

Linked data lets the meaning travel.

Solid gives the data a home.

## The margin you have been using

This is not only a proposal for some future Web.

This book is already trying to work this way.

You may have written notes in its margins. To the reader, the margin is simply part of the book. Underneath, it is provided by a small software component that can be included on any Web page.

At first, the notes are stored in your browser. You do not need an account, and the book does not receive everything you write.

Browser storage is useful, but it is not much of a home directory. The notes remain tied to one browser on one device. Clear the browser data and they disappear. Open the book somewhere else and the margin is empty.

That is why the margin also lets you connect to Solid.

Once connected, the component can store your notes in your pod. The margin remains here in the book, but the notes no longer live inside the book or belong to the software that displays them.

Open the book on another device and they can still be there.

Use the same notes component on another website and it can work with the same collection.

Replace the component and another one can read the notes, provided it understands their shape and you give it permission.

Each passage in the book has a stable address. A note can say which passage it belongs to without becoming part of the book itself.

Solid determines where the note lives, which identity it belongs to, and which applications may read or change it.

Linked data describes what the note means: who wrote it, which passage it annotates, when it was written, and whether it replies to another note.

The two ideas work together, but they do different jobs.

If you have connected the margin to your pod, you are not reading about a theoretical architecture.

You are already using it.

## Sharing one note

Private notes are useful, but readers sometimes write something that should become part of the wider book.

Perhaps you notice an error. Perhaps you know a better example. Perhaps the chapter reminds you of a paper I missed, or you disagree so precisely that the disagreement improves the argument.

Innovation happens elsewhere.

The notes component can let you share one selected note with the book.

Not the whole notebook. Not every unfinished thought in the margin. One note, deliberately chosen.

That note is sent to the book's inbox. It can then be read and curated by me, or by a suitably impressive artificial imitation of me working under close supervision.

Accepted notes can be indexed and made visible to readers who opt in to the shared notes layer.

This creates another boundary.

You own the private note collection. The book owns its curation. Sharing is the act that crosses between them.

A submitted note may be edited, rejected, answered or grouped with other notes. That editorial work does not need to happen inside the margin component. A separate tool can manage the inbox. Another can build the index. Another can display approved notes beside the relevant passages.

The tool that writes a note does not have to be the tool that publishes it.

The application that publishes it does not have to own the original notebook.

The parts meet through identities, addresses, permissions and shared meaning.

## The book follows its own advice

This is not an example added after the argument.

It is part of the book.

The margin component stays small because it does not have to become a publishing platform, identity provider, storage company and social network before it can be useful.

The book stays a book. It does not need to contain every reader's private notebook.

The inbox does not need to become the editor.

The public notes viewer does not need to know how the notes were originally written.

Each part has a boundary.

The book and the notes component meet at the address of a passage.

The notes component and the pod meet through Solid.

The private notes and the book's editorial process meet through one deliberate act of sharing.

The curated notes and later readers meet through an optional public layer.

None of these boundaries removes complexity. Permissions can be confusing. Applications may disagree about data. Vocabularies can drift. Storage providers can fail. A note may point to a passage that changes or disappears.

Separating the parts makes these problems visible.

The knitted castle hid them by tying everything into one application.

## Small tools, not kingdoms

If identity and data can outlive applications, software can become smaller.

A notes component can concentrate on being a good margin. Another application can search the notes. Another can display them differently. Another can connect them to books, tasks or projects.

None of them has to own the entire world to be useful.

This changes what replacement means.

A better notes tool does not first have to persuade you to abandon the notes you already wrote. It can ask for access and try to be better.

Innovation can arrive from elsewhere because your world is not sealed inside the original application.

A private application asks:

> How can we keep the user inside?

A personal Web asks:

> How can this tool remain useful after the user replaces it?

Those questions produce different software.

Solid may or may not become the final form of this idea. Final forms have not done very well in this book.

But the direction matters.

The Web has become an operating system.

The book provides the text.

The component provides the margin.

Solid gives the reader a home.
