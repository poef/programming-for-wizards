---
tags: programming for wizards
---

# The Web: one string to rule them all

In 1989 a wizard called [Tim](https://www.w3.org/People/Berners-Lee/) invented the [World Wide Web](https://www.w3.org/History/1989/proposal-msw.html) and changed the world forever. There was [quite](https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall) a [bit](https://history.state.gov/milestones/1989-1992/apartheid) of [world-changing](https://en.wikipedia.org/wiki/History_of_Poland_%281945%E2%80%931989%29#Final_decade_of_the_Polish_People%27s_Republic_%281980%E2%80%931989%29) going on that year, so this particular change didn't look all that important at the time. A proposal for sharing documents at CERN had to compete with falling walls, collapsing regimes and the end of the Cold War. Looking back, it may have mattered more than any of them.

The [first website](https://info.cern.ch) did not look much like the future. It was mostly text and links, it didn't even have a cookie banner:

```htmlembedded=
<header>
<title>http://info.cern.ch</title>
</header>

<h1>http://info.cern.ch - home of the first website</h1>
<p>From here you can:</p>
<ul>
<li><a href="http://info.cern.ch/hypertext/WWW/TheProject.html">Browse the 
    first website</a></li>
<li><a href="http://line-mode.cern.ch/www/hypertext/WWW/TheProject.html">
    Browse the first website using the line-mode browser simulator</a></li>
<li><a href="http://home.web.cern.ch/topics/birth-web">Learn about the birth
    of the web</a></li>
<li><a href="http://home.web.cern.ch/about">Learn about CERN, the 
    physics laboratory where the web was born</a></li>
</ul>
</body>
```

It does not look revolutionary today. Most of the Web wasn't. But there is one part that is. It is a small thing, a tag with just one letter, `a`. 

```html
<a href="http://info.cern.ch/hypertext/WWW/TheProject.html">The World Wide Web project</a>
```

Hidden inside it is another invention, probably the more important one:

```url
http://info.cern.ch/hypertext/WWW/TheProject.html
```

The [URL](https://url.spec.whatwg.org/). The Uniform Resource Locator. To understand why this small invention mattered, we need to go back a little further than 1989.

Back then the internet was already a few years old. The idea of [hypertext](https://en.wikipedia.org/wiki/Hypertext) was even older than that. [Ted Nelson](https://en.wikipedia.org/wiki/Ted_Nelson) coined the term in 1965, and you can trace the dream further back to [Vannevar Bush](https://en.wikipedia.org/wiki/Vannevar_Bush)'s 1945 essay [*As We May Think*](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/). 

But while Hypertext as a concept had been around, nobody had truly made it work. At least not on a global scale.

Ted Nelson started [the Xanadu project](https://en.wikipedia.org/wiki/Project_Xanadu) in the 1960s. Apple released [HyperCard](https://en.wikipedia.org/wiki/HyperCard) in 1987.

Xanadu promised two-way links, worldwide distribution, version history and a payment system. HyperCard had cards, stacks, buttons and links. Just not over the network.

Xanadu tried to solve the entire problem of hypertext and never produced a system that ordinary people could use. HyperCard did ship, and it was popular for a while, but never got as big as the Web. It couldn't cross the gap to another computer maintained by someone else.

The Web could.

Sir Tim Berners-Lee did not have to invent networking from scratch. The internet existed. [TCP/IP](https://en.wikipedia.org/wiki/Internet_protocol_suite) was there. He did not have to invent a global naming system for computers. [DNS](https://en.wikipedia.org/wiki/Domain_Name_System) existed. He did not have to invent hierarchical file paths. [Unix](https://en.wikipedia.org/wiki/Unix) had made those familiar.

He stole those ideas and packaged them together in this new thing: the URL. 

## Three stolen pieces

Look again at the URL:

```url
http://info.cern.ch/hypertext/WWW/TheProject.html
```

It has three obvious parts:

```text
http://    info.cern.ch    /hypertext/WWW/TheProject.html
protocol  hostname        path
```

It combines three pieces of information in a single, human-readable string: 

- The protocol
- The hostname
- The file path

And just like that, we could now refer to any file on any computer anywhere in the world.

And it is simple, small, readable. You can copy a URL into an e-mail, print it in a book, write it on a whiteboard, paste it in a chat message, or, if you are feeling particularly cursed, read it aloud over the phone.

The URL is an address, but it is also a tiny user interface to the network.

## The path

```text
/hypertext/WWW/TheProject.html
```

If you have used a Unix-like system, this shape is familiar. A slash separates folders and files. A path starts at a root, then moves down through names until it reaches the thing you want.

```text
/hypertext
/hypertext/WWW
/hypertext/WWW/TheProject.html
```

This feels obvious now, but it was only one possible way to name files. DOS and Windows used backslashes and drive letters. VMS had paths that looked like they had escaped from an engineering manual:

```text
NODE"accountname password"::device:[directory.subdirectory]filename.type;ver
```

The Web was developed by Sir Tim on a Unix machine: a NeXT Cube designed by Steve Jobs. So it is no surprise that the URL follows Unix's path format, the simplest one.

Unix itself had stolen and simplified ideas from earlier systems such as Multics. One of its beautiful tricks is that users do not normally need to care which physical device a file is on. There is a single tree. Disks and devices can be mounted into that tree. The messy physical world disappears behind a simpler name world.

Simple ideas often grow more complex threads when they meet the real world. For example, how would you create a file with a name that includes a `/`? The simple answer would be "don't do that." A common solution is to define a special 'escape' character, e.g. `\`:

```
/folder\/with_a_slash/
```

An escape character says: the next character is special. However, DOS already used that character. So Sir Tim chose a different way, now called URL encoding:

```
/folder%2Fwith_a_slash/
```

The escape character, that signifies the start of an encoded sequence, is the `%` character. And it is always followed by two hexadecimal digits. So `%2F` is decimal 47, and in the [ASCII encoding](https://en.wikipedia.org/wiki/ASCII) means `/`.

Any character can be added to a URL like this, even if it's not normally printable. This allows URLs to become mobile, part of an e-mail, or even books.

## The hostname

```url
//info.cern.ch/
```

The double slash says that what follows is a network location. This convention was borrowed too; Berners-Lee has said he took it from [Apollo workstations](https://en.wikipedia.org/wiki/Apollo_Computer), where `//` was used for network paths.

The more important stolen idea here is DNS, the Domain Name System.

Before DNS, the internet was small enough that people could maintain host files: lists of names and IP addresses. Your computer may still have such a file. It is charming in the same way a village phone book is charming. Once the village becomes the whole planet, the charm wears off.

A wizard called Paul Mockapetris was tasked with designing a suitable solution. He did so in 1983, and in 1986 it became an internet standard. And for its day it was admirably decentralized.

One machine no longer needed a complete list of every other machine. Names could be delegated. Different organizations could manage different parts. The naming system itself became a hierarchy, which meant it could grow without asking one poor text file to contain the world.

By 1988 DNS was established, Sir Tim did not need to invent a new naming system. He just put the existing one inside the URL.

## The protocol

```url
http://
```

The protocol looks like the least interesting part of the URL. In fact it reveals the almost megalomaniac ambition behind it.

Compare it with [Gopher](https://en.wikipedia.org/wiki/Gopher_%28protocol%29), another worldwide information system that appeared around the same time. For a brief moment, Gopher was a serious contender. A Gopher menu entry might contain a type, a title, a path, a hostname and a port:

```text
1CIA World Factbook    /Archives/politics/CIA    gopher.example.org    70
```

A line like that can point to information on another Gopher server. The format is useful, but the world it imagines is still mostly Gopher-shaped. You are moving from one part of Gopher-space to another.

A URL begins by saying which kind of space you are entering. `http:` is one possibility. A browser might also understand `ftp:`, `file:`, `mailto:`, and later `data:`, `blob:`, `webcal:`, `magnet:`, and a long list of stranger creatures.

It has such a great design that wizards everywhere steal it and extend it for their own purposes. Not all later schemes were protocols. Some told the browser how to interpret the rest of the string; others opened another application. 

Almost none of the pieces in a URL were new. The trick was putting existing pieces together in one simple, small, readable string. 

> **Wizard's fourth rule**
>
> Start small, to build big.