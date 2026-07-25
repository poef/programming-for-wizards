# Editorial note: strengthening the causal history of the first Web arc

## Purpose

The first three Web chapters are more historical than anthropological. Their main strength is not that they interpret the Web as a culture, but that they show how it emerged from a sequence of existing ideas, practical constraints, borrowed parts and accidents that became permanent.

The aim should therefore be different from the approach to the prologue and language chapter. These chapters do not need many wider reflections. They benefit most from additions that make the causal chain clearer:

* why an older idea had not yet worked at global scale;
* which existing part made the next step possible;
* what was deliberately left out;
* how a local implementation choice became a universal convention;
* why an apparent flaw survived;
* how a prototype or compromise acquired consequences far beyond its original purpose.

A useful editing rule for this arc is:

> **Add context when it explains why the next step became possible, not merely because the context is interesting.**

The historical details should keep pulling the reader forward. Each chapter should feel like the answer to a question created by the previous one.

## The arc across the three chapters

The three chapters already form a strong progression:

* **Address:** the URL makes things anywhere in the network nameable.
* **Document:** HTML gives those named things a portable structure.
* **Platform:** JavaScript lets the structured document respond and act.

Or, more compactly:

> First the Web could point.
> Then it could describe.
> Then it could do things.

This is the larger historical story worth making slightly more explicit. The Web was not designed all at once as the application platform we now use. It acquired that role one small capability at a time.

Each new layer reused the layer below it:

1. A URL could travel in ordinary text.
2. Following it retrieved an HTML document.
3. The document could contain code.
4. The code could change the document.
5. The browser gradually became a programmable environment.
6. The programmable environment became where much of everyday computing happens.

This is a James Burke-like chain, but it is already inside the material. The edit should reveal the chain, not add a second narrative on top of it.

## Chapter 5: the Web as address

### What already works

The chapter has a clear central claim: the revolutionary part of the first website is not the page itself, but the address hidden inside its links.

The comparison with Xanadu and HyperCard works because it shows that hypertext was not new. The breakthrough was assembling existing pieces into something that could cross the boundary between computers maintained by different people.

The “three stolen pieces” structure is strong and should remain the spine of the chapter:

* path;
* hostname;
* protocol.

The closing rule, “Start small, to build big,” follows naturally from the fact that almost none of the ingredients were new.

### Where additions may help

The most useful addition would explain that the Web did not solve every problem Xanadu tried to solve. It made linking cheap by requiring less agreement.

A Web link can be created without registering it with the destination, receiving permission from the destination, or requiring the destination to link back. This means links can break, but it also means anybody can create one.

That trade-off helps explain why the smaller system spread.

The path section could make the historical contingency more visible. The slash now looks like the natural shape of a web address, but it partly reflects the machine and operating system on which the Web was first built. A local convention became a global interface.

The DNS section already explains delegation well. A short sentence could connect the mechanism to the theme: DNS scales because nobody has to keep a complete list of the world.

The protocol section can carry more of the chapter’s ambition. The scheme at the beginning of a URL means the string was not limited to one information system. The browser could become a gateway between different kinds of network space.

### What to avoid

The chapter does not need a broad social interpretation of naming or ownership yet. Those subjects matter later in the book, but here they would slow a particularly clean piece of technical history.

It also does not need more inventors or competing systems unless they explain one of the URL’s three parts. The existing cast is already sufficient.

## Chapter 6: the Web as document

### What already works

This chapter has a rich historical sequence:

editor’s marks → mechanical typesetting → `troff` and TeX → semantic markup → GML and SGML → HTML → the DOM tree → `contenteditable`.

The strongest underlying idea is that marks which once instructed another person eventually became instructions interpreted by a machine.

The chapter also ends in the right place. HTML looks simple, but the choice to represent a document as a tree has consequences that become especially visible when we try to edit it.

“Choose what haunts you” is earned by the structure of the chapter.

### Where additions may help

This chapter has the most room for carefully chosen explanatory additions.

The first useful distinction is between markup that says **how something should look** and markup that says **what kind of thing it is**.

`troff` and TeX are largely concerned with producing a page. GML and HTML move toward saying that something is a heading, paragraph, list or link. Once the document describes its parts rather than one fixed appearance, different machines can render it differently.

That helps explain why semantic markup was suited to a network of unlike computers and displays.

A second useful addition concerns simplicity. SGML offered a general system for defining document languages. HTML took a much smaller route: one usable vocabulary that people could write in an ordinary text editor. It gave up generality in exchange for immediate usefulness.

The tree structure deserves one concrete example of what it excludes. A tree can represent nesting, but not two structures that overlap. An annotation might begin halfway through one paragraph and end halfway through the next while crossing emphasis or another annotation. Both structures make sense to a reader, but they cannot both be represented as simple nested elements.

