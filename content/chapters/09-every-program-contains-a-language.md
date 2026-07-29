---
tags: programming for wizards
---

# Separated by a Common Language

<!-- paragraph-id: p-09-react-is-at-the-time-of-writing-the -->
React is, at the time of writing, the dominant JavaScript library for building user interfaces. As a web developer, you cannot escape it. There are countless projects that provide something “for React.” A routing library for React, an object store for React, a datagrid for React. You name it, someone has made a React version.

<!-- paragraph-id: p-09-react-has-become-so-ubiquitous-that-companies-no -->
React has become so ubiquitous that companies no longer search only for web developers or JavaScript developers. They search for React developers. There are blogs, forums, conferences, and symposia for React developers.

<!-- paragraph-id: p-09-that-is-not-an-accident -->
That is not an accident.

<!-- paragraph-id: p-09-react-and-its-constellation-of-supporting-tools-and -->
React and its constellation of supporting tools and libraries have become their own thing. A React developer expects a certain way of looking at and solving problems. Traditional, or “vanilla,” JavaScript libraries often do not fit comfortably into that worldview. React has created its own vocabulary, rules, idioms, and community.

<!-- paragraph-id: p-09-react-is-effectively-a-dialect-inside-javascript-the -->
React is effectively a dialect inside JavaScript. The syntax still belongs to JavaScript. Much of the meaning belongs to React.

<!-- paragraph-id: p-09-react-is-one-example-of-a-library-framework -->
React is one example of a library, framework, or tool written in a language in such a way that it changes what the language is capable of: which things are easy to express, and which ideas come naturally to the programmer. It has changed the language spoken by the people who use it.

<!-- paragraph-id: p-09-but-this-is-not-limited-to-react-or -->
But this is not limited to React or even JavaScript. Lisp is the quintessential example. There is no language that can be extended, bent around and generally abused to quite the same extent. You can create any language you like within and around Lisp. 

<!-- paragraph-id: p-09-and-people-have-done-so -->
And people have done so. 

<!-- paragraph-id: p-09-oh-boy-have-they-done-so -->
Oh boy, have they done so.

## A language of your own

<!-- paragraph-id: p-09-heres-the-problem-lisp-is-one-of-the -->
Here's the problem: Lisp is one of the most expressive languages ever made. Almost anything invented in programming-language theory can be expressed in Lisp, often tersely. So why isn't Lisp as popular as React, or JavaScript for that matter?

<!-- aside-id: aside-09-aside-ive-mentioned-that-javascript-was-inspired-by -->
> **Aside:** I've mentioned that JavaScript was inspired by Scheme. Scheme is a dialect of Lisp, so, by a sufficiently irresponsible reading of its family tree, JavaScript is a kind of Lisp. Technically. I don't think any Real Lisp Programmer will thank me for pointing this out, but I find it wonderfully incongruous.

