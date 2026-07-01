---
tags: programming for wizards
---

# The Web as home: your data should outlive your apps

Chapter 7 left a question hanging.

If the web becomes the operating system, who owns the home directory?

The previous chapter added another pressure. If innovation happens elsewhere, users should be able to benefit from tools that were invented elsewhere. That is much harder when each application owns its own little copy of the user's life.

On a normal computer the home-directory question has an obvious answer, at least in theory. There is a place where your files live. Your documents, photos, music, projects, notes, saved games, half-written novels and badly named folders all sit somewhere that is more yours than the applications are.

You can install a different text editor without rewriting all your text files. You can open an image in another program. You can delete an application and, if the world is not too cursed, your documents remain.

The web grew up differently.

On the web, each application tends to bring its own little home with it. Your mail lives in the mail app. Your photos live in the photo app. Your calendar lives in the calendar app. Your contacts live wherever your phone, mail provider or social network decided they should live. Every service gives you an account, a profile, a storage area, a permission model, an export button if you are lucky, and a terms-of-service document nobody reads until something has gone wrong.

This is understandable. It is also strange.

The web's first great trick was that a document could point outside itself. A URL could cross from one machine to another without asking the document to understand the machinery on the other side. HTML gave documents a shared shape. JavaScript turned the browser into a programmable surface. Step by step the web became less like a library of pages and more like a place where software lives.

But while the software moved into the network, the user's home did not really come with it.

Instead we got thousands of private little castles.

## The app owns the room

When an app owns both the interface and the data, the boundary is convenient for the app. The app knows where everything is. It can design the database around its own screens. It can add features without asking other applications for permission. It can optimize the whole little world around itself.

This is why it keeps happening. The private castle is not only greed. It is also easy architecture.

But it creates a familiar kind of trap. If the app disappears, your data may disappear with it. If the app changes direction, your habits must change with it. If the company decides that the free version should now be worse, your work is inside the walls already. If another wizard builds a better tool, moving to it means migration, export, import, broken links, missing fields, lost history and the special sadness of a CSV file called `contacts-final-2.csv`.

The problem is not merely that companies are sometimes badly behaved. The deeper problem is that the boundary is in the wrong place.

The app has become the container for the user's life.

A wizard should flinch at that.

> **Interactive exhibit placeholder: `web-home-directory`**
>
> Show two models side by side. In the first, each app has its own identity and data store. Deleting or replacing an app traps or migrates the user's data. In the second, identity and data live in a user-controlled space, and apps connect to it with permissions. Let the reader replace a calendar app, notes app or contacts app and show what changes. The important visual should be the boundary: does the data belong to the app, or does the app visit the data?

## The old shape and the hidden shape

One way to describe the modern web is this:

```text id="app-owned-world"
application -> account -> data
```

The application is the starting point. You choose an app, create an account inside it, and then your data begins to accumulate there. The app is the room. Your data is the furniture.

There is another possible shape:

```text id="user-owned-world"
identity -> data -> applications
```

The user is the starting point. The data belongs near the user. Applications become tools that are allowed to read, write or change parts of that data.

That may look like a small rearrangement. It is not.

In the first shape, replacing software means moving your life from one castle to another. In the second shape, replacing software can be closer to changing tools on your workbench.

This does not make the problem easy. It may even make some parts harder. Permissions become more important. Shared vocabularies become more important. Data formats become more important. Applications can no longer quietly assume that their private database is the universe. They have to work with data that may have been written by someone else, using a tool they did not control.

But that is also the point.

Small, replaceable software requires a place where the important things are not owned by the software.

## A web with a home directory

There is a project called Solid that tries to explore this direction. I do not want to turn this chapter into a manual for it. The details matter, but the wizardly part is the change of shape.

Solid asks what would happen if identity and data were separated from applications. A person has an identity on the web. Their data can live in a place they control. Applications ask for access. The app is no longer automatically the place where the data lives.

This sounds almost too obvious, once said aloud. Of course your contacts should be yours. Of course your calendar should not belong to one calendar interface. Of course your notes should not become unreadable because a company pivoted, merged, shut down, rebranded, or discovered artificial intelligence in a board meeting.

And yet the obvious thing is not how most of the web works.

Because the current shape was easier to build.

Because users follow convenience.

Because developers follow the path with the fewest missing standards.

Because every app that becomes successful has an incentive to become a world.

This is where the earlier chapters start to matter. A URL is powerful because it lets worlds point at each other. HTML is powerful because it gives documents a shared shape, even though that shape has consequences. A small embedded language is powerful because it stays close to the host language instead of building a border too early. A reusable component is powerful because it has few assumptions and a clear boundary.

The personal web needs the same kind of thinking.

It is not enough to say that users should own their data. Ownership is an important word, but by itself it does not design an architecture. You need addresses. You need identity. You need permissions. You need shared meanings. You need ways for small applications to cooperate without becoming one large application.

You need boundaries that make replacement normal.

## Small tools, not kingdoms

If data and identity can outlive applications, software can become smaller.

A notes app does not have to become a complete platform for every thought you will ever have. It can be a good editor for notes. Another app can be a better viewer. Another can search them. Another can publish some of them. Another can connect them to a project. These tools can be small because none of them has to own the entire world in order to be useful.

This is the Lego castle trying to escape from the knitted castle again.

Of course, it will not escape completely. Real software always grows threads. Applications need assumptions. Data shapes drift. Permissions become complicated. People want convenience more than purity, and they are usually right to want that.

But the direction matters.

A private app castle asks: how can we keep the user inside?

A personal web asks: how can this tool remain useful after the user replaces it?

That is a very different question. It points to different designs. It rewards different behavior. It makes different futures possible.

And this is the theme that keeps returning throughout this book. The hard problem may not be the thing you first thought it was. Sometimes the hard problem is caused by the shape of the world around it. Change the shape, and the problem changes. Sometimes it shrinks. Sometimes it moves somewhere more honest. Sometimes it opens a door.

> **Wizard rule**
>
> Put the boundary where replacement should be cheap. If the user owns their identity and data, software can stay small enough to replace.