This would make the later editing problem feel less arbitrary.

The `contenteditable` section would benefit from a brief explanation of the mechanism behind its difficulty:

* the user edits visible text and expresses intent;
* the browser must translate that action into changes to a tree;
* many different HTML trees can produce the same visual result;
* a small visual edit may require restructuring several elements;
* the browser cannot always know which structure the author intended.

That is why successful editors often maintain their own document model and treat HTML as an import and export format.

A final possible addition is HTML’s tolerance of errors. On the Web, rejecting an entire document because of one missing tag would be pure but not useful. Browsers learned to repair malformed input. That resilience helped the Web spread, but made parsing and editing much more complicated.

This is an especially good example of choosing what will haunt you.

### What to avoid

The chapter already contains many historical systems and names. Additional context should clarify the change from physical instruction to machine-readable structure, not become a fuller history of publishing software.

The TeX digression is enjoyable, but the chapter should not linger longer there. Knuth is supporting evidence, not the destination.

## Chapter 7: the Web as platform

### What already works

The opening is strong because it places the reader inside a moment of historical pressure:

* Netscape wants the browser to become the operating system;
* it needs programmability;
* management wants a convincing demonstration;
* Brendan Eich has ten days.

The contrast between Java-like syntax and Scheme/Self-like foundations is important. It explains why JavaScript became stranger and more capable than the “glue language” Netscape initially imagined.

The rule is also excellent:

> **Your spells may gain a life of their own.**

JavaScript outlived its prototype, its original browser, the company that created it and the distinction between “real” programming and scripting.

The final section then shows that Netscape’s strategic idea survived even though Netscape did not.

### Where additions may help

The first addition should preserve the ten-day story while making its meaning precise. Ten days produced the convincing prototype, not the complete modern language. The important point is that prototypes can establish names, syntax and assumptions before anyone knows how far they will travel.

The chapter could also make one decisive step more explicit:

> JavaScript source travelled with the document.

Users did not need to install a separate program from a disk. They followed a URL, received a page and received its behaviour with it. A document had become a delivery system for software.

That is the bridge from “the Web as document” to “the Web as platform.”

The later criticism of JavaScript, the DOM and the toolchain would benefit from a little more historical balance. The complexity did not arise only because JavaScript was rushed or incomplete. It also came from:

* competing browsers;
* slow standardisation;
* missing facilities such as modules;
* the demand to preserve old pages;
* the expansion of the Web far beyond its original ambitions;
* developers using the browser for applications it was never designed to host.

The libraries, transpilers and frameworks were not merely needless complications. They were attempts to bridge the distance between the small 1995 system and the applications people later wanted to build.

A useful framing might be:

> The complexity is evidence of failure, but also of success. People kept extending the Web because the ability to send software by sending an address was too valuable to abandon.

This would preserve the criticism without dismissing the work of the communities that solved real problems.

The transition to “The browser-shaped computer” could then become more explicit:

1. JavaScript made documents programmable.
2. Programmable documents became applications.
3. Applications accumulated enough capabilities to compete with the operating system.
4. Netscape lost the browser war, but its larger bet survived.

That final irony is worth stating. Companies can lose while their ideas win.

### What to avoid

This chapter should not become a full history of the browser wars, ECMAScript standardisation, Node, npm or frontend frameworks. Those stories are large enough to consume the chapter.

The point is not to assign blame for every modern complication. It is to show how a ten-day prototype became permanent infrastructure because the surrounding idea was so powerful.

The ownership question at the end should remain a question. The later Solid chapters are the place to examine who the network operating system serves.

## Emerging progression

With a few carefully placed additions, the three chapters can make this sequence visible without announcing it too often:

* The URL did not invent the network. It made the network addressable.
* HTML did not invent documents. It gave networked documents a shared structure.
* JavaScript did not invent programming. It let programs travel with documents.
* The browser did not replace the operating system. It absorbed more and more of what the operating system was for.

The broader lesson is historical rather than anthropological:

> The Web became large because each layer was small enough to adopt, useful before the next layer existed, and open to purposes its inventors had not planned.

---

# Candidate additions to consider

These are rough material to rewrite in the book’s own voice, shorten, move or discard. They are not intended as finished replacements.

## Chapter 5: the Web as address

### The Web succeeded by asking less

> Xanadu tried to make links complete. They could point both ways, preserve history and account for ownership and payment.
>
> The Web asked much less of a link.
>
> You did not need the permission of the page you linked to. The other server did not need to know that your link existed. Nothing guaranteed that the address would still work tomorrow.
>
> This allowed links to break.
>
> It also allowed anyone to make one.

### A URL says where to ask

