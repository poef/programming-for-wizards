---
tags: programming for wizards
---

# The Web as address: a spell for pointing anywhere

In 1989 a wizard called Tim invented the World Wide Web and changed the world forever.

That sounds dramatic, but 1989 was not exactly short on drama. Walls were falling. Regimes were cracking. The Cold War was entering its final strange act. Compared to all of that, a proposal for sharing documents between physicists at CERN must have looked very small.

That is one of the problems with good magic. When it first appears, it often looks like paperwork.

The first website did not look like the future either. It did not have video, rounded corners, infinite scrolling, cookie banners, or a button asking you to subscribe to a newsletter before you had read the first sentence. It was mostly text and links.

```htmlembedded=
http://info.cern.ch

# http://info.cern.ch - home of the first website

From here you can:

  * Browse the first website
  * Browse the first website using the line-mode browser simulator
  * Learn about the birth of the web
  * Learn about CERN, the physics laboratory where the web was born
```

It does not look revolutionary today. It barely even looks designed. But there is a little piece of that first page that deserves more attention than it usually gets:

```html
<a href="http://info.cern.ch/hypertext/WWW/TheProject.html">The World Wide Web project</a>
```

The `a` tag is tiny. Almost suspiciously tiny. Just one letter. Hidden inside it is another invention, probably the more important one:

```url
http://info.cern.ch/hypertext/WWW/TheProject.html
```

The URL. The Uniform Resource Locator.

A spell for pointing anywhere.

> **Interactive exhibit placeholder: `url-as-compressed-map`**
>
> Show one editable URL. Highlight the protocol, hostname, path, query and fragment as the reader edits it. Next to it, show a little route map: document -> browser -> DNS -> server -> resource -> section. Then let the reader switch between an absolute URL, a protocol-relative URL, an origin-relative URL and a page-relative URL. The important thing to show is how much world is compressed into one string.

## Hypertext was already in the air

To understand why the URL mattered, we need to go back a little further than 1989.

The idea of hypertext was older than the Web. Ted Nelson coined the term in 1965, and you can trace the dream further back to Vannevar Bush's 1945 essay *As We May Think*. Wizards had been dreaming for decades about systems where documents could point to other documents, where knowledge could become a web instead of a pile.

But there is a large gap between dreaming about a global web of knowledge and getting one that ordinary people can actually use.

Ted Nelson started the Xanadu project in the 1960s. It was ambitious, beautiful, and, as ambitious beautiful things often are, very hard to finish. Apple released HyperCard in 1987. HyperCard had cards, stacks, buttons and links. It let ordinary people build little interactive information worlds. In another timeline it might have become the way many people learned to think with computers.

HyperCard was wonderful inside its own little universe. A card could point to another card. A button could take you somewhere else in the stack. Local magic, and very good local magic too.

The awkward part was the boundary. What if the thing you wanted to point to was maintained by someone else? What if it lived on another computer? What if it was served by another program? What if it was not part of your carefully prepared stack at all?

Xanadu tried to design a grand hypertext universe. HyperCard made a smaller universe that people could actually play with. The Web took a stranger route. It connected existing worlds using the cheapest-looking piece of machinery imaginable: a string.

That is the part I find interesting. Tim Berners-Lee did not have to invent networking from scratch. TCP/IP was there. He did not have to invent a global naming system for computers. DNS was there. He did not have to invent hierarchical file paths. Unix had made those familiar. He did not have to invent the dream of hypertext either.

The missing piece was a simple way for one document to say:

> The thing I mean is over there.

Over there on that machine. Over there using that protocol. Over there at that path.

A normal-looking address. With a lot of stolen machinery hiding inside it.

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

The protocol tells your computer how to talk.

The hostname tells it which name in the global naming system to resolve.

The path tells the other side what you are looking for.

Put those pieces together, and a plain text document can point to a published resource on another computer, maintained by another person, somewhere else in the world.

That is a ridiculous amount of power for one string.

And the string is still readable. This matters. It matters more than programmers sometimes admit. You can copy a URL into an email, print it in a book, write it on a whiteboard, paste it in a chat message, or, if you are feeling particularly cursed, read it aloud over the phone.

The URL is an address, but it is also a tiny user interface to the network.

## The path: Unix hiding in plain sight

Start with the path:

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

The URL chose the simpler Unix-shaped world.

Unix itself had stolen and simplified ideas from earlier systems such as Multics. One of its beautiful tricks is that users do not normally need to care which physical device a file is on. There is a single tree. Disks and devices can be mounted into that tree. The messy physical world disappears behind a simpler name world.

That idea survives inside the URL. The path says:

```text
/hypertext/WWW/TheProject.html
```

It does not mention a disk, a controller, a cabinet, a room, a CPU architecture or a filesystem implementation. All of that may exist, but the name does not force you to think about it.

A path is a useful lie. Like many useful lies in programming, it hides the machinery that would only get in the way.

