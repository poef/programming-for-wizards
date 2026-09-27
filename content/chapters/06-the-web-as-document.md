---
tags: programming for wizards
---

# The Web: the shape of words

<!-- paragraph-id: p-06-a-url-can-point-to-a-document-but -->
A URL can point to a document, but once the browser gets there, how does it know what to show you? This is where the Web reveals another invention made mostly from stolen goods: HTML, or HyperText Markup Language.

<!-- paragraph-id: p-06-ive-written-about-hypertext-and-language-before-but -->
We've met hypertext and language already, but what is markup doing here? It's older than you might think. Certainly older than computers.

<!-- paragraph-id: p-06-markup-is-simply-an-additional-marking-on-a -->
Markup is simply extra marking on a document that tells someone what to do with it. Before computers, it belonged to the print trade (here is a [brief history of document markup](https://chnm.gmu.edu/digitalhistory/links/pdf/chapter3/3.19a.pdf)). In [letterpress](https://en.wikipedia.org/wiki/Letterpress_printing) and later [offset printing](https://en.wikipedia.org/wiki/Offset_printing), an editor marked up a manuscript with a pencil before sending it to the typesetter: a person who built each page out of movable type, small metal blocks each carrying a single letter or glyph.

<!-- image-id: image-06-1920px-metalmovabletype-jpg -->
<figure><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Metal_movable_type.jpg/1920px-Metal_movable_type.jpg" alt="Metal movable type set in a composing stick">
    <figcaption>An example of movable type</figcaption>
</figure>

<!-- paragraph-id: p-06-the-editor-added-markup-to-tell-the-typesetter -->
The markup told the typesetter which font and size to use, and made the other layout decisions.

<!-- paragraph-id: p-06-the-biggest-problem-was-how-to-create-better -->
Early computers printed like typewriters. If you wanted decent printed output, you attached a phototypesetter: a complex machine of its own that could be told which fonts and sizes to use. Each one had its own vendor-specific commands and software.

<!-- paragraph-id: p-06-the-wizards-at-bell-labs-who-were-busy -->
The wizards at Bell Labs, who were busy inventing Unix, were not impressed. They wanted their Unix and C manuals nicely typeset without fiddling with the machine. So they wrote [`troff`](https://en.wikipedia.org/wiki/Troff), one of the earliest markup languages for computers. It is still with us: every Unix system has a manual command, `man`, and its pages are marked up in a `troff` descendant.

<!-- paragraph-id: p-06-another-wizard-called-knuth-wanted-to-write-a -->
Another wizard, [Donald Knuth](https://en.wikipedia.org/wiki/Donald_Knuth), wanted to write a book about programming. Well, actually, he wanted to write *the* book on programming. In 1962 Addison-Wesley asked him for a book on compilers, and he [enlarged the scope a bit](https://en.wikipedia.org/wiki/The_Art_of_Computer_Programming): a planned seven volumes, the first three published by 1973. Then the publisher switched from hot-metal type to phototypesetting, and the proofs of a new edition came back looking terrible. Clearly that was unacceptable to a proper wizard.

<!-- paragraph-id: p-06-so-in-1974-he-took-some-time-off -->
So in 1977 he set the books aside to write his own typesetting system. He expected it to take a few months. It took the better part of a decade, and produced [TeX](https://tug.org/whatis.html). Built on top of it, [LaTeX](https://www.latex-project.org/) is still how many mathematicians, physicists and computer scientists write their papers. TeX itself is famously close to bug-free, partly because Knuth froze it. Its version number no longer grows; it just adds another digit of π.

<!-- paragraph-id: p-06-both-troff-and-tex-use-markup-languages-specifically -->
Both `troff` and TeX exist to put documents on paper. Their markup says how the text should look, not what it is.

<!-- paragraph-id: p-06-this-is-where-things-get-interesting-sometime-in -->
This is where things get interesting. In 1969, three IBM wizards, Goldfarb, Mosher and Lorie, created [GML](https://en.wikipedia.org/wiki/IBM_Generalized_Markup_Language). Officially it stands for Generalized Markup Language. It also happens to spell their initials. GML described what each part of a text *was*: a heading, a paragraph, a list item. How it should look was left to someone else. Here is an example:

<!-- code-id: code-06-gml-h1-chapter-1-introduction -->
```GML
:h1.Chapter 1:  Introduction
:p.GML supported hierarchical containers, such as
:ol.
:li.Ordered lists (like this one),
:li.Unordered lists, and
:li.Definition lists
:eol.
as well as simple structures.
:p.Markup minimization (later generalized and formalized in SGML),
allowed the end-tags to be omitted for the "h1" and "p" elements.
```

<!-- paragraph-id: p-06-gml-eventually-turned-into-sgml-standard-generalized-markup -->
GML grew into [SGML--the Standard Generalized Markup Language](https://en.wikipedia.org/wiki/Standard_Generalized_Markup_Language), which became an international standard in 1986. SGML itself has no tags. It is a language for defining your own document formats. Powerful, and far too heavy for what Sir Tim needed. But CERN already had a simple SGML format of its own, with short tags inherited from GML: `h1`, `p`, `ol`, `li`. [HTML](https://html.spec.whatwg.org/) borrowed them. Stolen goods, once again.

<!-- paragraph-id: p-06-here-is-that-first-html-page-again -->
Here is the page from the previous chapter again:

<!-- code-id: code-06-html -->
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

<!-- paragraph-id: p-06-this-is-not-an-sgml-document-it-doesnt -->
It is not a proper SGML document. Later versions of HTML did follow SGML, until [HTML5](https://html.spec.whatwg.org/multipage/introduction.html#history-2).

<!-- paragraph-id: p-06-it-does-use-the-same-syntax-to-differentiate -->
It does use the SGML way of separating markup from content: every tag sits between `<` and `>`.

<!-- paragraph-id: p-06-lets-take-a-closer-look-at-the-reasons -->
Why this format? One goal of the Web was that anyone could write HTML in an ordinary text editor. So the source had to stay readable. Named closing tags make it clear which element is ending.

<!-- paragraph-id: p-06-imagine-an-html-version-without-named-end-tags -->
Imagine an HTML version without named end tags, something like this:

<!-- code-id: code-06-code-this-is-an-example-text -->
```
<strong>This is an <em>example</> text</>
```

<!-- paragraph-id: p-06-this-is-technically-feasible-maybe-even-simpler-however -->
This is technically possible, maybe even simpler. But it is much harder for a human to read. And crucially, it is much easier to make mistakes, mistakes the browser can't recover from.

<!-- paragraph-id: p-06-another-consequence-of-the-chosen-format-is-that -->
Another consequence of the format is that some characters can no longer be used freely in the content. `<` now has a special meaning, and so do `>` and `"`. HTML solves this with character references, another escape:

- `<` as `&lt;`
- `>` as `&gt;`
- `"` as `&quot;`

<!-- paragraph-id: p-06-however-now-weve-added-the-character-to-the -->
But now `&` has become special as well. Easily solved:

- `&` as `&amp;`

<!-- paragraph-id: p-06-and-these-are-the-basics-of-html -->
And these are the basics of HTML.

<!-- paragraph-id: p-06-now-for-the-tricky-parts-as-youve-seen -->
Now for the tricky parts. As you've seen, HTML elements have start and end tags. That means elements can contain other elements: you can nest them. But you cannot overlap them. This is incorrect HTML:

<!-- code-id: code-06-html-this-is-a-strong-and-partially-emphasized -->
```html
<strong>This is a strong <em>and partially emphasized</strong> text</em>
```

<!-- paragraph-id: p-06-instead-you-are-supposed-to-write-this -->
Instead, you are supposed to write this:

<!-- code-id: code-06-html-this-is-a-strong-and-partially-emphasized-2 -->
```html
<strong>This is a strong <em>and partially emphasized</em></strong><em> text</em>
```

<!-- paragraph-id: p-06-and-this-html-can-be-represented-as-a -->
And this HTML can be represented as a tree structure:

- strong
  - This is a strong
  - em
    - and partially emphasized
- em
  - text 

<!-- paragraph-id: p-06-this-is-how-your-web-browser-understands-this -->
This is how your web browser understands the HTML. Most browsers let you look at this structure: press `<ctrl> <shift> i`, or right-click on a page and choose "Inspect". You will see the whole page as a tree. This tree is called the [DOM, or Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

<!-- paragraph-id: p-06-the-html-specification-forces-you-to-create-a -->
HTML forces your document into a tree. There can be no overlapping markup.

<!-- paragraph-id: p-06-this-tree-structure-does-have-benefits-you-can -->
This tree structure does have benefits. You can also write the above HTML as follows:

<!-- code-id: code-06-html-2 -->
```htmlembedded=
<strong>
    This is a strong 
    <em>
        and partially emphasized
    </em>
</strong>
<em>
    text
</em>
```

<!-- paragraph-id: p-06-and-it-would-render-the-same-the-tree -->
And it would render the same. The indentation makes the tree visible in the source, and makes it much easier to check that closing tags line up with opening tags. Most people who write HTML by hand do this.

<!-- paragraph-id: p-06-to-make-this-work-web-browsers-apply-what -->
This works because browsers apply [white-space collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_text/Whitespace). In general, any run of spaces, tabs and line breaks in your content is read as 'one space, please'.

<!-- paragraph-id: p-06-for-example-both-lines-in-the-example-below -->
For example, these two lines render identically:

<!-- code-id: code-06-html-this-renders-exactly-the-same -->
```htmlembedded=
This renders exactly the same.<br>
   This    renders exactly    the      same.
```

<!-- paragraph-id: p-06-even-the-extra-3-spaces-at-the-start -->
Even the extra 3 spaces at the start of the second line do not show up.

<!-- paragraph-id: p-06-now-if-you-really-want-to-open-a -->
If you really want to open a can of worms, try writing a rich text editor in HTML, fully [_WYSIWYG_](https://en.wikipedia.org/wiki/WYSIWYG) (What-You-See-Is-What-You-Get). Browsers even include one. The [`contenteditable`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable) attribute turns it on:

<!-- code-id: code-06-html-3 -->
```htmlembedded=
<div contenteditable=true>
    Type here
</div>
```

<!-- paragraph-id: p-06-however-what-you-are-seeing-is-an-editor -->
What you get is an editor Microsoft designed for Internet Explorer 5.5, which other browsers then copied, quirks and all. Its capabilities are dreadfully limited, and the HTML it produces differs from browser to browser. Standards groups have spent years trying to specify something better. Those efforts stalled.

<!-- paragraph-id: p-06-the-only-successful-in-browser-editors-that-are -->
The in-browser editors that do work well, and produce clean HTML, mostly avoid editing HTML directly. They convert the document to a different model of their own, let you edit that, and convert it back to HTML when you save.

<!-- paragraph-id: p-06-this-is-a-good-lesson-to-learn-just -->
The lesson: just because something looks simple doesn't mean it is. All choices have consequences. If you're careful, you can decide which ones you want to live with.

<!-- rule-id: rule-06-wizards-fifth-rule -->
> **Wizard's fifth rule**
>
> Choose what haunts you.
