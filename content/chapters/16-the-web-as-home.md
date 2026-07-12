---
tags: programming for wizards
---

# The Web as home: who owns your home directory?

<!-- paragraph-id: p-16-earlier-we-saw-the-network-becoming-the-operating -->
Earlier we saw the network becoming the operating system.

<!-- paragraph-id: p-16-but-where-is-the-users-home-directory-and -->
But where is the user's home directory, and who controls it?

<!-- paragraph-id: p-16-linked-data-gave-us-names-and-meanings-that -->
Linked data gave us names and meanings that can cross application boundaries. It did not give the data a home.

<!-- paragraph-id: p-16-on-a-normal-computer-the-home-directory-question -->
On a normal computer, the home-directory question has an obvious answer, at least in theory. Your documents, photos, music, projects, notes, saved games, half-written novels and badly named folders live somewhere that is more yours than the applications are.

<!-- paragraph-id: p-16-you-can-install-another-text-editor-without-rewriting -->
You can install another text editor without rewriting every document. You can open an image in a different program. You can remove an application and, if the world is not too cursed, your files remain.

<!-- paragraph-id: p-16-the-web-grew-up-differently -->
The Web grew up differently.

<!-- paragraph-id: p-16-your-mail-lives-in-the-mail-application-your -->
Your mail lives in the mail application. Your photos live in the photo application. Your calendar lives in the calendar application. Each service brings its own account, storage, permissions, interface, business model and export button if you are lucky.

<!-- paragraph-id: p-16-this-is-understandable-it-is-also-strange -->
This is understandable. It is also strange.

<!-- paragraph-id: p-16-when-an-application-owns-the-interface-account-data -->
When an application owns the interface, account, data and permissions, it can arrange the whole room around itself. That is convenient architecture.

<!-- paragraph-id: p-16-but-the-boundary-is-in-the-wrong-place -->
But the boundary is in the wrong place.

<!-- paragraph-id: p-16-the-application-has-become-the-container-for-the -->
The application has become the container for the user's life.

<!-- paragraph-id: p-16-software-moved-into-the-network-the-users-home -->
Software moved into the network. The user's home did not come with it.

## The old shape and another shape

<!-- paragraph-id: p-16-one-way-to-describe-the-modern-web-is -->
One way to describe the modern Web is:

<!-- code-id: app-owned-world -->
```text id="app-owned-world"
application -> account -> data
```

<!-- paragraph-id: p-16-the-application-is-the-starting-point-you-choose -->
The application is the starting point. You choose an application, create an account inside it, and your data begins to accumulate there.

<!-- paragraph-id: p-16-there-is-another-possible-shape -->
There is another possible shape:

<!-- code-id: user-owned-world -->
```text id="user-owned-world"
identity -> data -> applications
```

<!-- paragraph-id: p-16-the-person-is-the-starting-point-the-data -->
The person is the starting point. The data lives near that person. Applications receive permission to read or change parts of it.

<!-- paragraph-id: p-16-that-looks-like-a-small-rearrangement-it-is -->
That looks like a small rearrangement. It is not.

<!-- paragraph-id: p-16-in-the-first-shape-replacing-an-application-means -->
In the first shape, replacing an application means moving your life from one system to another.

<!-- paragraph-id: p-16-in-the-second-replacing-an-application-can-be -->
In the second, replacing an application can be closer to changing tools on a workbench.

<!-- paragraph-id: p-16-small-replaceable-software-requires-a-place-where-the -->
Small, replaceable software requires a place where the important things are not owned by the software.

<!-- paragraph-id: p-16-linked-data-helps-different-tools-understand-the-same -->
Linked data helps different tools understand the same things. It does not create this second shape by itself. We still need identity, storage and permission to exist independently of the application.

## Connecting to Solid

