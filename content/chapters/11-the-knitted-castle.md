---
tags: programming for wizards
---

# The knitted castle

Why is it so difficult to make reusable software?

The famous wizard [Alan Kay](https://en.wikipedia.org/wiki/Alan_Kay) once said:

> "Whatever we [in computing] do is more like what the Egyptians did. Building pyramids, piling things on top of each other." [(video)](https://www.tele-task.de/lecture/video/2772/)

I think the situation is more dire than that. We're not stacking bricks. We're knitting castles.

> *Aside:* I've stolen the knitted castle example from Rich Hickey. He uses the image in [Simple Made Easy](https://youtu.be/SxdOUGdseq4?t=1287), a talk every wizard should probably watch at least once. His point is that simplicity is not about looking small or familiar. It is about whether the parts are braided together.

Let's take a step back first. Go back to when you first discovered programming. I hope it isn't too hard to remember the heady first days, the unimaginable power you had to make a computer do your bidding, to create something entirely new.

Then, if you are like me, you got serious about writing software, your darling program grew up and grew big. And adding new features, or debugging existing ones, grew more and more difficult. Your guesstimates grew more and more wildly off. Each new feature fighting with all the ones before it.

You cannot win. The problem is complexity. In software development, growing complexity appears to be as harsh a law as the [second law of thermodynamics.](https://en.wikipedia.org/wiki/Second_law_of_thermodynamics)

Most software projects at some point end up looking like this:

![A knitted castle](../assets/images/knitted-castle.png)

A pyramid is at least made of separate stones. They may be heavy, badly placed, and difficult to move, but you can still point at one and say: there, that is a stone.

A knitted castle is different. Every part is made out of the same thread as every other part. The wall continues into the tower. The tower continues into the flag. The flag continues into the dragon. Pull one loop too hard and the whole thing starts to change shape.

This is funny when it is yarn.

It is less funny when it is your application.

## The dream of Lego

The dream is obvious. We want software pieces that behave like Lego bricks.

A Lego brick does not care whether it is used in a castle, a spaceship, a bridge, or a thing a small child insists is definitely a horse. It has a few simple connection points. The measurements are strict. The studs are boring. The brick does not bring a castle architecture with it.

That boringness is part of the magic.

A Lego brick is reusable because it makes very few assumptions about the thing you are building. Most software components are not like that.

Most software components are more like a beautifully carved castle tower with a bit of wall still attached, some electrical wiring dangling from the bottom, and a note saying it works best when placed on the east side of a hill during a full moon.

You can reuse it. But now your project must have the right hill.

## Every useful thing grows threads

You don't end up with a mess of yarn because you set out to do so. You end up there because you just want to add a little feature here. Then another little fix there. A new component so your users can use dollars instead of euros. Your success means adding new language support. Oops, language and culture are not synonymous, so you add a patch.

None of these changes are absurd. That is the annoying part.

A knitted castle is usually not built by foolish decisions. It is built by reasonable decisions made locally. Each decision adds another thread, ultimately binding everything into a single Gordian knot.

> **Wizard's ninth rule**
>
> Assumptions are threads. Cut the threads.

## Packages are not the same as parts

You install one small package. It needs a framework plugin, a state library, a build step and three neighbouring packages. Nothing has gone wrong. This is simply what software reuse often looks like.

JavaScript has one of the largest ecosystems of reusable packages ever created. npm is both a miracle and a warning label.

It proves that reuse is possible. You can install a parser, a date library, a test runner, a bundler, a color picker, a database client. Then you get several hundred things you did not know you needed for free because one of those packages needed them for you.

But a package is not automatically a Lego brick.

A package is a unit of distribution. It says: here is a thing you can download and import.

That is not the same as saying: here is a thing whose assumptions fit naturally into your problem.

A package can be reusable as a whole and still be impossible to take apart. You may like its parser but not its data model. You may like its renderer but not its lifecycle. You may like its widget but not its styling system. You may like its storage layer but not the framework it assumes around it.

We have become very good at shipping bundles of software around the world. We are less good at making the insides of those bundles fit into other people's thoughts.

## Reuse has a direction

One reason the Lego dream fails is that we talk about reuse as if all reuse were the same.

It is not.

A pure function is often easy to reuse because it asks for little. Give it input. Receive output. It does not need to know where the input came from or where the output will go.

A file format can be reusable because many programs can agree on it without sharing the same code.

A protocol can be reusable because different systems can meet at a boundary and then go their separate ways again.

A UI component is harder. It often wants data, styling, events, state, and then some. You need to carefully carve a place for it in the surrounding application.

An application feature is harder still. A shopping cart is not just a list of products. It touches pricing, stock, identity, sessions, shipping, tax, etc.

So let's rephrase the question. The useful question is not:

> Can this be reused?

The useful question is:

> In what direction can this be reused?

Can the calculation be reused without the UI? Can the data format be reused without the database? Can the protocol be reused without the server implementation? Can the visual component be reused without the application state?

Don't ask for universal reuse. That is how most reusability ideas become enormous.

Instead, look for the boundary.

## The boundary is the component

This is the part that is easy to miss.

The reusable thing is not only the code. It is the boundary around the code.

The boundary is where the bargain is made. This data may cross. These names matter. This part stays hidden. This part is someone else's problem.

A bad boundary leaks the whole world. A good boundary is boring in the right places.

This is why small libraries often age better than clever frameworks. A small library can sometimes say: give me this value, I will give you that value. Or: call this function when this happens. Or: here is a plain data structure. Do with it what you want.

A framework often says: live here.

This is also why standards matter. A standard creates a boundary that does not belong to one package. HTML, URLs, [JSON](https://www.json.org/json-en.html), HTTP, SQL, [MIME types](https://www.iana.org/assignments/media-types/media-types.xhtml). None of these are perfect. But when enough systems agree on the boundary, reuse becomes less dependent on one implementation.

The Web itself works because many different pieces agree just enough to meet each other.

## Fighting for the Lego castle

You cannot defeat complexity once and for all. That is the sort of promise that sells books, frameworks, and conference talks. The castle will always try to knit itself.

But you can fight.

Keep asking what assumptions each part carries. Decide which assumptions belong inside it, and which should stop at the boundary.

Keep the stable rules of your program away from browsers, databases, networks, and other things that change. Pass plain data across boundaries. Write small adapters at the edges, rather than teaching every part the dialect of every other part.

Make the boundaries simple enough that another implementation can cross them. A component should not need to know the history of the application it lives in. A library should not require you to adopt its entire view of the world.

Sometimes a small language helps. JAQT gives the stable idea—the shape of a query—a place to live apart from the machinery around it. This does not always require a parser or a grand new abstraction. A shape in data, a few carefully chosen names, and a small agreement may be enough.

Also accept that some things should not be reusable. Software fitted closely to one situation may be valuable precisely because it is fitted. The mistake is not writing specific code. The mistake is hiding its assumptions and pretending it is a universal brick.

The Lego castle is not built from magic universal parts. It is built by choosing where the studs go, making those connections clear, and refusing to pull threads through them later.

The knitted castle is always waiting. Every useful feature wants to add another loop. The wizard's work is not to prevent that. It is to decide which loops belong inside a part, and where the thread must stop.