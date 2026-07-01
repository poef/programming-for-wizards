---
tags: programming for wizards
---

# The URL: a spell for pointing anywhere

How do you point to something that may be on any computer in the world?

That is not a small question. Before the Web, computers already talked to other computers. Documents already linked to other documents. Hypertext already existed. Networks already existed. But if you wanted to point to a thing, you usually had to know which system you were inside.

Then a wizard called Tim combined a few existing ideas and made one of the most powerful little strings in the world: the URL.

A URL looks ordinary now. That is one of the problems with successful magic. Once the spell works, people stop seeing the spell.

```
https://example.com/books/wizards/chapter-1.html
```

At first glance this is just an address. But look closer. It contains a protocol, a host, and a path.

```
https://    example.com    /books/wizards/chapter-1.html
protocol   host           path
```

The protocol tells your computer how to talk. The host tells it which computer, or at least which name in the global naming system, to talk to. The path tells that computer what you are looking for.

That is already a small miracle. One string crosses boundaries that used to be separate. It moves from a document to a network protocol, to a global naming system, to a particular server, to a particular resource.

> **Interactive exhibit placeholder: `url-as-compressed-map`**
>
> Show one editable URL. Highlight protocol, hostname, port, path, query and fragment as the reader edits it. Next to it, show a little route map: document -> browser -> DNS -> server -> resource -> section. Also show relative URLs and how their meaning changes depending on the current page.

## HyperText

The other half of the Web is in the name: HyperText.

A normal text goes from start to end. You can skip around, of course, but the text itself does not help you much. HyperText adds links. It lets the text point outside itself.

This was not a new idea. Wizards had been dreaming about systems like this long before the Web. But earlier systems tended to be complete worlds. You had to enter the system, use its tools, accept its rules.

The URL made the boundary thinner. A link did not have to mean: go to another place in this one system. It could mean: go anywhere.

That is the design move worth remembering. The Web did not win because every part was new. It won because the parts were combined at the right boundary. A simple text format could contain a link. The link could be a URL. The URL could point to another document. That document could contain more links.

Small marks. Large worlds.

## Why this matters for programming

A URL is not just an address. It is an agreement between systems.

It says: if you can understand this string, you can participate. You do not need to know which program created the document. You do not need to ask permission from a central application. You only need to follow the parts of the spell.

This is why the URL is one of the great programming ideas. It is not clever because it is complicated. It is clever because it is simple enough to become infrastructure.

And it teaches a useful lesson: sometimes the right abstraction is not an object, or a class, or a service. Sometimes it is a string with a few well-chosen separators.

> **Wizard move**
>
> A boundary becomes powerful when both sides can cross it without knowing each other's private machinery.
