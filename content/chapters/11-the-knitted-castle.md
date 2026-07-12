---
tags: programming for wizards
---

# The knitted castle

<!-- paragraph-id: p-11-why-is-it-so-difficult-to-make-reusable -->
Why is it so difficult to make reusable software?

<!-- paragraph-id: p-11-the-famous-wizard-alan-kay-once-said -->
The famous wizard [Alan Kay](https://en.wikipedia.org/wiki/Alan_Kay) once said:

<!-- aside-id: aside-11-whatever-we-in-computing-do-is-more-like -->
> "Whatever we [in computing] do is more like what the Egyptians did. Building pyramids, piling things on top of each other." [(video)](https://www.tele-task.de/lecture/video/2772/)

<!-- paragraph-id: p-11-i-think-the-situation-is-more-dire-than -->
I think the situation is more dire than that. We're not stacking bricks. We're knitting castles.

<!-- aside-id: aside-11-aside-ive-stolen-the-knitted-castle-example-from-rich -->
> *Aside:* I've stolen the knitted castle example from Rich Hickey. He uses the image in [Simple Made Easy](https://youtu.be/SxdOUGdseq4?t=1287), a talk every wizard should probably watch at least once. His point is that simplicity is not about looking small or familiar. It is about whether the parts are braided together.

<!-- paragraph-id: p-11-lets-take-a-step-back-first-go-back -->
Let's take a step back first. Go back to when you first discovered programming. I hope it isn't too hard to remember the heady first days, the unimaginable power you had to make a computer do your bidding, to create something entirely new.

<!-- paragraph-id: p-11-then-if-you-are-like-me-you-got -->
Then, if you are like me, you got serious about writing software, your darling program grew up and grew big. And adding new features, or debugging existing ones, grew more and more difficult. Your guesstimates grew more and more wildly off. Each new feature fighting with all the ones before it.

<!-- paragraph-id: p-11-you-cannot-win-the-problem-is-complexity-in -->
You cannot win. The problem is complexity. In software development, growing complexity appears to be as harsh a law as the [second law of thermodynamics.](https://en.wikipedia.org/wiki/Second_law_of_thermodynamics)

<!-- paragraph-id: p-11-most-software-projects-at-some-point-end-up -->
Most software projects at some point end up looking like this:

<!-- image-id: image-11-a-knitted-castle -->
![A knitted castle](../assets/images/knitted-castle.png)

<!-- paragraph-id: p-11-a-pyramid-is-at-least-made-of-separate -->
A pyramid is at least made of separate stones. They may be heavy, badly placed, and difficult to move, but you can still point at one and say: there, that is a stone.

<!-- paragraph-id: p-11-a-knitted-castle-is-different-every-part-is -->
A knitted castle is different. Every part is made out of the same thread as every other part. The wall continues into the tower. The tower continues into the flag. The flag continues into the dragon. Pull one loop too hard and the whole thing starts to change shape.

<!-- paragraph-id: p-11-this-is-funny-when-it-is-yarn -->
This is funny when it is yarn.

<!-- paragraph-id: p-11-it-is-less-funny-when-it-is-your -->
It is less funny when it is your application.

## The dream of Lego

<!-- paragraph-id: p-11-the-dream-is-obvious-we-want-software-pieces -->
The dream is obvious. We want software pieces that behave like Lego bricks.

<!-- paragraph-id: p-11-a-lego-brick-does-not-care-whether-it -->
A Lego brick does not care whether it is used in a castle, a spaceship, a bridge, or a thing a small child insists is definitely a horse. It has a few simple connection points. The measurements are strict. The studs are boring. The brick does not bring a castle architecture with it.

<!-- paragraph-id: p-11-that-boringness-is-part-of-the-magic -->
That boringness is part of the magic.

<!-- paragraph-id: p-11-a-lego-brick-is-reusable-because-it-makes -->
A Lego brick is reusable because it makes very few assumptions about the thing you are building. Most software components are not like that.

<!-- paragraph-id: p-11-most-software-components-are-more-like-a-beautifully -->
Most software components are more like a beautifully carved castle tower with a bit of wall still attached, some electrical wiring dangling from the bottom, and a note saying it works best when placed on the east side of a hill during a full moon.

<!-- paragraph-id: p-11-you-can-reuse-it-but-now-your-project -->
You can reuse it. But now your project must have the right hill.

## Every useful thing grows threads

<!-- paragraph-id: p-11-you-dont-end-up-with-a-mess-of -->
You don't end up with a mess of yarn because you set out to do so. You end up there because you just want to add a little feature here. Then another little fix there. A new component so your users can use dollars instead of euros. Your success means adding new language support. Oops, language and culture are not synonymous, so you add a patch.

<!-- paragraph-id: p-11-none-of-these-changes-are-absurd-that-is -->
None of these changes are absurd. That is the annoying part.

<!-- paragraph-id: p-11-a-knitted-castle-is-usually-not-built-by -->
A knitted castle is usually not built by foolish decisions. It is built by reasonable decisions made locally. Each decision adds another thread, ultimately binding everything into a single Gordian knot.

<!-- rule-id: rule-11-wizards-ninth-rule -->
> **Wizard's ninth rule**
>
> Assumptions are threads. Cut the threads.

## Packages are not the same as parts

<!-- paragraph-id: p-11-you-install-one-small-package-it-needs-a -->
You install one small package. It needs a framework plugin, a state library, a build step and three neighbouring packages. Nothing has gone wrong. This is simply what software reuse often looks like.

<!-- paragraph-id: p-11-javascript-has-one-of-the-largest-ecosystems-of -->
JavaScript has one of the largest ecosystems of reusable packages ever created. npm is both a miracle and a warning label.

<!-- paragraph-id: p-11-it-proves-that-reuse-is-possible-you-can -->
It proves that reuse is possible. You can install a parser, a date library, a test runner, a bundler, a color picker, a database client. Then you get several hundred things you did not know you needed for free because one of those packages needed them for you.

<!-- paragraph-id: p-11-but-a-package-is-not-automatically-a-lego -->
But a package is not automatically a Lego brick.

<!-- paragraph-id: p-11-a-package-is-a-unit-of-distribution-it -->
A package is a unit of distribution. It says: here is a thing you can download and import.

<!-- paragraph-id: p-11-that-is-not-the-same-as-saying-here -->
That is not the same as saying: here is a thing whose assumptions fit naturally into your problem.

<!-- paragraph-id: p-11-a-package-can-be-reusable-as-a-whole -->
A package can be reusable as a whole and still be impossible to take apart. You may like its parser but not its data model. You may like its renderer but not its lifecycle. You may like its widget but not its styling system. You may like its storage layer but not the framework it assumes around it.

<!-- paragraph-id: p-11-we-have-become-very-good-at-shipping-bundles -->
We have become very good at shipping bundles of software around the world. We are less good at making the insides of those bundles fit into other people's thoughts.

## Reuse has a direction

<!-- paragraph-id: p-11-one-reason-the-lego-dream-fails-is-that -->
One reason the Lego dream fails is that we talk about reuse as if all reuse were the same.

<!-- paragraph-id: p-11-it-is-not -->
It is not.

<!-- paragraph-id: p-11-a-pure-function-is-often-easy-to-reuse -->
A pure function is often easy to reuse because it asks for little. Give it input. Receive output. It does not need to know where the input came from or where the output will go.

<!-- paragraph-id: p-11-a-file-format-can-be-reusable-because-many -->
A file format can be reusable because many programs can agree on it without sharing the same code.

<!-- paragraph-id: p-11-a-protocol-can-be-reusable-because-different-systems -->
A protocol can be reusable because different systems can meet at a boundary and then go their separate ways again.

<!-- paragraph-id: p-11-a-ui-component-is-harder-it-often-wants -->
A UI component is harder. It often wants data, styling, events, state, and then some. You need to carefully carve a place for it in the surrounding application.

<!-- paragraph-id: p-11-an-application-feature-is-harder-still-a-shopping -->
An application feature is harder still. A shopping cart is not just a list of products. It touches pricing, stock, identity, sessions, shipping, tax, etc.

<!-- paragraph-id: p-11-so-lets-rephrase-the-question-the-useful-question -->
So let's rephrase the question. The useful question is not:

<!-- aside-id: aside-11-can-this-be-reused -->
> Can this be reused?

<!-- paragraph-id: p-11-the-useful-question-is -->
The useful question is:

<!-- aside-id: aside-11-in-what-direction-can-this-be-reused -->
> In what direction can this be reused?

<!-- paragraph-id: p-11-can-the-calculation-be-reused-without-the-ui -->
Can the calculation be reused without the UI? Can the data format be reused without the database? Can the protocol be reused without the server implementation? Can the visual component be reused without the application state?

<!-- paragraph-id: p-11-dont-ask-for-universal-reuse-that-is-how -->
Don't ask for universal reuse. That is how most reusability ideas become enormous.

<!-- paragraph-id: p-11-instead-look-for-the-boundary -->
Instead, look for the boundary.

## The boundary is the component

<!-- paragraph-id: p-11-this-is-the-part-that-is-easy-to -->
This is the part that is easy to miss.

<!-- paragraph-id: p-11-the-reusable-thing-is-not-only-the-code -->
The reusable thing is not only the code. It is the boundary around the code.

<!-- paragraph-id: p-11-the-boundary-is-where-the-bargain-is-made -->
The boundary is where the bargain is made. This data may cross. These names matter. This part stays hidden. This part is someone else's problem.

<!-- paragraph-id: p-11-a-bad-boundary-leaks-the-whole-world-a -->
A bad boundary leaks the whole world. A good boundary is boring in the right places.

<!-- paragraph-id: p-11-this-is-why-small-libraries-often-age-better -->
This is why small libraries often age better than clever frameworks. A small library can sometimes say: give me this value, I will give you that value. Or: call this function when this happens. Or: here is a plain data structure. Do with it what you want.

<!-- paragraph-id: p-11-a-framework-often-says-live-here -->
A framework often says: live here.

<!-- paragraph-id: p-11-this-is-also-why-standards-matter-a-standard -->
This is also why standards matter. A standard creates a boundary that does not belong to one package. HTML, URLs, [JSON](https://www.json.org/json-en.html), HTTP, SQL, [MIME types](https://www.iana.org/assignments/media-types/media-types.xhtml). None of these are perfect. But when enough systems agree on the boundary, reuse becomes less dependent on one implementation.

<!-- paragraph-id: p-11-the-web-itself-works-because-many-different-pieces -->
The Web itself works because many different pieces agree just enough to meet each other.

## Fighting for the Lego castle

<!-- paragraph-id: p-11-you-cannot-defeat-complexity-once-and-for-all -->
You cannot defeat complexity once and for all. That is the sort of promise that sells books, frameworks, and conference talks. The castle will always try to knit itself.

<!-- paragraph-id: p-11-but-you-can-fight -->
But you can fight.

<!-- paragraph-id: p-11-keep-asking-what-assumptions-each-part-carries-decide -->
Keep asking what assumptions each part carries. Decide which assumptions belong inside it, and which should stop at the boundary.

<!-- paragraph-id: p-11-keep-the-stable-rules-of-your-program-away -->
Keep the stable rules of your program away from browsers, databases, networks, and other things that change. Pass plain data across boundaries. Write small adapters at the edges, rather than teaching every part the dialect of every other part.

<!-- paragraph-id: p-11-make-the-boundaries-simple-enough-that-another-implementation -->
Make the boundaries simple enough that another implementation can cross them. A component should not need to know the history of the application it lives in. A library should not require you to adopt its entire view of the world.

<!-- paragraph-id: p-11-sometimes-a-small-language-helps-jaqt-gives-the -->
Sometimes a small language helps. JAQT gives the stable idea—the shape of a query—a place to live apart from the machinery around it. This does not always require a parser or a grand new abstraction. A shape in data, a few carefully chosen names, and a small agreement may be enough.

<!-- paragraph-id: p-11-also-accept-that-some-things-should-not-be -->
Also accept that some things should not be reusable. Software fitted closely to one situation may be valuable precisely because it is fitted. The mistake is not writing specific code. The mistake is hiding its assumptions and pretending it is a universal brick.

<!-- paragraph-id: p-11-the-lego-castle-is-not-built-from-magic -->
The Lego castle is not built from magic universal parts. It is built by choosing where the studs go, making those connections clear, and refusing to pull threads through them later.

<!-- paragraph-id: p-11-the-knitted-castle-is-always-waiting-every-useful -->
The knitted castle is always waiting. Every useful feature wants to add another loop. The wizard's work is not to prevent that. It is to decide which loops belong inside a part, and where the thread must stop.