<!-- paragraph-id: p-09-richard-gabriel-and-guy-steele-wrote-about-lisps -->
Richard Gabriel and Guy Steele wrote about Lisp’s tendency to split into separate worlds in their rather long 1993 article [The Evolution of Lisp](https://www.dreamsongs.com/Files/HOPL2-Uncut.pdf). In section 5, "Why Lisp is Diverse", they observe:

<!-- aside-id: aside-09-it-would-seem-that-almost-every-little-research -->
> It would seem that almost every little research group has its own version of Lisp.

<!-- paragraph-id: p-09-this-proliferation-eventually-led-to-common-lisp-an -->
This proliferation eventually led to Common Lisp: an attempt to bring several diverging branches of the Lisp family back into one common language.

<!-- paragraph-id: p-09-but-the-issue-was-inherent-in-lisp-no -->
But the issue was inherent in Lisp, no matter the version. Any developer could extend Lisp itself, from within Lisp. The new additions could look and behave as though they had always been a part of it.

<!-- paragraph-id: p-09-why-would-you-not-do-that -->
Why would you not do that?

<!-- paragraph-id: p-09-a-famous-example-is-viaweb-one-of-the -->
A famous example is Viaweb, one of the earliest web applications. Its founder, Paul Graham, wrote extensively about the advantages Lisp gave the company. Viaweb's small team could build features faster than their competitors. Lisp was their secret weapon.

<!-- paragraph-id: p-09-so-whats-the-problem-again-if-growing-your -->
So what's the problem again? If growing your own language leads to this kind of success, why not grow as much of it as possible?

<!-- paragraph-id: p-09-because-the-advantage-is-local -->
Because the advantage is local.

<!-- paragraph-id: p-09-every-new-word-in-your-language-makes-the -->
Every new word in your language makes the people inside the system more fluent, more able to express themselves. It also gives everyone outside it one more word to learn. Each step makes the language better fitted to your company, your problem, your world. It also makes it less familiar to everyone else.

## The vanilla paradox

<!-- paragraph-id: p-09-theres-a-recurring-movement-against-large-frameworks-like -->
There's a recurring movement against large frameworks, like React. The idea is to return to a more standard, more 'vanilla' JavaScript. You can find numerous examples of software libraries proclaiming to be using Vanilla JavaScript. Some joker even wrote a homepage for the ['Vanilla JS' framework](https://vanilla.js.org/). Its main claim to fame is that it has the smallest code size of any framework: 0 bytes. 

<!-- paragraph-id: p-09-i-admire-the-sentiment-but-unfortunately-cannot-consider -->
I admire the sentiment, but unfortunately cannot consider myself a convert. I too think that the large frameworks tend to overcomplicate web development. More worryingly, they can cause mental overload by trying to become all-encompassing Swiss Army chainsaws.

<!-- paragraph-id: p-09-but-theres-no-such-thing-as-a-vanilla -->
But there's no such thing as a Vanilla JavaScript application. Not for long. And the same goes for PHP, C, Rust and certainly Lisp.

<!-- paragraph-id: p-09-weve-already-discussed-the-reason-its-not-only -->
We've already discussed the reason. It's not only Lisp that allows a developer to grow the language. 

<!-- paragraph-id: p-09-it-is-universal -->
It is universal.

<!-- paragraph-id: p-09-in-the-previous-chapter-i-showed-that-programming -->
In the previous chapter, I showed that programming languages make some thoughts easier to express than others. Different operations can become cheap.

<!-- paragraph-id: p-09-lisp-makes-it-easy-to-build-that-power -->
Lisp makes it easy to build that power into the language itself. But it is not limited to Lisp. Every language has that power. Usually, we call it functions, classes, interfaces, variables or properties. Each of these adds a word to the language. As programmers, we strive to make those words count, to make the program easier to think about and reason about.

<!-- paragraph-id: p-09-this-is-not-an-accident-this-is-the -->
This is not an accident. This is the point.

<!-- paragraph-id: p-09-each-program-extends-its-host-language-the-syntax -->
Each program extends its host language. The syntax doesn't change, but increasingly the program supplies the meaning.

<!-- paragraph-id: p-09-vanilla-software-does-not-remain-vanilla-for-long -->
Vanilla software does not remain vanilla for long. 

<!-- paragraph-id: p-09-nor-should-it -->
Nor should it.

## Muddying the waters

<!-- paragraph-id: p-09-in-1991-i-moved-to-the-university-of -->
In 1991, as a student, I was introduced to the wonder of MUDs: Multi-User Dungeons. 

<!-- paragraph-id: p-09-our-local-instance-and-the-cause-of-much -->
Our local MUD, the cause of much sleep deprivation and many missed lectures, was called *Underworld*. It was built in LPMud. It was my first encounter with a reasonably large and complex piece of software--at least from the inside.

<!-- paragraph-id: p-09-i-have-to-explain-that-last-sentence-a -->
I have to explain that last sentence a little. I mean 'inside' fairly literally. You didn't just look at a codebase and edit some files. You were a wizard, and you walked through the codebase. Each room was a separate file. You could stand inside that room and edit it while you were there. 

<!-- paragraph-id: p-09-lpmud-not-only-had-rooms-you-were-a -->
LPMud not only had 'rooms'. You were a 'player', and creatures that roamed the world were 'monsters'. The system had a 'heartbeat' that made everything move. The language it used in the code was the language of its world. It was quirky and poetic. 

<!-- paragraph-id: p-09-and-it-fit -->
And it fit.

<!-- paragraph-id: p-09-lpmud-is-still-around-there-are-still-wizards -->
LPMud is still around. There are still wizards writing inside its code, its world. Unfortunately, few other software systems have gone this far in inhabiting their own code—to make the language truly fit the domain.

## A pattern emerges

<!-- paragraph-id: p-09-domain-driven-design-attempts-to-make-developers-more -->
Domain-Driven Design attempts to make developers more conscious of this. It tells them to learn the ubiquitous language of a domain, and to use that as the language of the program.

<!-- paragraph-id: p-09-design-patterns-take-a-different-route-they-teach -->
Design patterns take a different route. They teach developers to use common patterns, and common words, across different programs written in different languages. They make it easier for developers to cross the border and inhabit a new world, because its language is already familiar from the old one.

<!-- paragraph-id: p-09-i-cannot-disagree-that-they-succeed-in-their -->
I cannot disagree that they succeed in their stated aims. But the price is that the language may fit the programmers better than it fits the problem.

<!-- paragraph-id: p-09-so-far-ive-hopefully-shown-that-programs-extend -->
So far I've hopefully shown that programs extend their host language. They create their own dialect. You can choose that dialect, if you're careful. But when it isn't a conscious choice, the dialect may become unwieldy. It may become difficult to think new thoughts or to extend the program. Programmers call this technical debt. 

<!-- paragraph-id: p-09-i-grew-up-in-a-christian-household-i -->
I think it's more like the curse of Babel.

<!-- paragraph-id: p-09-domain-driven-design-seems-to-offer-a-way -->
Domain-Driven Design seems to offer a way through: listen to the language of the problem domain and mirror it in the code. I think that is wise. But what is that language? Where does it start, and where does it end?

<!-- paragraph-id: p-09-software-development-becomes-partly-a-matter-of-becoming -->
Software development becomes partly a matter of becoming one with your world, your domain. It's almost holistic. Not something a book can teach you, certainly not one for dummies. 

<!-- paragraph-id: p-09-more-something-for-wizards -->
More something for wizards.

<!-- paragraph-id: p-09-all-choices-have-trade-offs-the-language-that -->
All choices have trade-offs. The language that allows you to work quickly now may slow down the next person who has to learn it. And a language shared by everyone may be easier to enter, but less able to express this particular world.

<!-- rule-id: rule-09-wizards-eighth-rule -->
> **Wizard's eighth rule**
>
> Mind your language.

<!-- paragraph-id: p-09-im-sorry-that-i-cannot-give-you-easy -->
I'm sorry that I cannot give you easy advice to follow. And what's worse, the curse of Babel isn't limited to your code. 

<!-- paragraph-id: p-09-its-in-your-data-as-well -->
It's in your data as well.

<!-- paragraph-id: p-09-code-can-be-replaced-data-has-a-habit -->
Code can be replaced. Data has a habit of surviving.
