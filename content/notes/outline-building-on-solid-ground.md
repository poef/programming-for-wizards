# Building Software on Solid Ground

## Revised outline and rationale

## Working premise

*Programming for Wizards* explains why software changes shape when we change its words, boundaries, and assumptions.

This book is about how to work that way in practice.

It follows the construction of the margin-notes application used by *Programming for Wizards*. The application begins as a small browser enhancement and gradually becomes a reusable, replaceable tool that can work with linked data stored in a user's Solid pod.

The book does not begin with the final architecture.

It begins with the smallest useful thing that works.

Each later design decision appears because the working application reveals a real limitation. The architecture grows through replacement, not prediction.

---

# Why change the original outline?

The earlier outline was organised mainly around layers in the technical stack:

1. build the application with SimplyFlow;
2. give it a linked-data model;
3. store that data with Solid;
4. share data and capabilities;
5. make the software reusable;
6. continue into residential programming.

That progression is technically logical, but it risks becoming a tour of a collection of libraries and ideas.

The revised outline is organised around discoveries made while building one real application:

> We build the smallest useful margin.  
> It works.  
> Reality reveals what it cannot do.  
> Each limitation forces us to move a boundary.

This makes the architecture part of the story rather than something presented fully formed at the beginning.

It also gives every abstraction a reason to exist.

A storage interface appears because storage decisions have started spreading through the application.

Linked data appears because another application needs to understand the notes.

Solid appears because the notes need a home independent of the application.

The inbox appears because sharing one selected note is not the same as sharing an entire notebook.

Replaceability appears because a second application should be able to work with the same data.

The book remains practical because each new idea solves a problem the reader has already encountered in working code.

---

# Editorial direction

The book should follow the same rhythm repeatedly:

1. Build the smallest thing that works.
2. Use it until a limitation becomes visible.
3. Identify which decision or assumption escaped its proper boundary.
4. Introduce the smallest structural change that contains it.
5. Show the cost of the new design.
6. Leave the next unsolved problem visible.

The clean architecture should not be presented as though it was obvious from the beginning.

Where useful, the book should preserve reasonable early versions that are later replaced:

- direct browser-storage calls before a `NoteStore` boundary;
- private JSON before linked data;
- notes tied to DOM positions before stable passage identities;
- one component handling private notes and publishing before an inbox boundary;
- application-owned configuration before page-level discovery;
- an abstraction that looked useful but was later removed.

These should be real intermediate designs, not contrived mistakes created for teaching.

The underlying practical argument is:

> Architecture is not the plan written before implementation.  
> It is the structure discovered while keeping each answer cheap enough to replace.

---

# Outline

## Introduction — Build the margin, not the platform

Introduce the application and the method used throughout the book.

The reader should understand:

- what the finished margin-notes application does;
- how it appears inside *Programming for Wizards*;
- why the first version will deliberately omit Solid, linked data, accounts, synchronisation, and publishing;
- why an incomplete working application is a better starting point than an imagined final architecture;
- that the first design is expected to be wrong.

The opening promise is simple:

> We will begin with a margin that works in one browser, then follow the problems it creates until the architecture becomes visible.

---

# Part I — A working margin

The first part produces a genuinely useful browser-only application.

## 1. Give every passage an address

Identify the passages in a document and attach stable identifiers to them.

Topics:

- discovering paragraphs and other annotatable elements;
- stable passage identifiers;
- why page position is not identity;
- linking interface elements to content without taking ownership of the page;
- using the Web's existing addressing model at a smaller scale.

The result is a page whose passages can be referred to reliably.

## 2. Write the first note

Place an editor beside a passage and connect user actions to application state.

Topics:

- adding the Cobalt Note editor;
- selecting or activating a passage;
- creating a note;
- displaying notes beside their passages;
- keeping the first data model deliberately small.

The result works until the page reloads.

## 3. Keep it after reload

Persist notes in browser storage and restore them.

Topics:

- serialising the current note model;
- local storage as the smallest useful persistence mechanism;
- loading notes when the page opens;
- handling missing or malformed data;
- what browser storage provides;
- what browser storage cannot provide.

