---
tags: programming for wizards
---

# HTML: choosing a tree

What shape should a document have?

The question sounds harmless. A document is just text, right? Perhaps text with some headings, links, emphasis, images, lists. But as soon as you want the computer to understand those things, you must choose a shape.

HTML chose a tree.

That choice made the Web easy enough to write by hand, easy enough for browsers to recover from mistakes, and structured enough for programs to inspect. It also made some things surprisingly difficult.

> **Interactive exhibit placeholder: `html-chooses-a-tree`**
>
> Let the reader select overlapping ranges in a sentence, for example bold from character 1 to 15 and comment from character 8 to 25. Try to encode the overlap as HTML and show why the tree breaks. Then show the same annotations as ranges. The point is not that HTML is bad; the point is that every representation has consequences.

As I've written in part 1 of this chapter, in 1989 a wizard called Tim invented the World-Wide Web and changed the world forever. The first, and I think most important part, was the invention of the URL. But another invention was HTML - or HyperText Markup Language.

I've talked about HyperText in part 1, so I'll focus on the Markup Language part here. Markup has been around longer than you might think, certainly longer than computers, and maybe even longer than the printing press.

A 'markup' is simply an additional marking on a document, added to add extra meaning. The most common use of markup, pre-computer era, was in [letterpress printing](https://en.wikipedia.org/wiki/Letterpress_printing) and later [offset printing](https://en.wikipedia.org/wiki/Offset_printing) as well. Here an editor added markup, using a pen or pencil, to a document before sending it to a typesetter. The typesetter was a person tasked with creating the page out of movable type, physical metal blocks containing a single letter or glyph.

<figure><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Metal_movable_type.jpg/1920px-Metal_movable_type.jpg">
    <caption>An example of movable type</caption>
</figure>

The editor added markup to tell the typesetter what font and font size to use, as well as other layout decisions.

When te first computers came around, they were very limited in the kind of output they could create. If there was a printer attached, it would generally be a typewriter style printer.

Once the output devices gained more capabilities, their manufacturers quickly realized a need to somehow instruct these devices how to display or output text.

One application was on how and where to display text on terminal screens. From this we ultimately end up with ANSI codes, based on the DEC (Digital Equipment Corporation) VT-100 line of terminals. This is still in use in most command shell programs. But it has no direct influence on HTML, so I'll skip the history here.

The other, more relevant application, was to create better printed output. Early on, the only way to get decent printed output, was to add a typesetter system to your computer. Such a typesetter was itself a complex computer, combined with a system similar to copiers. The typesetter could be instructed to use specific fonts and font sizes. It had a complex API you could use to do this. But each system had its own, vendor specific API and software.

The wizards at Bell Labs, who were busy inventing Unix, were not impressed. They wanted their Unix and C manuals to be nicely typeset, without having to fiddle around. So they invented `troff`, one of the earliest markup languages. It is still in use today, any Unix system has a built-in manual system, called `man`. And all manual pages are marked up with a `troff` descendant.

Another wizard, called Knuth, wanted to write a book about programming. Well actually, he wanted to write *the* book on programming. In 1962 hew as approached by Addison-Wesley about writing a book about compiler design. But he [enlarged the scope a bit](https://en.wikipedia.org/wiki/The_Art_of_Computer_Programming). The first 3 parts - of a proposed 7 part series, were typeset and published by 1973. However, the typesetting instructions for the first books were no longer usable, since the typesetting systems had changed by that time. Clearly that was unacceptable to a proper wizard like Knuth.

So in 1974 he took some time off to develop his own, better, typesetting system. That hiatus turned out to be 11 years and resulted in the TeX system. An extension of that system, called LaTeX, is still the preferred system to deliver scientific and mathematical articles to science magazines. It is also one of very few programs which are very likely bug-free. One of the reasons for this may be gleaned from this quote by Knuth: _"... one of TEX’s principal advantages is the fact that it does not change "_

Both `troff` and TeX use markup languages specifically to typeset documents before putting them on paper. As such they are not so much interested in declaring the meaning of content, just the styling.

This is were things get interesting. Sometime in the 1970's some wizards from IBM created a system called GML. This either means Generalized Markup Language, or it might mean Goldfarb, Mosher and Lorie, who were the aforementioned wizards. Here is an example of a text with GML markup:

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

Unfortunately their work only made it out of IBM as a product you could buy and use, somewhere at the end of the 1980's. 

So the award for the first released markup language that described the meaning--the semantics--of a text goes to [Scribe](http://www.columbia.edu/cu/computinghistory/scribe.pdf) in 1980. At the time a wizard called Brian K. Reid, was a student at the department of computer science at Columbia University, USA. He created what he called _"A Document Specification Language and its Compiler"_, as his final dissertation. The resulting software we now know as Scribe.

Here is a sample of a text marked up with Scribe:

```scribe
@Heading(Cranberry Bread)

@Begin(Quotation) And pretty much anything (and I 
 mean @i"anything") could go inside. @End(Quotation)
```

GML eventually turned into [SGML--standard generalized markup language](https://en.wikipedia.org/wiki/Standard_Generalized_Markup_Language), which became an industry standard around 1983. And in 1989, when sir Tim looked around for a markup language for the Web, he found SGML as a well-defined standard. SGML itself had no tags, it just described how you could create your own document format or DTD--Document Type Definition. This was clearly too complex. However the original GML did have tags, nice and short ones. So HTML was born out of a combination of SGML and GML.

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

This is not an SGML document, it doesn't have a DTD header. Later HTML would become compliant with SGML, at least until HTML5 was released.

It does use the same syntax to differentiate between markup and content. All markup tags are enclosed in `<` and `>` characters.

Let's take a closer look at the reasons behind this format. One of the main goals of the web was to make it easy for people to write HTML documents. There was no special editor. Unlike the word processors people use today, you wrote HTML as source code. You used a standard text editor. The webbrowser would render that source code, but it wasn't an editor itself.

This means that the source code should be human readable. So, to make the structure more clear, a markup had a start and an end tag. This made it easy to see which markup ended where. Imagine an HTML version without named end tags, something like this:

```
<strong>This is an </em>example</> text</>
```

This is technically feasible, maybe even easier. However, for a human this is much more difficult to read. And crucially, it is so much easier to make errors, errors that the browser won't be able to recover from.

Another consequence of the chosen format is that some characters can not be used in the content anymore. Clearly the `<` character now has a special meaning. And so have the `>` and `"` characters. HTML solves this by allowing you to encode special characters with a special format:

- `<` as \&lt;
- `>` as \&gt;
- `"` as \&quot;

However, now we've added the `&` character to the list of special characters as well. This is easily solved:

- `&` as `&amp;`

And these are the basics of HTML.

Now for the tricky parts. As you've seen, HTML has elements that have a start and end tag. This means you can enclose other tags, or nest them. You cannot overlap tags. The following example is incorrect use of HTML:

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

This is how your webbrowser understands this HTML. Most modern browsers allow you to take a look at this structure, by pressing `<ctrl> <shift> i`. Or you can right-click on a web page and select "inspect". There you will see a complete representation of the HTML content, as a tree. This is also called the DOM or Document Object Model.

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

And it would render the same. The tree structure is now made visible by the level of indenting in the source. This is now common practice when manually editing HTML. The indentation makes it much easier to see if your closing tags line up with your opening tags.

To make this work, web browsers apply what is called white-space collapsing. In general, any time you add multiple white-space characters in your content, the browser reads this as 'add one space please'.

For example, both lines in the example below will line out perfectly:

```htmlembedded=
This renders exactly the same.<br>
   This    renders exactly    the      same.
```

Even the extra 3 spaces at the start of the second line do not show up.

However, there is another tricky complication. Take the following HTML:

```htmlembedded=
<ul>
    <li>
        one
    </li>
    <li>
        two
    </li>
    <li>
        three
    </li>
</ul>
```

This renders like this:
<ul>
    <li>
        one
    </li>
    <li>
        two
    </li>
    <li>
        three
    </li>
</ul>

But if I change the list items to render as _inline_ elements, instead of _block_ elements, you get this:
<style>
    .list-inline {
        padding: 0 !important;
        margin-left: 0;
    }
    .list-inline li {
        display: inline;
        margin: 0;
        padding: 0
    }
</style>
<ul class="list-inline">
    <li>
        one
    </li>
    <li>
        two
    </li>
    <li>
        three
    </li>
</ul>

Let's change the markup to this instead:
```htmlembedded=
<ul><li>one</li><li>two</li><li>three</li></ul>
```

There is no change in the normal rendering, as each item is a block element:

<ul><li>one</li><li>two</li><li>three</li></ul>

But now here it is inline:

<ul class="list-inline"><li>one</li><li>two</li><li>three</li></ul>

And there is no space between the items anymore.

Finally if you really want to open a can of worms, try writing a rich text editor, with full _WYSIWYG_ (What-You-See-Is-What-You-Get) capabilities, using HTML. Modern browsers have such an editor included. You can start one just by entering something like this:

```htmlembedded=
<div contenteditable=true>
    Type here
</div>
```

However, what you are seeing is an editor, designed by Microsoft originally for Internet Explorer 5.5, with an API that is derived from WordPad. Its capabilities are dreadfully limited. And yet there is no improved version. The What-wg, the group now in charge of the HTML specification, have created a special workgroup to create an improved standard for `contenteditable`, but this workgroup has disbanded itself after years of trying to create something better.

The only succesful in-browser editors, that are capable of editing any HTML and deliver a good end result--as in: clean HTML--, do so by switching away from HTML. Instead they use a different underlying editing format. They convert the HTML to that, then allow you to edit it, and when you press save it is converted back to HTML again.

This is a good lesson to learn: Just because it looks simple, doesn't mean it is. All choices have consequences. The less choices you make, the less consequences will haunt you.

 









---
https://nofluffjuststuff.com/blog/douglas_crockford/2007/06/scribe
https://dbpedia.org/page/Scribe_(markup_language)
http://www.columbia.edu/cu/computinghistory/scribe.pdf
https://nofluffjuststuff.com/blog/douglas_crockford/2007/06/scribe
https://en.wikipedia.org/wiki/Markup_language

https://chnm.gmu.edu/digitalhistory/links/pdf/chapter3/3.19a.pdf

> **Wizard move**
>
> Every format is a bet about the shape of future problems. HTML bet on trees. It was a very good bet, but not a free one.
