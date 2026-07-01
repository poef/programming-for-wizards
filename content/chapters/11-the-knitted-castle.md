---
tags: programming for wizards
---

# The knitted castle

Why is it so difficult to make reusable software?

This is one of those questions that keeps returning, dressed in new clothes. [Objects](https://en.wikipedia.org/wiki/Object-oriented_programming) would do it. [Components](https://en.wikipedia.org/wiki/Component-based_software_engineering) would do it. [Packages](https://en.wikipedia.org/wiki/Software_package) would do it. [Services](https://en.wikipedia.org/wiki/Service-oriented_architecture) would do it. [Web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) would do it. Frameworks would do it. Some new build system, package manager, module format, runtime or architectural style would finally let us write a piece of software once and use it everywhere.

And then, a few years later, we discover that we have not built a Lego castle after all.

We have knitted another one.

> **Interactive exhibit placeholder: `knitted-castle-vs-lego-castle`**
>
> Begin with five clean modules. Let the reader add features one by one. Each feature creates dependency threads: data shape, styling, lifecycle, configuration, events, permissions, errors, storage, network calls. Then let the reader try to reuse one piece in a different project. Show how many invisible threads come along. Finally introduce clearer boundaries: explicit inputs, boring data, adapters, stable protocols, and a core that knows less about its surroundings.

The famous wizard [Alan Kay](https://en.wikipedia.org/wiki/Alan_Kay) once said:

> "Whatever we [in computing] do is more like what the Egyptians did. Building pyramids, piling things on top of each other." [(video)](https://www.tele-task.de/lecture/video/2772/)

I think the situation is more dire than that. We're not stacking bricks. [We're knitting castles](https://youtu.be/SxdOUGdseq4?t=1287).

A pyramid is at least made of separate stones. They may be heavy, badly placed, and difficult to move, but you can still point at one and say: there, that is a stone.

A knitted castle is different. Every part is made out of the same thread as every other part. The wall continues into the tower. The tower continues into the flag. The flag continues into the dragon. Pull one loop too hard and the whole thing starts to change shape.

This is funny when it is yarn.

It is less funny when it is your application.

## The dream of Lego

The dream is obvious. We want software pieces that behave like Lego bricks.

A Lego brick does not care whether it is used in a castle, a spaceship, a bridge, or a thing a small child insists is definitely a horse. It has a few simple connection points. The measurements are strict. The studs are boring. The brick does not bring a castle architecture with it.

That boringness is part of the magic.

A Lego brick is reusable because it makes very few assumptions about the thing you are building. It does not decide the color scheme of the castle. It does not come with a preferred story about who lives there. It does not require the dragon package, the royal-taxation package and a particular version of the drawbridge runtime.

Most software components are not like that.

Most software components are more like a beautifully carved castle tower with a bit of wall still attached, some electrical wiring dangling from the bottom, and a note saying it works best when placed on the east side of a hill during a full moon.

You can reuse it. But now your project must have the right hill.

## Every useful thing grows threads

When you first write a piece of software, it often starts clean. A function receives values and returns a value. A component receives some data and renders something. A module has a small job.

Then the real world arrives.

The function needs configuration. The component needs styling. The module needs logging. The user must be allowed to cancel. The network might fail. The data is not quite the shape you expected. The application has two kinds of users. Then three. Then there is a feature flag. Then there is an experiment. Then one customer needs a slightly different rule because their workflow is special, and unfortunately they pay the bills.

None of these changes are absurd. That is the annoying part.

A knitted castle is usually not built by foolish decisions. It is built by reasonable decisions made locally.

One thread for the user. One thread for the database. One thread for the framework. One thread for the CSS. One thread for authentication. One thread for analytics. One thread for errors. One thread for backwards compatibility. One thread because Friday afternoon was not the right time to redesign the boundary.

After a while, the component no longer has a simple shape. It has a climate.

To reuse it, you do not only need the component. You need the weather system it expects to live in.

## Packages are not the same as parts

JavaScript has one of the largest ecosystems of reusable packages ever created. NPM is both a miracle and a warning label.

It proves that reuse is possible. You can install a parser, a date library, a test runner, a renderer, a bundler, a color picker, a database client, a state manager, a tiny function that tells you whether a number is odd, and several hundred things you did not know you needed because one of those packages needed them for you.

But a package is not automatically a Lego brick.

A package is a unit of distribution. It says: here is a thing you can download and import.

That is not the same as saying: here is a thing whose assumptions fit naturally into your problem.

A package can be reusable as a whole and still be impossible to take apart. You may like its parser but not its data model. You may like its renderer but not its lifecycle. You may like its widget but not its styling system. You may like its storage layer but not the framework it assumes around it.

This is where much of the promise quietly leaks away. We have become very good at shipping bundles of software around the world. We are less good at making the insides of those bundles fit into other people's thoughts.

The piece crosses the network easily. The idea does not always cross the boundary.

## Reuse has a direction

One reason the Lego dream fails is that we talk about reuse as if all reuse were the same.

It is not.

A pure function is often easy to reuse because it asks for little. Give it input. Receive output. It does not need to know where the input came from or where the output will go.

A file format can be reusable because many programs can agree on it without sharing the same code.

A protocol can be reusable because different systems can meet at a boundary and then go their separate ways again.

A UI component is harder. It often wants data, styling, events, state, focus rules, accessibility behavior, theme decisions, lifecycle hooks, translations, permissions, and a place in the surrounding application.

An application feature is harder still. A shopping cart is not just a list of products. It touches pricing, stock, identity, sessions, shipping, tax, discounts, payments, errors, emails, fraud, analytics, legal requirements and customer support.

At some point you are no longer reusing a part. You are importing a small civilization.

This does not mean reuse is hopeless. It means the useful question is not:

> Can this be reused?

The useful question is:

> In what direction can this be reused?

Can the calculation be reused without the UI? Can the data format be reused without the database? Can the protocol be reused without the server implementation? Can the visual component be reused without the application state? Can the core rule be reused if we wrap it in a different shell?

A wizard does not ask for universal reuse first. Universal reuse is where many good designs go to become enormous.

A wizard looks for the boundary.

## The boundary is the component

This is the part that is easy to miss.

The reusable thing is not only the code. It is the boundary around the code.

The boundary says what must be known from the outside and what may remain hidden inside. It says which data crosses it. It says which names matter. It says when things happen. It says who is allowed to call whom. It says what happens when something goes wrong.

A bad boundary leaks the whole world.

A good boundary is boring in the right places.

This is why small libraries often age better than clever frameworks. A small library can sometimes say: give me this value, I will give you that value. Or: call this function when this happens. Or: here is a plain data structure. Do with it what you want.

A framework often says: live here.

Living somewhere can be pleasant. A framework can give you roads, plumbing, electricity, building codes, a market square and a school. But moving one house from that town to another town is not the same as moving a Lego brick.

This is also why standards matter. A standard creates a boundary that does not belong to one package. HTML, URLs, [JSON](https://www.json.org/json-en.html), HTTP, [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors), the DOM, SQL, [POSIX paths](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap03.html#tag_03_271), [MIME types](https://www.iana.org/assignments/media-types/media-types.xhtml). None of these are perfect. Some of them are full of ghosts. But when enough systems agree on the boundary, reuse becomes less dependent on one implementation.

The Web itself works because many different pieces agree just enough to meet each other.

## Fighting for the Lego castle

So what can you do?

You cannot defeat complexity once and for all. That is the sort of promise that sells books, frameworks and conference talks. The castle will always try to knit itself.

But you can fight.

You can keep asking what assumptions a piece is carrying. You can make dependencies explicit instead of letting them seep in through globals, singletons and secret imports. You can keep the stable rules of a system away from the parts that talk to browsers, databases, networks and users. You can pass plain data across boundaries. You can write adapters at the edge instead of making every part know every other part's dialect.

You can make small languages for the stable parts of the problem, as we did with JAQT. Not always new languages with parsers. Sometimes just a shape in data, a few names, a convention that lets the important idea stand apart from the machinery.

You can resist the urge to make every component helpful in advance. Helpfulness is where assumptions breed. A component that does less may travel further.

You can also accept that some things should not be reusable. A piece of software that is deeply fitted to one situation may be valuable precisely because it is fitted. The mistake is not writing such code. The mistake is pretending it is a brick.

The Lego castle is not built by magic universal parts. It is built by choosing where the studs go, and then having the discipline not to put threads through them later.

The knitted castle is always waiting. Every feature wants to tie one more loop. The wizard's work is not to avoid all loops. That would make software useless. The work is to keep asking which loops belong inside a part, and which ones should become a boundary.

> **Wizard's tenth rule**
>
> A reusable component is not a piece with many uses. It is a piece with few assumptions and a clear boundary.