The result is now useful without an account or server.

## 4. Turn the feature into a visitor

Package the margin as a component that can be added to another page.

Topics:

- loading the component with a script tag;
- page-level configuration;
- discovering passages without controlling the document;
- keeping styles and behaviour contained;
- lifecycle and cleanup;
- what the host page must promise;
- what the component must not assume.

The margin becomes a visitor rather than the owner of the page.

---

# Part II — Make the first answer replaceable

The browser-only version works, but implementation decisions have begun to spread.

## 5. The storage decision escaped

Inspect what happens when browser-storage calls appear throughout the application.

Topics:

- hidden dependencies;
- repeated knowledge about keys and serialisation;
- difficulty testing application behaviour;
- storage decisions leaking into interface code;
- recognising that a dependency is also a decision.

The chapter should show the problem before introducing the abstraction.

## 6. Give the decision a boundary

Introduce a small storage contract such as `NoteStore`.

Topics:

- defining the smallest useful storage interface;
- moving browser storage behind an implementation;
- choosing which data crosses the boundary;
- explicit dependencies;
- replacing storage without rewriting the application;
- the cost of adding the boundary.

The application should still behave exactly as before.

## 7. Build small bridges

Separate passage discovery, note editing, application state, and persistence.

Topics:

- bridges as homes for connection knowledge;
- avoiding parts that know the entire application;
- composing small pieces;
- keeping coordination visible;
- shell and core;
- keeping clocks, storage, DOM access, and identity at the edges where possible.

The application becomes easier to change without becoming a framework.

## 8. Test the bargain

Test the behaviour promised at the boundaries.

Topics:

- contracts rather than broad implementation tests;
- testing the note rules without a browser;
- testing the storage boundary with an in-memory implementation;
- testing DOM adapters separately;
- assertions and meaningful errors;
- testing what another implementation is allowed to rely on.

This part turns the architectural conclusions of *Programming for Wizards* into working technique.

---

# Part III — Give the notes meaning

The code can now replace its storage implementation, but another application still cannot understand the stored notes.

## 9. JSON is never just JSON

Examine the private JSON model.

Topics:

- why syntactic portability is not interoperability;
- private property names;
- implicit types and relationships;
- application-specific identifiers;
- what a second notes application would have to guess;
- the difference between exporting bytes and sharing meaning.

The reader should see that the problem is not JSON itself, but the private language hidden inside it.

## 10. Give notes and passages names

Introduce Web identities for the things in the note model.

Topics:

- identifying notes independently of array positions;
- identifying passages independently of the current DOM;
- authors, replies, timestamps, and collections;
- stable identifiers;
- when an address identifies a document and when it identifies a thing;
- avoiding accidental identity tied to one implementation.

The note model begins to survive outside the component that created it.

## 11. Model the note as linked data

Represent the model using linked data.

Topics:

- subject, predicate, and object;
- small facts that can join other facts;
- vocabularies;
- RDF as a model rather than one serialisation;
- Turtle and JSON-LD;
- OLDMed property names;
- mapping application concepts to shared and local terms;
- keeping the model small enough to understand.

The chapter should focus on the practical note model rather than becoming a general linked-data tutorial.

## 12. Shapes, not cages

Use shapes to match and validate the data without forcing all data through one private object model.

Topics:

- recognising notes in a larger graph;
- validating what the application needs;
- preserving predicates the application does not understand;
- loading and saving without erasing another tool's work;
- the difference between a view of the data and ownership of the data;
- why the shape should not become another knitted castle.

This part ends with data that can outlive the original implementation.

---

# Part IV — Give the data a home

The data has public meaning but still lives in one browser.

## 13. Connect a person, not an account

Add Solid authentication while preserving the usefulness of the local application.

Topics:

- optional connection to Solid;
- keeping browser-only use as the default;
- Web identity;
- authentication as an external capability;
- separating identity from application accounts;
- user choice of identity provider;
- what the application learns after login;
- graceful behaviour when no Solid identity is available.

