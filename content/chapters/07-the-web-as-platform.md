---
tags: programming for wizards
---

# The Web: waking up the words

It's May 1995. You've just landed a dream job at the hot new startup of the decade: [Netscape](https://en.wikipedia.org/wiki/Netscape_Navigator). You've just arrived and you want to impress. The gurus in charge ask you to add a programming language to the Web. 

You have 10 days.

[Brendan Eich](https://en.wikipedia.org/wiki/Brendan_Eich) was the wizard who made JavaScript under these conditions. Its creation story is almost mythical.

Before JavaScript, if you wanted to create an interactive website, the only way would be to add a form. A visitor of your website would fill it in, then press submit. The form data is sent to the web server, where a program is called through the [cgi-bin API](https://en.wikipedia.org/wiki/Common_Gateway_Interface). This program reads the form data and does its magic, then prints a response. The webserver reads the response and sends it back to the web browser. Not very interactive at all.

In 1995 Netscape was king of the webbrowser hill. [Microsoft Internet Explorer 1.0](https://en.wikipedia.org/wiki/Internet_Explorer_1) would be released in August 1995, and not get any real traction until version 4, in 1997. Netscape had set their sights on making the web, and the web browser, the next operating system. Instead of creating executables and distributing these on media like floppy disks or cd-roms, they saw a future where software would be running in the network and all you needed was a connection and a browser, the Netscape Navigator of course.

Obviously for this to come to fruition, the web would need to be more interactive, more programmable. So Netscape set out a two-pronged strategy. Real(tm) programmers would use a Real(tm) programming language to write Real(tm) programs. Then the rest of us could glue these together in a scripting language. The Real(tm) programming language of choice, in 1995, was ofcourse [Java](https://en.wikipedia.org/wiki/Java_%28programming_language%29)(tm). So the scripting language would need to mimic the Java syntax.

Why Netscape chose Java isn't hard to see. At the time there were still many different computer architectures in use. Writing software that would run on all those systems was hard. Java side-stepped that entire problem with the innovative [JVM](https://en.wikipedia.org/wiki/Java_virtual_machine) (Java Virtual Machine.) Using anything other than Java would make the whole task almost impossible to achieve.

Enter Brendan Eich. As he later described it:

> "At least client engineering management including Tom Paquin, Michael Toy, and Rick Schell, along with some guy named Marc Andreessen, were convinced that Netscape should embed a programming language, in source form, in HTML." -- "What was needed was a convincing proof of concept, AKA a demo. That, I delivered, and in too-short order it was a fait accompli."

That prototype became the programming language of the Web.

> **Wizard's sixth rule**
>
> Your spells may gain a life of their own.

We got uncharacteristically lucky. JavaScript was not a tuned-down, dummified version of Java. You see, Brendan was lured to work on this project with the promise that he would be allowed to create a [Scheme](https://en.wikipedia.org/wiki/Scheme_%28programming_language%29)-like language. 

Scheme is a descendant of Lisp (and Algol.) It is nothing like Java. But as any Lisp-like language, you can change the language to do anything any other programming language can do. So Brendan added a Java-like syntax on a Scheme-like core. And 10 days later, the world would be changed forever.

> [Brendan Eich](https://web.archive.org/web/20200204010840/https://brendaneich.com/2008/04/popularity/) - "I’m not proud, but I’m happy that I chose Scheme-ish first-class functions and Self-ish (albeit singular) prototypes as the main ingredients. The Java influences, especially y2k Date bugs but also the primitive vs. object distinction (e.g., string vs. String), were unfortunate."

Like any prototype that is pushed into production too soon, JavaScript has its problems. But its origins in Scheme, and [Self](https://en.wikipedia.org/wiki/Self_%28programming_language%29), which themselves were based on Lisp and [Smalltalk](https://en.wikipedia.org/wiki/Smalltalk), gave JavaScript a much healthier base than we could have hoped for.

In 2008 JavaScript got some positive publicity, with [a book by wizard Douglas Crockford -- "JavaScript: The Good Parts"](https://www.goodreads.com/book/show/2998152-javascript). Clearly the Good Parts derive from Scheme and Self.

## Toil and Trouble

Today it is hard not to associate the DOM (Document Object Model) with JavaScript. And that is not fair to JavaScript. [The DOM may be the worst API ever invented](https://www.youtube.com/watch?v=Y2Y0U-2qJMs). It was so bad that there came to be not one, not a few, but uncountable DOM wrapper libraries. I even wrote my own, as many web developers of the era would. In the end, there was a clear winner, called [jQuery](https://jquery.com/). Which then got incorporated into the browser again, in a weirdly distorted way. `$(".class")` became `document.querySelectorAll(".class")` because long names are the hallmark of committee standards.

But the DOM is still considered a compilation target. Not something that you program directly, unless you are a masochist. Instead you use things like [React](https://react.dev/), [Vue](https://vuejs.org/), [Angular](https://angular.dev/), [Svelte](https://svelte.dev/), [Ember](https://emberjs.com/)... 

Even JavaScript itself has become something you often process before the browser sees it. For years that meant [npm](https://www.npmjs.com/), bundlers, transpilers and configuration files. [Babel](https://babeljs.io/) compiled JavaScript to JavaScript. 

Bundled, minified, obfuscated, unreadable.

All this stuff makes web development so much harder than it needed to be. This is the real fallout from rushing JavaScript into production in 1995. Because it was so incomplete, wizards all over the world invented their own enhancements. 

A simple example is the JavaScript module system. For the longest time it didn't exist. In the browser you could mimic it by adding HTML script tags, which means using tools outside the language. Or you could add a bundler script to combine all code in a single script file. So now we have multiple different module syntaxes and multiple bundlers, each with their own configuration and associated code.

And even though there now is a clear standard module system, what we end up using is often an incompatible version of it, based on npm packages. This was originally designed for [Node](https://nodejs.org/), a JavaScript engine for the server, not the browser.

## The browser-shaped computer

Netscape's dream did not quite happen in the way Netscape imagined. We did not all simply stop using operating systems and live inside Navigator.

A lot of what people now call "using the computer" is really using the browser. Mail, documents, calendars, maps, banking... I could go on and on. The local machine is still there, but today the machine itself matters less and less. It has become an interface--a keyboard, mouse and screen that give you access to your work instead of owning it.

[ChromeOS](https://chromeos.google/) makes that idea unusually explicit. It is an operating system built around the assumption that the web is not just one application among many. The web is the main place where things happen.

[Electron](https://electronjs.org/docs/latest) approaches the same idea from the other direction. If people still expect desktop applications, fine. Put a browser-shaped runtime inside the application and let web technologies pretend to be native software. This is a ridiculous thing to do, and also a very successful one, not an unusual combination in software history.

[Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) sit somewhere in the middle. They try to let web applications behave a bit more like installed software, with icons, offline behavior and notifications, without fully leaving the web behind.

None of these has replaced the operating system. We're still divided into an Apple and Windows world, with a little sprinkling of Linux in between. But more and more traditional OS concerns are moving to the Web. And maybe not always in the way we'd like.

Netscape wanted the browser to become the operating system. In many ways it did. The network is becoming the OS. The question is whether this new OS serves you, or someone else?