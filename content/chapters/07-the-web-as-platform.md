---
tags: programming for wizards
---

# The Web: waking up the words

<!-- paragraph-id: p-07-its-may-1995-youve-just-landed-a-dream -->
It's May 1995. You've just landed a dream job at the hot new startup of the decade: [Netscape](https://en.wikipedia.org/wiki/Netscape_Navigator). You want to impress. The gurus in charge ask you to add a programming language to the Web.

<!-- paragraph-id: p-07-you-have-10-days -->
You have 10 days.

<!-- paragraph-id: p-07-brendan-eich-was-the-wizard-who-made-javascript -->
[Brendan Eich](https://en.wikipedia.org/wiki/Brendan_Eich) was the wizard who made JavaScript under these conditions. Its creation story is almost mythical.

<!-- paragraph-id: p-07-before-javascript-if-you-wanted-to-create-an -->
Before JavaScript, the only way to make a website interactive was a form. A visitor filled it in and pressed submit. The browser sent the data to the web server, which called a program through the [CGI interface](https://en.wikipedia.org/wiki/Common_Gateway_Interface). The program did its magic and printed a response, and the server sent that back as a whole new page. Not very interactive at all.

<!-- paragraph-id: p-07-in-1995-netscape-was-king-of-the-webbrowser -->
In 1995 Netscape was king of the browser hill. [Internet Explorer 1.0](https://en.wikipedia.org/wiki/Internet_Explorer_1) would only appear in August of that year, and wouldn't seriously threaten Netscape until version 4, in 1997. Netscape had set its sights on making the web browser the next operating system. Instead of software shipped on floppy disks and CD-ROMs, they saw a future where software ran in the network, and all you needed was a connection and a browser. Netscape Navigator, of course.

<!-- paragraph-id: p-07-obviously-for-this-to-come-to-fruition-the -->
For that, the Web would need to be programmable. So Netscape set out a two-pronged strategy. Real™ programmers would use a Real™ programming language to write Real™ programs. The rest of us could glue these together in a scripting language. The Real™ programming language of choice, in 1995, was of course [Java](https://en.wikipedia.org/wiki/Java_%28programming_language%29)™. So the scripting language would have to look like Java.

<!-- paragraph-id: p-07-why-netscape-chose-java-isnt-hard-to-see -->
Why Java isn't hard to see. There were still many different computer architectures in use, and writing software that ran on all of them was hard. Java sidestepped that problem with the [JVM](https://en.wikipedia.org/wiki/Java_virtual_machine), the Java Virtual Machine, and promised: write once, run anywhere. For a company that wanted software to live in the network, that was exactly the right promise.

<!-- paragraph-id: p-07-enter-brendan-eich-as-he-later-described-it -->
Enter Brendan Eich. As he later described it:

<!-- aside-id: aside-07-at-least-client-engineering-management-including-tom-paquin -->
> "At least client engineering management including Tom Paquin, Michael Toy, and Rick Schell, along with some guy named Marc Andreessen, were convinced that Netscape should embed a programming language, in source form, in HTML." -- "What was needed was a convincing proof of concept, AKA a demo. That, I delivered, and in too-short order it was a fait accompli."

<!-- paragraph-id: p-07-that-prototype-became-the-programming-language-of-the -->
That prototype became the programming language of the Web.

<!-- rule-id: rule-07-wizards-sixth-rule -->
> **Wizard's sixth rule**
>
> Your spells may gain a life of their own.

<!-- paragraph-id: p-07-we-got-uncharacteristically-lucky-javascript-was-not-a -->
We got uncharacteristically lucky. JavaScript was not a watered-down, dummified version of Java. Brendan had been lured to Netscape with the promise that he could build a [Scheme](https://en.wikipedia.org/wiki/Scheme_%28programming_language%29)-like language.

<!-- paragraph-id: p-07-scheme-is-a-descendant-of-lisp-and-algol -->
Scheme is a descendant of Lisp (and Algol). It is nothing like Java. Like any Lisp, it is small, and it can be bent into almost any shape you need. So Brendan put a Java-like syntax on a Scheme-like core. Ten days later, the world had a new language, and nobody knew yet how much it would matter.

<!-- aside-id: aside-07-brendan-eich-im-not-proud-but-im-happy -->
> [Brendan Eich](https://web.archive.org/web/20200204010840/https://brendaneich.com/2008/04/popularity/) - "I’m not proud, but I’m happy that I chose Scheme-ish first-class functions and Self-ish (albeit singular) prototypes as the main ingredients. The Java influences, especially y2k Date bugs but also the primitive vs. object distinction (e.g., string vs. String), were unfortunate."

<!-- paragraph-id: p-07-like-any-prototype-that-is-pushed-into-production -->
Like any prototype pushed into production too soon, JavaScript has its problems. But its roots in Scheme and [Self](https://en.wikipedia.org/wiki/Self_%28programming_language%29), themselves descendants of Lisp and [Smalltalk](https://en.wikipedia.org/wiki/Smalltalk), gave it a much healthier base than we could have hoped for.

<!-- paragraph-id: p-07-in-2008-javascript-got-some-positive-publicity-with -->
In 2008 JavaScript finally got some good press, in the form of a book by the wizard Douglas Crockford: [*JavaScript: The Good Parts*](https://www.goodreads.com/book/show/2998152-javascript). Read it, and you'll find that most of the good parts came from Scheme and Self.

## Toil and trouble

<!-- paragraph-id: p-07-today-it-is-hard-not-to-associate-the -->
Today it is hard not to associate JavaScript with the DOM, the Document Object Model we met in the previous chapter. That is not fair to JavaScript. [The DOM may be the worst API ever invented](https://www.youtube.com/watch?v=Y2Y0U-2qJMs). It was so bad that there came to be not one, not a few, but countless DOM wrapper libraries. I wrote my own, as did many web developers of the era. In the end there was a clear winner, [jQuery](https://jquery.com/), which was then folded back into the browser in a weirdly distorted way. `$(".class")` became `document.querySelectorAll(".class")` because long names are the hallmark of committee standards.

<!-- paragraph-id: p-07-but-the-dom-is-still-considered-a-compilation -->
Even so, the DOM is mostly treated as a compilation target: not something you program directly, unless you enjoy pain. Instead you use [React](https://react.dev/), [Vue](https://vuejs.org/), [Angular](https://angular.dev/), [Svelte](https://svelte.dev/), [Ember](https://emberjs.com/)...

<!-- paragraph-id: p-07-even-javascript-itself-has-become-something-you-often -->
Even JavaScript itself is often processed before the browser sees it. For years that meant [npm](https://www.npmjs.com/), bundlers, transpilers and configuration files. [Babel](https://babeljs.io/) compiled JavaScript into JavaScript.

<!-- paragraph-id: p-07-bundled-minified-obfuscated-unreadable -->
The result: bundled, minified, obfuscated and unreadable JavaScript.

<!-- paragraph-id: p-07-all-this-stuff-makes-web-development-so-much -->
All this makes web development much harder than it needs to be. It is the real fallout from rushing JavaScript into production in 1995. The language was so incomplete that wizards all over the world invented their own additions.

<!-- paragraph-id: p-07-a-simple-example-is-the-javascript-module-system -->
Take modules. For the longest time, JavaScript had none. In the browser you could fake them with a pile of HTML script tags, working around the language rather than in it. Or you could use a bundler to glue all the code into a single file. So we ended up with several module formats and several bundlers, each with its own configuration.

<!-- paragraph-id: p-07-and-even-though-there-now-is-a-clear -->
There is a standard module system now. But much of what we install from npm still uses the older format designed for [Node](https://nodejs.org/), JavaScript on the server.

## The browser-shaped computer

<!-- paragraph-id: p-07-netscapes-dream-did-not-quite-happen-in-the -->
Netscape's dream did not happen quite the way Netscape imagined. We did not all simply stop using operating systems and live inside Navigator.

<!-- paragraph-id: p-07-a-lot-of-what-people-now-call-using -->
Yet a lot of what people now call "using the computer" is really using the browser. Mail, documents, calendars, maps, banking... I could go on. The local machine is still there, but it matters less and less. It has become an interface--a keyboard, mouse and screen that give you access to your work instead of holding it.

<!-- paragraph-id: p-07-chromeos-makes-that-idea-unusually-explicit-it-is -->
[ChromeOS](https://chromeos.google/) makes that idea unusually explicit. It is an operating system built around the assumption that the web is not just one application among many. The web is the main place where things happen.

<!-- paragraph-id: p-07-electron-approaches-the-same-idea-from-the-other -->
[Electron](https://electronjs.org/docs/latest) approaches the same idea from the other direction. If people still expect desktop applications, fine. Put a browser-shaped runtime inside the application and let web technologies pretend to be native software. This is a ridiculous thing to do, and also a very successful one. Not an unusual combination in software history.

<!-- paragraph-id: p-07-progressive-web-apps-sit-somewhere-in-the-middle -->
[Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) sit somewhere in the middle. They try to let web applications behave a bit more like installed software, with icons, offline behavior and notifications, without fully leaving the web behind.

<!-- paragraph-id: p-07-none-of-these-has-replaced-the-operating-system -->
None of these has replaced the operating system. We still live in an Apple and Windows world, with a sprinkling of Linux in between. But more and more of what an operating system used to do is moving to the Web. Not always in the way we'd like.

<!-- paragraph-id: p-07-netscape-wanted-the-browser-to-become-the-operating -->
Netscape wanted the browser to become the operating system, and in many ways it did. The network is becoming the OS. The question is whether this new OS serves you, or someone else.