The application should not become useless until the user signs in.

## 14. Move the notes without moving the application

Store the same note model in a Solid pod.

Topics:

- choosing or discovering a note resource or inbox;
- loading and saving linked data;
- replacing the browser `NoteStore` with a Solid-backed implementation;
- using SimplySolid;
- preserving the application core;
- migrating or copying existing local notes deliberately;
- meaningful errors and partial failure.

The key demonstration is that the application remains largely unchanged while the data gains an independent home.

## 15. Work across resources

Introduce the workspace model because the data is no longer one private object in one store.

Topics:

- multiple resources;
- source-aware data;
- containers and resource discovery;
- shaped collections over a workspace;
- adding resources later;
- read-only sources;
- enrichment from other sources;
- keeping source tracking out of the application model where possible.

The workspace should appear because the application now needs it, not because it is part of the framework.

## 16. Saving is not one operation

Deal with the realities hidden by a simple `save()` call.

Topics:

- existing objects returning to their original resources;
- new objects choosing a destination;
- identity generation;
- multiple resource writes;
- partial success;
- error aggregation;
- read-only sources;
- creation, updates, and unchanged resources;
- when `saveAll()` is appropriate and when detailed results matter.

The chapter should show that moving a boundary often exposes complexity rather than removing it.

## 17. Offline first, connected second

Decide what browser storage still does after Solid is available.

Topics:

- local drafts;
- caching;
- disconnected use;
- conflict and synchronisation limits;
- whether local storage is a fallback, cache, or separate source;
- preserving simple local use;
- avoiding a false promise of seamless synchronisation;
- what remains outside the scope of the first implementation.

This part should be explicit about which problems are solved and which are merely moved into shared infrastructure.

---

# Part V — Let other tools in

The data now lives outside the application. The next test is whether another application can actually use it.

## 18. Use the same notes somewhere else

Install the component on another website and connect it to the same note collection.

Topics:

- site-specific passage identities;
- page metadata for configuration and discovery;
- choosing a Solid inbox or storage location;
- loading notes from more than one source;
- optional public note layers;
- keeping host-specific assumptions out of the note model.

This proves that the component is not tied only to *Programming for Wizards*.

## 19. Replace the margin component

Build or sketch a second reader or editor over the same data.

Topics:

- replacement as the test of a boundary;
- using the same notes without sharing the same code;
- preserving unknown data;
- different interface choices over the same model;
- compatibility between independently developed tools;
- discovering where the first vocabulary or shape is insufficient.

This is the strongest practical test of the architecture.

## 20. Share one note, not the notebook

Add deliberate sharing to the book.

Topics:

- private notes versus submitted notes;
- selecting one note;
- sending it to the book's inbox;
- permissions;
- copying, linking, or transferring responsibility;
- making the crossing between private and public explicit;
- preventing the publishing workflow from becoming implicit access to the user's notebook.

The boundary should match the user's action.

## 21. Separate writing from publishing

Split the public-note workflow into independent tools.

Topics:

- writing a note;
- receiving submissions;
- moderation and curation;
- indexing accepted notes;
- displaying notes beside passages;
- different ownership of each step;
- stable agreements between the tools;
- allowing one tool to be replaced without replacing the workflow.

The margin component should remain small because it does not become a publishing platform.

## 22. Innovation arrives from elsewhere

Show what the architecture permits beyond the original implementation.

Topics:

- alternative editors and viewers;
- tools for searching or organising notes;
- annotation across multiple books or sites;
- public and private layers;
- other vocabularies;
- extensions nobody involved in the original application planned;
- the limits of openness;
- why a commons still needs stable streets.

The conclusion of this part is that interoperability is not reusable code. It is reusable ground.

---

# Part VI — Let the application change

Residential programming should remain a shorter, clearly experimental extension rather than the destination of the whole book.

## 23. The user wants a different margin

Begin with one concrete modification.

Topics might include:

- a different note layout;
- a different editor;
- alternative keyboard behaviour;
- displaying an extra field;
- changing how public notes appear.