> A URL does not guarantee that the thing is there. It does not guarantee that you may read it, or that it will still be there later.
>
> It only tells you where and how to ask.
>
> That small promise was enough.

### The slash as a historical fossil

> The slash feels like the natural shape of the Web now. But it is partly a fossil from the machine on which the Web was made.
>
> A convention inherited from Unix became a convention learned by billions of people.

### DNS scales by not knowing everything

> DNS works because no machine needs to know every name.
>
> Each part of the system only needs to know its own part of the tree, and where to ask about the rest. The world becomes nameable without one machine having to contain the world.

### The ambition inside the protocol

> The protocol at the front means that a URL is not limited to the Web.
>
> The same shape can say: fetch a web document, transfer a file, open a local file or prepare an e-mail.
>
> The address does not only point somewhere. It says what kind of journey to make.

### A possible closing bridge

> The URL gave the network a common way to point.
>
> But an address is only useful if something understandable waits at the other end.

## Chapter 6: the Web as document

### From instructions to a person to instructions to a machine

> Markup began as a conversation between people.
>
> An editor added marks. A typesetter read them and turned them into a page.
>
> Computers kept the marks and replaced the typesetter.

### Appearance versus meaning

> `troff` and TeX mostly say how a document should appear: use this font, leave this space, place this text here.
>
> GML took another step. It could say what a piece of text was: a heading, a paragraph or an item in a list.
>
> Once a document says what its parts mean, a machine can decide how those parts should look.

### Why this suited the Web

> A printed page has already chosen its final shape.
>
> A web document may appear on a workstation, a terminal, a phone, a screen reader or a machine that did not exist when the document was written.
>
> Describing the parts instead of one fixed page gives each machine room to render them.

### HTML chose a smaller problem

> SGML was a system for defining document languages. HTML was a document language people could use.
>
> The first was more general. The second was small enough to ship.
>
> Once again, the Web grew by solving less.

### The consequence of one tree

> Real documents do not always fit neatly into one tree.
>
> An annotation may begin halfway through one paragraph and end halfway through the next. It may cross a quotation or a piece of emphasis. Each structure makes sense on its own, but together they overlap.
>
> HTML makes you choose which structure owns the other.

### Why editing HTML is difficult

> A reader edits what appears on the screen. The browser must edit the tree underneath it.
>
> That translation is not simple. Several different trees can look exactly the same. Removing one visible character may require splitting an element, joining two others or deciding whether an empty element should survive.
>
> The browser sees the operation. It cannot always know the author’s intention.

### Error recovery as a chosen ghost

> A strict browser could reject a page as soon as it found one broken tag.
>
> That would be clean. It would also make much of the Web disappear.
>
> Browsers learned to repair bad HTML instead. This made the Web resilient and its parsing rules remarkably complicated.
>
> The mistake still appears on the screen. The complexity moves into the browser.

## Chapter 7: the Web as platform

### The ten-day prototype

> Ten days did not produce the final JavaScript we use today. It produced the prototype that made the decision difficult to reverse.
>
> A prototype only needs to prove that something can work.
>
> Sometimes the world then keeps the proof.

### Programs travelled with documents

> Server programs already existed. The new step was putting a program in the page itself.
>
> The code travelled with the document. Follow a URL and the browser received both the words and the behaviour.
>
> A document could now wake up.

### The spell outlived its makers

> JavaScript outlived the first implementation, the browser it was made for and the company that employed its inventor.
>
> It also outlived the idea that it would only glue together programs written by “real” programmers.

### Why the rough language survived

> Replacing JavaScript would not only mean designing a better language.
>
> It would mean breaking pages that already existed on servers all over the world. The Web had turned old experiments into other people’s dependencies.

### A more balanced account of the toolchain

> The missing pieces were real. So were the problems the new tools solved.
>
> Libraries made incompatible browsers behave more alike. Bundlers supplied modules before the browser had them. Transpilers allowed developers to use new language features while old browsers were still in use.
>
> Each tool reduced one kind of complexity by adding another.

### Complexity as evidence of success

> The modern toolchain is partly the scar tissue of early mistakes.
>
> It is also evidence that the Web was worth adapting. People kept forcing larger applications into the browser because sending software by sending an address was too useful to give up.

### Bridge to the browser-shaped computer

> Once a document could contain a program, the boundary began to move.
>
> Pages became applications. Applications gained storage, networking, graphics, audio and access to devices.
>
> The browser did not replace the operating system in one step. It learned the operating system’s tricks one by one.

### Netscape lost; the idea won

> Netscape lost the browser war and eventually disappeared.
>
> Its larger wager survived.
>
> The browser became the place where software arrived, ran and found its users. The company lost. The idea won.
