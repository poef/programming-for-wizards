---
tags: programming for wizards
---

# The Web: the shape of words

A URL can point to a document, but once the browser gets there, how does it know what to show you? This is where the Web reveals another invention made mostly from stolen goods: HTML, or HyperText Markup Language.

I've written about hypertext and language before, but what is markup doing here? It's been around longer than you might think, certainly longer than computers, and maybe even longer than the printing press.

Markup is simply an additional marking on a document, used to give it extra meaning. The general idea is now called a [markup language](https://en.wikipedia.org/wiki/Markup_language). A [brief history of document markup](https://chnm.gmu.edu/digitalhistory/links/pdf/chapter3/3.19a.pdf) gives the old trade version of this nicely. The most common use of markup, pre-computer era, was in [letterpress printing](https://en.wikipedia.org/wiki/Letterpress_printing) and later [offset printing](https://en.wikipedia.org/wiki/Offset_printing) as well. Here an editor added markup, using a pen or pencil, to a document before sending it to a typesetter. The typesetter was a person tasked with creating the page out of movable type, physical metal blocks containing a single letter or glyph.

<figure><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Metal_movable_type.jpg/1920px-Metal_movable_type.jpg">
    <caption>An example of movable type</caption>
</figure>

The editor added markup to tell the typesetter what font and font size to use, as well as other layout decisions.

When the first computers came around, they were very limited in the kind of output they could create. If there was a printer attached, it would generally be a typewriter-style printer.

Once the output devices gained more capabilities, their manufacturers quickly realized a need to somehow instruct these devices how to display or output text.

The biggest problem was how to create better printed output. Early on, the only way to get decent printed output, was to add a typesetter system to your computer. Such a typesetter was itself a complex computer, combined with a system similar to copiers. The typesetter could be instructed to use specific fonts and font sizes. It had a complex API you could use to do this. But each system had its own, vendor-specific API and software.

The wizards at Bell Labs, who were busy inventing Unix, were not impressed. They wanted their Unix and C manuals to be nicely typeset, without having to fiddle around. So they invented [`troff`](https://en.wikipedia.org/wiki/Troff), one of the earliest markup languages. It is still in use today, any Unix system has a built-in manual system, called `man`. And all manual pages are marked up with a `troff` descendant.

Another wizard, called Knuth, wanted to write a book about programming. Well actually, he wanted to write *the* book on programming. In 1962 he was approached by Addison-Wesley about writing a book about compiler design. But he [enlarged the scope a bit](https://en.wikipedia.org/wiki/The_Art_of_Computer_Programming). The first three parts of a proposed seven part series, were typeset and published by 1973. However, the typesetting instructions for the first books were no longer usable, since the typesetting systems had changed by that time. Clearly that was unacceptable to a proper wizard like Knuth.

So in 1974 he took some time off to develop his own, better, typesetting system. That hiatus turned out to be 11 years and resulted in the [TeX](https://tug.org/whatis.html) system. An extension of that system, called [LaTeX](https://www.latex-project.org/), is still the preferred system to deliver scientific and mathematical articles to science magazines. It is also one of very few programs which are very likely bug-free. One of the reasons for this may be gleaned from this quote by Knuth: _"... one of TEX’s principal advantages is the fact that it does not change "_

Both `troff` and TeX use markup languages specifically to typeset documents before putting them on paper. As such they are not so much interested in declaring the meaning of content, just the styling.

This is where things get interesting. Sometime in the 1970s some wizards from IBM created a system called [GML](https://en.wikipedia.org/wiki/IBM_Generalized_Markup_Language). This either means Generalized Markup Language, or it might mean Goldfarb, Mosher and Lorie, who were the aforementioned wizards. Here is an example of a text with GML markup:

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

Unfortunately their work only made it out of IBM as a product you could buy and use, somewhere at the end of the 1980s. So the award for one of the first released markup languages that described the meaning--the semantics--of a text goes to [Scribe](http://www.columbia.edu/cu/computinghistory/scribe.pdf) in 1980. But we did not end up in a Scribe world, so I'll leave it there and return to GML.

GML eventually turned into [SGML--Standard Generalized Markup Language](https://en.wikipedia.org/wiki/Standard_Generalized_Markup_Language), which became an industry standard in 1986. And in 1989, when Sir Tim looked around for a markup language for the Web, he found SGML as a well-defined standard. SGML itself had no tags, it just described how you could create your own document format or DTD--Document Type Definition. This was clearly too complex. However the original GML did have tags, nice and short ones. So [HTML](https://html.spec.whatwg.org/) was born out of a combination of SGML and GML.

Here is that first HTML page again:

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

This is not an SGML document, it doesn't have a DTD header. Later HTML would become compliant with SGML, at least until [HTML5](https://html.spec.whatwg.org/multipage/introduction.html#history-2) was released.

It does use the same syntax to differentiate between markup and content. All markup tags are enclosed in `<` and `>` characters.

Let's take a closer look at the reasons behind this format. One of the goals of the web was to make HTML easy to write using an ordinary text editor. That means the source itself had to remain readable. Named closing tags make it clear which element is ending.

Imagine an HTML version without named end tags, something like this:

```
<strong>This is an </em>example</> text</>
```

This is technically feasible, maybe even simpler. However, for a human this is much more difficult to read. And crucially, it is so much easier to make errors, errors that the browser won't be able to recover from.

Another consequence of the chosen format is that some characters cannot be used in the content anymore. Clearly the `<` character now has a special meaning. And so have the `>` and `"` characters. HTML solves this by allowing you to encode special characters with a special format:

- `<` as `\&lt;`
- `>` as `\&gt;`
- `"` as `\&quot;`

However, now we've added the `&` character to the list of special characters as well. This is easily solved:

- `&` as `&amp;`

And these are the basics of HTML.

Now for the tricky parts. As you've seen, HTML has elements that have a start and end tags. This means you can enclose other tags, or nest them. You cannot overlap tags. The following example is incorrect use of HTML:

```html
<strong>This is a strong <em>and partially emphasized</strong> text</em>
```

Instead, you are supposed to write this:

```html
<strong>This is a strong <em>and partially emphasized</em></strong><em> text</em>
```

And this HTML can be represented as a tree structure:

- strong
  - This is a strong
  - em
    - and partially emphasized
- em
  - text 

This is how your web browser understands this HTML. Most modern browsers allow you to take a look at this structure, by pressing `<ctrl> <shift> i`. Or you can right-click on a web page and select "inspect". There you will see a complete representation of the HTML content, as a tree. This is also called the [DOM or Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

The HTML specification forces you to create a tree structure of your document. There can be no overlapping markup.

This tree structure does have benefits. You can also write the above HTML as follows:

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

And it would render the same. The tree structure is now made visible by the level of indentation in the source. This is now common practice when manually editing HTML. The indentation makes it much easier to see if your closing tags line up with your opening tags.

To make this work, web browsers apply what is called [white-space collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_text/Whitespace). In general, any time you add multiple white-space characters in your content, the browser reads this as 'add one space please'.

For example, both lines in the example below will line out perfectly:

```htmlembedded=
This renders exactly the same.<br>
   This    renders exactly    the      same.
```

Even the extra 3 spaces at the start of the second line do not show up.

Now if you really want to open a can of worms, try writing a rich text editor, with full [_WYSIWYG_](https://en.wikipedia.org/wiki/WYSIWYG) (What-You-See-Is-What-You-Get) capabilities, using HTML. Modern browsers have such an editor included. You can start one just by entering something like this with the [`contenteditable`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable) attribute:

```htmlembedded=
<div contenteditable=true>
    Type here
</div>
```

However, what you are seeing is an editor, designed by Microsoft originally for Internet Explorer 5.5, with an API that is derived from WordPad. Its capabilities are dreadfully limited. And yet there is no improved version. The [WHATWG](https://whatwg.org/), the group now in charge of the HTML specification, started a special workgroup to create an improved standard for `contenteditable`, but this workgroup disbanded after years of trying to create something better.

The only successful in-browser editors, that are capable of editing any HTML and deliver a good end result, such as clean HTML, do so by switching away from HTML. Instead they use a different underlying editing format. They convert the HTML to that, then allow you to edit it, and when you press save it is converted back to HTML again.

This is a good lesson to learn: just because something looks simple doesn't mean it is. All choices have consequences. If you're careful, you can decide which ones you want to live with.

> **Wizard's fifth rule**
>
> Choose what haunts you.