The chapter should begin from a real user need rather than from the residential-programming model.

## 24. Change a component without forking the world

Apply a local overlay.

Topics:

- explicit application opt-in;
- component-shaped overlays;
- changed parts plus a reference to the original;
- local overlays loaded last;
- preserving lexical imports;
- storing overlays per application and origin;
- live editing and reload;
- limits of the first proof of concept.

The modification should remain smaller than the original application.

## 25. Share a modification, not a replacement kingdom

Allow a remote modification to travel.

Topics:

- remote mods as overlays;
- discovery and trust;
- composing multiple modifications;
- naming and collision handling;
- keeping the base application replaceable;
- separating the modification from the user's data;
- when a fork is still the honest answer.

The chapter should show the direction without claiming that the model is settled.

## 26. What remains experimental

End with a clear accounting.

Separate:

- what the application has demonstrated directly;
- what existing Web and Solid standards support;
- what the SimplyFlow and SimplySolid libraries currently implement;
- what remains a design hypothesis;
- what proved awkward;
- what should be replaced in a second version;
- which questions deserve experiments of their own.

Residential programming should end as an invitation to continue testing, not as a final layer that completes the stack.

---

# The progression of boundaries

The whole book can be understood as a sequence in which the boundary of the application moves:

```text
page enhancement
    -> component
    -> local application
    -> storage-independent application
    -> portable linked data
    -> user-controlled storage
    -> interoperable applications
    -> modifiable software
```

Each step keeps something stable while allowing something else to change.

The page remains useful while the component comes and goes.

The application remains useful while storage changes.

The data remains useful while applications change.

The user's world remains available while tools arrive and leave.

The final architecture is not presented as a perfect end state. It is the current result of a sequence of replaceable answers.

---

# Relationship to Programming for Wizards

The new book should not repeat the arguments of *Programming for Wizards* in full.

It should let those ideas reappear as practical problems:

- **Change the words, change the world** becomes the design of the note vocabulary.
- **Every program grows a language** becomes the evolution from private JSON to an explicit linked-data model.
- **Assumptions are threads** becomes the extraction of storage, page, identity, and publishing boundaries.
- **Choose wisely when to choose** becomes optional login, delayed storage selection, and explicit creation targets.
- **Architecture is how you survive being wrong** becomes the replacement of early implementations without rebuilding the whole application.
- **Innovation happens elsewhere** becomes a second application working with the same notes.
- **The user needs a home directory** becomes the Solid-backed note collection.
- **There are no rules** becomes the final accounting of which design choices should be reconsidered.

The books therefore form a pair:

> *Programming for Wizards* asks how software came to look inevitable and how to see its choices again.

> *Building Software on Solid Ground* shows one application changing as those choices are made, tested, and replaced.

---

# Tone and presentation

The book should remain practical and concrete.

Prefer:

- working code early;
- visible behaviour;
- small diffs;
- diagrams only when they clarify a real boundary;
- honest intermediate versions;
- explicit trade-offs;
- direct tests of replaceability;
- short returns to the earlier book where they help orient the reader.

Avoid:

- presenting the Muze stack as the inevitable solution;
- introducing a library before the application needs it;
- replacing code with architectural slogans;
- pretending that linked data or Solid removes complexity;
- treating the final design as though it was known in advance;
- explaining every connection between the two books;
- turning residential programming into the culmination of all software architecture.

The application should remain the subject.

The libraries, standards, and architectural patterns are tools it acquires along the way.

---

# Working conclusion

The practical lesson of the book is not:

> Design the correct architecture before you begin.

It is:

> Build an answer small enough to use.  
> Notice where it becomes difficult to change.  
> Put a boundary around that difficulty.  
> Keep the answer replaceable.  
> Repeat.

The margin-notes application is valuable as a subject because it begins as a tiny enhancement and eventually touches identity, storage, meaning, permissions, interoperability, publishing, and user modification.

Its growth reveals the architecture.

The book should let the reader discover that architecture in the same order.