Of course, useful lies still need accounting departments. Real names contain spaces, punctuation, accents, and all the other little complications people produce when nobody is watching. URLs had to make room for that too, without giving up the simple slash-shaped path.

That is not the glamorous part of the Web. It is the kind of small compromise that lets a simple text format survive the outside world.

## The hostname: a global phone book that is not a book

Now look at the middle part:

```url
//info.cern.ch/
```

The double slash says that what follows is a network location. This convention was borrowed too; Berners-Lee has said he took it from Apollo workstations, where `//` was used for network paths.

Again, this is how wizards really work most of the time. They do not produce polished inventions from a vacuum. They notice a shape that already solved part of the problem somewhere else, then move it to a place where it suddenly matters more.

The more important borrowed system here is DNS, the Domain Name System.

Before DNS, the internet was small enough that people could maintain host files: lists of names and IP addresses. Your computer may still have such a file. It is charming in the same way a village phone book is charming. Once the village becomes the whole planet, the charm wears off.

DNS turned naming into a distributed system. One machine no longer needed a complete list of every other machine. Names could be delegated. Different organizations could manage different parts. The naming system itself became a hierarchy, which meant it could grow without asking one poor text file to contain the world.

So `info.cern.ch` is doing more than naming a server. It hooks the URL into a shared global act of naming.

The URL did not solve naming. It gave DNS a place inside the hypertext spell.

## The protocol: a slightly mad opening move

Finally, the first part:

```url
http://
```

At first this seems like the boring bit. It tells the browser to use HTTP. Sensible enough.

But putting the scheme at the front was also a wonderfully strange move, because it left the door open for the link to escape HTTP.

Compare it with Gopher, another worldwide information system that appeared around the same time. For a brief moment, Gopher was a serious contender. A Gopher menu entry might contain a type, a title, a path, a hostname and a port:

```text
1CIA World Factbook    /Archives/politics/CIA    gopher.example.org    70
```

A line like that can point to information on another Gopher server. The format is useful, but the world it imagines is still mostly Gopher-shaped. You are moving from one part of Gopher-space to another.

A URL begins by saying which kind of space you are entering. `http:` is one possibility. A browser might also understand `ftp:`, `file:`, `mailto:`, and later `data:`, `blob:`, `webcal:`, `magnet:`, and a long list of stranger creatures.

Some of these are network protocols. Some are browser instructions. Some are hooks into other applications. Some feel like ideas that escaped before anyone had time to ask whether they should.

This is one of the reasons URL-shaped strings escaped the Web. APIs use them. Package managers use them. Apps use them. Configuration files use them. Databases use them. Decentralized systems use them. Once people understood the shape, they kept reusing it.

That is usually a good sign. A design has become part of the language when people start using it in places its inventor did not plan.

## The small turn

So the URL is not impressive because every part of it was new. It is impressive because a few existing parts were turned toward each other.

```text
protocol://hostname/path
```

That little shape was simple enough to write by hand, simple enough to paste into another document, and open enough that people could use it before anyone had finished arguing about what the Web should become.

This is where the URL feels most wizard-like to me. Xanadu tried to design the whole dream of hypertext. The URL aimed at a much narrower target: make a document point outside itself. Questions about ownership, versioning, permissions, identity, payment, permanence and trust could remain unresolved for the moment. Many of them are still unresolved. Some became worse because the Web made everything so easy to connect.

But the shape of the problem had changed. A document no longer had to contain the world it wanted to point into. It only needed a small piece of text that crossed the boundary. That shift made the original problem smaller, and at the same time made the possible world much larger.

The first version of the Web could be poor, ugly, incomplete, and still useful. Perhaps especially because it was incomplete. People could publish a page without joining a grand knowledge system. They could run a server without asking permission from the authors of the browser. New uses could grow in the gaps, because the boundaries were still visible.

## Why this matters for programming

Programmers often look for the important abstraction in the wrong place. We expect it to be a clever class hierarchy, a sophisticated database model, a perfect framework, a beautiful algorithm.

Sometimes it is. Quite often it is just a string with a few separators in the right places.

The URL works because it crosses boundaries without swallowing the systems on either side. The document can contain a link without understanding DNS. DNS can resolve a name without understanding HTML. The server can answer a request without knowing where the link was printed. The browser can follow the address without knowing who wrote the page.

Each part keeps its own job. The connection between them stays small.

That is much harder to design than it looks. Large systems keep tempting us to make larger abstractions: one model to explain everything, one framework to own everything, one platform to contain everything. The Web went the other way often enough to matter. It left boundaries visible. A boundary is a place where one system can meet another without becoming it.

This is something a wizard is very aware of. A small change in representation can make a problem manageable. Sometimes it makes the old problem disappear. And sometimes, if the shape is right, it opens a door you did not know was there.

> **Wizard rule**
>
> When a problem feels too large, do not only look for a larger solution. Look for the smaller shape that changes what kind of problem it is.
