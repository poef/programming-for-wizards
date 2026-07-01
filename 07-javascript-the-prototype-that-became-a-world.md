---
tags: programming for wizards
---

# JavaScript: the prototype that became a world

What happens when a prototype becomes the platform?

This chapter is about JavaScript, but it is also about a familiar software story. A demo is created in a hurry. It works well enough. Then the world starts building on it. The demo becomes the foundation. The foundation keeps moving.

That is both terrifying and, sometimes, lucky.

> **Interactive exhibit placeholder: `prototype-becomes-platform`**
>
> Show a tiny prototype language with three features. Then let the reader add real-world demands: modules, DOM access, packages, async loading, backwards compatibility. Each new demand should add visible layers around the original core. The point is that platforms accrete history.

The logical next part of the web to discuss, would be HTTP. However I don't think it would add much, or be interesting. So instead this chapter I will write about another part of the web, made by a wizard called Brendan Eich: JavaScript.

## JavaScript

Lets go back a little bit, before may 1995. You are a young developer tasked with creating an interactive experience on this new fangled World-Wide Web. How would you do that?

The only way would be to add a form. A visitor of your website would fill it in, then press submit. The form data is sent to the webserver, where a program is called through the [cgi-bin API](https://en.wikipedia.org/wiki/Common_Gateway_Interface). This program reads the form data and does its magic, then prints a response. The webserver reads the response and sends it back to the webbrowser. Not very interactive at all.

In 1995 Netscape was king of the webbrowser hill. Microsoft Internet Explorer 1.0 would be released in august 1995, and not get any real traction untill version 4, in 1997. Netscape had set their sights on making the web, and the web browser, the next operating system. Instead of creating executables and distributing these on media like floppy disks or cd-roms, they saw a future where software would be running in the network and all you needed was a connection and a browser, the Netscape Navigator ofcourse.

Obviously for this to come to fruition, the web would need to be more interactive, more programmable. So Netscape set out a two-pronged strategy. Real(tm) programmers would use a Real(tm) programming language to write Real(tm) programs. Then the rest of us could glue these together in a scripting language. The Real(tm) programming language of choice, in 1995, was ofcourse Java(tm). So the scripting language would need to mimic the Java syntax.

Why Netscape chose Java isn't hard to see. At the time there will still many different computer architectures in use. Writing software that would run on all those systems was hard. Java side-stepped that entire problem with the innovative JVM (Java Virtual Machine.) Using anything other than Java would make the whole task almost impossible to achieve.

Enter Brendan Eich -- "At least client engineering management including Tom Paquin, Michael Toy, and Rick Schell, along with some guy named Marc Andreessen, were convinced that Netscape should embed a programming language, in source form, in HTML." -- "What was needed was a convincing proof of concept, AKA a demo. That, I delivered, and in too-short order it was a fait accompli."

How short order? How about 10 days (and probably nights.)

Surely that was only a proof-of-concept, a demo? Well, yes, but this demo, this prototype ended up in production, virtually unchanged. As most prototypes tend to.

However, we got uncharacteristically lucky. JavaScript was not a tuned-down, dummified version of Java. You see, Brendan was lured to work on this project with the promise that he would be allowed to create a [Scheme](https://en.wikipedia.org/wiki/Scheme_(programming_language))-like language. 

Scheme is a descendant of Lisp (and Algol.) It is nothing like Java. But as any Lisp-like language, you can change the language to do anything any other programming language can do. So Brendan added a Java-like syntax on a Scheme-like core. And 10 days later, the world would be changed forever.

> Brendan Eich - "I’m not proud, but I’m happy that I chose Scheme-ish first-class functions and Self-ish (albeit singular) prototypes as the main ingredients. The Java influences, especially y2k Date bugs but also the primitive vs. object distinction (e.g., string vs. String), were unfortunate." -- https://web.archive.org/web/20200204010840/https://brendaneich.com/2008/04/popularity/


As any prototype that is pushed into production too soon, JavaScript has its problems. But its origins in Scheme, and [Self](https://en.wikipedia.org/wiki/Self_(programming_language)), which themselves were based on Lisp and [SmallTalk](https://en.wikipedia.org/wiki/Smalltalk), gave JavaScript a much healthier base than we could have hoped for.

In 2008 JavaScript got some positive publicity, with [a book by wizard Douglas Crockford -- "Javascript: The Good Parts"](https://www.goodreads.com/book/show/2998152-javascript). Clearly the Good Parts derive from Scheme and Self.

## Toil and Trouble

Today it is hard not to associate the DOM (Document Object Model) with JavaScript. And that is not fair to JavaScript. [The DOM may be the worst API ever invented](https://www.youtube.com/watch?v=Y2Y0U-2qJMs). It was so bad that there came to be not one, not a few, but uncountable DOM wrapper libraries. I even wrote my own, as many web-developers of the era would. In the end, there was a clear winner, called jQuery. Which then got incorporated into the browser again, in a weirdly distorted way. `$(".class")` became `document.querySelectorAll(".class")` because long names are the hallmark of committee standards.

But the DOM is still considered a compilation target. Not something that you program directly, unless you are a masochist. Instead you use things like React, Vue, Angular, Svelte, Ember... Even JavaScript itself has become a compilation target. Any Real(tm) Webdeveloper uses npm, webpack, parcel, rollup, etc. Which all use Babel(tm) to compile JavaScript to JavaScript.

All this stuff makes web development so much harder than it needed to be. This is the real fallout from rushing JavaScript into production in 1995. Because it was so incomplete, wizards all over the world invented their own enhancements. 

A simple example is the JavaScript module system. For the longest time it didn't exist. In the browser you could mimic it by adding HTML script tags, which means using tools outside the language. Or you could add a bundler script to combine all code in a single script file. So now we have multiple different module syntaxes and multiple bundlers, each with their own configuration and associated code.

And even though there now is a clear standard module system, what we end up using is an incompatible version of it, based on npm packages. This was originally designed for Node, a JavaScript engine for the Server, not the Browser.

## The browser-shaped computer

Netscape's dream did not quite happen in the way Netscape imagined. We did not all simply stop using operating systems and live inside Navigator.

But something close enough happened to be worth noticing.

A lot of what people now call "using the computer" is really using the browser. Mail, documents, calendars, maps, banking, shopping, music, chat, work administration, school systems, tax forms, photo libraries. The local machine is still there, but for many people it has become less like the place where the work lives and more like the window through which the work is reached.

ChromeOS makes that idea unusually explicit. It is an operating system built around the assumption that the web is not just one application among many. The web is the main place where things happen.

Electron approaches the same idea from the other direction. If people still expect desktop applications, fine. Put a browser-shaped runtime inside the application and let web technologies pretend to be native software. This is a ridiculous thing to do, and also a very successful one, which is a combination software history seems to enjoy.

Progressive Web Apps sit somewhere in the middle. They try to let web applications behave a bit more like installed software, with icons, offline behavior and notifications, without fully leaving the web behind.

None of these are the final answer. They are clues.

The browser began as a way to read linked documents. JavaScript turned it into a programmable surface. Over time that surface absorbed more and more of the things we used to expect from operating systems: storage, identity, permissions, installation, background work, hardware access, offline behavior.

The network starts to look less like something the computer connects to, and more like the place where the computer happens.

That raises a question this chapter should not try to answer yet. If the web becomes the operating system, who owns the home directory?

That is where Solid will eventually enter the story.

> **Wizard rule**
>
> A prototype is not always a throwaway version of the real thing. Sometimes it is the first piece of ground the future manages to stand on.