<!-- paragraph-id: p-16-there-is-a-project-called-solid-that-explores -->
There is a project called [Solid](https://solidproject.org/) that explores this second shape.

<!-- paragraph-id: p-16-solid-does-not-have-to-conquer-the-web -->
Solid does not have to conquer the Web for the boundary it demonstrates to be useful.

<!-- paragraph-id: p-16-solid-separates-identity-and-data-from-applications-a -->
Solid separates identity and data from applications. A person has an identity on the Web. Their data can live in storage they choose, usually called a pod. Applications ask for permission to read or change parts of it.

<!-- paragraph-id: p-16-the-application-is-no-longer-automatically-the-place -->
The application is no longer automatically the place where the data lives.

<!-- paragraph-id: p-16-this-is-not-a-solid-manual-the-details -->
This is not a Solid manual. The details matter, but the wizardly part is the boundary it proposes.

<!-- paragraph-id: p-16-linked-data-describes-what-the-data-means-and -->
Linked data describes what the data means and how it relates to other things.

<!-- paragraph-id: p-16-solid-determines-where-that-data-lives-who-controls -->
Solid determines where that data lives, who controls it, and which applications may use it.

<!-- paragraph-id: p-16-linked-data-lets-the-meaning-travel -->
Linked data lets the meaning travel.

<!-- paragraph-id: p-16-solid-gives-the-data-a-home -->
Solid gives the data a home.

## The margin you have been using

<!-- paragraph-id: p-16-this-is-not-only-a-proposal-for-some -->
This is not only a proposal for some future Web.

<!-- paragraph-id: p-16-this-book-is-already-trying-to-work-this -->
This book is already trying to work this way.

<!-- paragraph-id: p-16-you-may-have-written-notes-in-its-margins -->
You may have written notes in its margins. To the reader, the margin is simply part of the book. Underneath, it is provided by a small software component that can be included on any Web page.

<!-- paragraph-id: p-16-at-first-the-notes-are-stored-in-your -->
At first, the notes are stored in your browser. You do not need an account, and the book does not receive everything you write.

<!-- paragraph-id: p-16-browser-storage-is-useful-but-it-is-not -->
Browser storage is useful, but it is not much of a home directory. The notes remain tied to one browser on one device. Clear the browser data and they disappear. Open the book somewhere else and the margin is empty.

<!-- paragraph-id: p-16-that-is-why-the-margin-also-lets-you -->
That is why the margin also lets you connect to Solid.

<!-- paragraph-id: p-16-once-connected-the-component-can-store-your-notes -->
Once connected, the component can store your notes in your pod. The margin remains here in the book, but the notes no longer live inside the book or belong to the software that displays them.

<!-- paragraph-id: p-16-open-the-book-on-another-device-and-they -->
Open the book on another device and they can still be there.

<!-- paragraph-id: p-16-use-the-same-notes-component-on-another-website -->
Use the same notes component on another website and it can work with the same collection.

<!-- paragraph-id: p-16-replace-the-component-and-another-one-can-read -->
Replace the component and another one can read the notes, provided it understands their shape and you give it permission.

<!-- paragraph-id: p-16-each-passage-in-the-book-has-a-stable -->
Each passage in the book has a stable address. A note can say which passage it belongs to without becoming part of the book itself.

<!-- paragraph-id: p-16-solid-determines-where-the-note-lives-which-identity -->
Solid determines where the note lives, which identity it belongs to, and which applications may read or change it.

<!-- paragraph-id: p-16-linked-data-describes-what-the-note-means-who -->
Linked data describes what the note means: who wrote it, which passage it annotates, when it was written, and whether it replies to another note.

<!-- paragraph-id: p-16-the-two-ideas-work-together-but-they-do -->
The two ideas work together, but they do different jobs.

<!-- paragraph-id: p-16-if-you-have-connected-the-margin-to-your -->
If you have connected the margin to your pod, you are not reading about a theoretical architecture.

<!-- paragraph-id: p-16-you-are-already-using-it -->
You are already using it.

## Sharing one note

<!-- paragraph-id: p-16-private-notes-are-useful-but-readers-sometimes-write -->
Private notes are useful, but readers sometimes write something that should become part of the wider book.

<!-- paragraph-id: p-16-perhaps-you-notice-an-error-perhaps-you-know -->
Perhaps you notice an error. Perhaps you know a better example. Perhaps the chapter reminds you of a paper I missed, or you disagree so precisely that the disagreement improves the argument.

<!-- paragraph-id: p-16-innovation-happens-elsewhere -->
Innovation happens elsewhere.

<!-- paragraph-id: p-16-the-notes-component-can-let-you-share-one -->
The notes component can let you share one selected note with the book.

<!-- paragraph-id: p-16-not-the-whole-notebook-not-every-unfinished-thought -->
Not the whole notebook. Not every unfinished thought in the margin. One note, deliberately chosen.

<!-- paragraph-id: p-16-that-note-is-sent-to-the-books-inbox -->
That note is sent to the book's inbox. It can then be read and curated by me, or by a suitably impressive artificial imitation of me working under close supervision.

<!-- paragraph-id: p-16-accepted-notes-can-be-indexed-and-made-visible -->
Accepted notes can be indexed and made visible to readers who opt in to the shared notes layer.

<!-- paragraph-id: p-16-this-creates-another-boundary -->
This creates another boundary.

<!-- paragraph-id: p-16-you-own-the-private-note-collection-the-book -->
You own the private note collection. The book owns its curation. Sharing is the act that crosses between them.

<!-- paragraph-id: p-16-a-submitted-note-may-be-edited-rejected-answered -->
A submitted note may be edited, rejected, answered or grouped with other notes. That editorial work does not need to happen inside the margin component. A separate tool can manage the inbox. Another can build the index. Another can display approved notes beside the relevant passages.

<!-- paragraph-id: p-16-the-tool-that-writes-a-note-does-not -->
The tool that writes a note does not have to be the tool that publishes it.

<!-- paragraph-id: p-16-the-application-that-publishes-it-does-not-have -->
The application that publishes it does not have to own the original notebook.

<!-- paragraph-id: p-16-the-parts-meet-through-identities-addresses-permissions-and -->
The parts meet through identities, addresses, permissions and shared meaning.

## The book follows its own advice

<!-- paragraph-id: p-16-this-is-not-an-example-added-after-the -->
This is not an example added after the argument.

<!-- paragraph-id: p-16-it-is-part-of-the-book -->
It is part of the book.

<!-- paragraph-id: p-16-the-margin-component-stays-small-because-it-does -->
The margin component stays small because it does not have to become a publishing platform, identity provider, storage company and social network before it can be useful.

<!-- paragraph-id: p-16-the-book-stays-a-book-it-does-not -->
The book stays a book. It does not need to contain every reader's private notebook.

<!-- paragraph-id: p-16-the-inbox-does-not-need-to-become-the -->
The inbox does not need to become the editor.

<!-- paragraph-id: p-16-the-public-notes-viewer-does-not-need-to -->
The public notes viewer does not need to know how the notes were originally written.

<!-- paragraph-id: p-16-each-part-has-a-boundary -->
Each part has a boundary.

<!-- paragraph-id: p-16-the-book-and-the-notes-component-meet-at -->
The book and the notes component meet at the address of a passage.

<!-- paragraph-id: p-16-the-notes-component-and-the-pod-meet-through -->
The notes component and the pod meet through Solid.

<!-- paragraph-id: p-16-the-private-notes-and-the-books-editorial-process -->
The private notes and the book's editorial process meet through one deliberate act of sharing.

<!-- paragraph-id: p-16-the-curated-notes-and-later-readers-meet-through -->
The curated notes and later readers meet through an optional public layer.

<!-- paragraph-id: p-16-none-of-these-boundaries-removes-complexity-permissions-can -->
None of these boundaries removes complexity. Permissions can be confusing. Applications may disagree about data. Vocabularies can drift. Storage providers can fail. A note may point to a passage that changes or disappears.

<!-- paragraph-id: p-16-separating-the-parts-makes-these-problems-visible -->
Separating the parts makes these problems visible.

<!-- paragraph-id: p-16-the-knitted-castle-hid-them-by-tying-everything -->
The knitted castle hid them by tying everything into one application.

## Small tools, not kingdoms

<!-- paragraph-id: p-16-if-identity-and-data-can-outlive-applications-software -->
If identity and data can outlive applications, software can become smaller.

<!-- paragraph-id: p-16-a-notes-component-can-concentrate-on-being-a -->
A notes component can concentrate on being a good margin. Another application can search the notes. Another can display them differently. Another can connect them to books, tasks or projects.

<!-- paragraph-id: p-16-none-of-them-has-to-own-the-entire -->
None of them has to own the entire world to be useful.

<!-- paragraph-id: p-16-this-changes-what-replacement-means -->
This changes what replacement means.

<!-- paragraph-id: p-16-a-better-notes-tool-does-not-first-have -->
A better notes tool does not first have to persuade you to abandon the notes you already wrote. It can ask for access and try to be better.

<!-- paragraph-id: p-16-innovation-can-arrive-from-elsewhere-because-your-world -->
Innovation can arrive from elsewhere because your world is not sealed inside the original application.

<!-- paragraph-id: p-16-a-private-application-asks -->
A private application asks:

<!-- aside-id: aside-16-how-can-we-keep-the-user-inside -->
> How can we keep the user inside?

<!-- paragraph-id: p-16-a-personal-web-asks -->
A personal Web asks:

<!-- aside-id: aside-16-how-can-this-tool-remain-useful-after-the -->
> How can this tool remain useful after the user replaces it?

<!-- paragraph-id: p-16-those-questions-produce-different-software -->
Those questions produce different software.

<!-- paragraph-id: p-16-solid-may-or-may-not-become-the-final -->
Solid may or may not become the final form of this idea. Final forms have not done very well in this book.

<!-- paragraph-id: p-16-but-the-direction-matters -->
But the direction matters.

<!-- paragraph-id: p-16-the-web-has-become-an-operating-system -->
The Web has become an operating system.

<!-- paragraph-id: p-16-the-book-provides-the-text -->
The book provides the text.

<!-- paragraph-id: p-16-the-component-provides-the-margin -->
The component provides the margin.

<!-- paragraph-id: p-16-solid-gives-the-reader-a-home -->
Solid gives the reader a home.
