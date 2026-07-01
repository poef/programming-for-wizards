---
tags: programming for wizards
---
# Architecture

This chapter is a bit different. I won't start with the roots of Architecture. Instead I'll quote a wizard you've heard about before, Alan Kay: 

> A 500 foot high Egyptian pyramid took hundreds of thousands of workers several decades to construct. They piled up material brick on brick then finished the outside with a smooth layer of limestone. By contrast, the 1000 foot high Empire State Building was constructed from scratch in less than 11 months by less than 3000 workers. Quite a bit of today's software and its construction process resemble the Egyptian pyramid, but I would dare say that no one currently knows how to organize 3000 programmers to make a major piece of software from scratch in less than 11 months.

While the quote is from a [2001 foreword to a book about Squeek](http://guzdial.cc.gatech.edu/squeakbook/AlansForeword.html), the state of the art in software design or architecture has not moved significantly.

There are lots and lots of articles and blog posts and books written about software architecture. But they do not rise to the level of science. They are stories, anecdotes. "I did this, and it was successfull." The truth is, we don't know how to design software, at least not on a large scale.

This chapter is no different. But I will try anyway.

## On pyramids and arches

I used to think that the word Architecture had its roots in the word Arch, which had its roots in Arc. Unfortunately the world is not this simple or elegant. However, I still maintain that real architecture started with arches, or roman arches.

Before the advent of true architecture, all we knew to do was piling stones on top of each other. Some impressive piling was done, to be sure. But the knowledge and tools to use the properties of the stones to maximum advantage was not there.

The egyptians build some impressive pyramids. We still don't quite know how they pulled it off. There are some untested theories, which will have to wait untill scientists get more access again. But in essence, a pyramid is just a more advanced way of piling stones.

The roman arch is something else. To appreciate its ingenuity and usefullness, not to mention its longevity, just look at all the buildings, bridges and aquaducts they, the romans, left behind. The arch was invented earlier, but not used as effectively and as wide untill roman times. Again, the romans were good at spotting good ideas and stealing them. And improving on them.

With the same knowledge about the strong and weak points of stones, and the challenges the world throws up in the form of gravity and earth quakes, we later build cathedrals, bridges and giant domes. These were much cheaper and faster to build then pyramids, and were much more useful as well.

Later on we learned to use better materials and tools, that allowed us to build [some](https://en.wikipedia.org/wiki/Millau_Viaduct) [truly](https://en.wikipedia.org/wiki/Burj_Khalifa) [mind-blowing](https://www.dezeen.com/2019/09/26/zaha-hadid-architects-starfish-beijing-daxing-international-airport/) [constructions](https://en.wikipedia.org/wiki/Maeslantkering).

But while these projects are awe-inspiring, most architecture is much more mundane. The way houses are designed differs more by region than by time. In 1979 a wizard called Christopher Alexander published a book--"[The Timeless Way of Building](https://en.wikipedia.org/wiki/The_Timeless_Way_of_Building)"--where he advocated for a culture of architecture based on time-tested, local patterns. He called these "design patterns". And in an ironic twist of history software architects all over the world listened to his ideas and ran with it. While his peer architects mostly ignored or dismissed it.

These days no programmer is unaware of the concept of design patterns. I will not spend much time on them here, as more than enough has been said and written about them by smarter people than me.

## Software Arches

The original quote I started this chapter with, was from Alan Kay.
Alan Kay has since started (and finished) VPRI--[ViewPoints Research Institute](http://www.vpri.org/)--with the express aim to build a functioning software application, from the microcode on a CPU up through the operating system to a usable application with a GUI, in less than 20,000 lines of code.

In contrast, in 2020 the Linux Kernel reached 27.8 million lines of code, with 21,074 different contributors. And this is just the kernel. We're firmly in pyramid territory here.

Ultimately Alan Kay's VPRI failed to deliver on its promise. But not by much. It did show that it was possible to achieve its aim. By carefully crafted code, written by experts, in domain specific languages. Each part of the project first defined the language that would be most efficient to write the software in. Then they wrote that software.

[The results speak for themselves:](http://www.vpri.org/pdf/tr2007008_steps.pdf) 
> ... the entire apparatus of TCP/IP was
less than 200 lines of code. ... many TCP/IP packages run to 10,000 or 20,000 lines of code in C.

> the open source Cairo system (a comprehensibly done version of PostScript that is fast enough to be used for real-time interfaces) is about 44,000 lines of C code ... a hefty and speedy subset of Cairo in less than 500 lines of code. 

All this is possible because of the [OMeta parser language](http://www.vpri.org/pdf/tr2007003_ometa.pdf), which makes it efficient and easy to create new languages. The OMeta language can be expressed in itself in about 100 lines. Ometa is a variant of a ["Parsing Expression Grammar"](https://en.wikipedia.org/wiki/Parsing_expression_grammar) or PEG. There are many other PEG systems out there, for any language.

Given the results achieved I think that any concept of Software Architecture should have Domain Specific Languages in there somewhere. However, I'm not even close to calling this the Software Arch.

## Rustic Architecture

Going back to Christopher Alexander, can we get to a definition of software architecture that is more rustic, more related to his inventory of design patterns in use by local builders than the Architecture used by some of those awe-inspiring projects I showed earlier?

I think we can. But we must step back from the code a bit. It is easy to get lost in details and no-true-scotsman fallacies when discussing software design. So I'll use a few time-tested articles as inspiration.

The first one is called 'The rise of "Worse is Better"', by wizard Richard P. Gabriel. In it he argues that software that is objectively worse, actually wins in the marketplace. With the result that much of the software that we end up using is not as good as the software that could have been. We end up building on top of the worse software. And worse, the new generation of developers doesn't even know that things could have been better.

A wizard called Eric S. Raymond, later in 1997 wrote 'The Cathedral and the Bazaar', from a different perspective. In it Eric describes two filosophies of software design. One he equates with the Cathedral, it is carefully designed up front and then built according to plan. This stands for most commercial software built upto then. In contrast, he equates the emerging open source movement, and its software, with the Bazaar. There is no grand centralized plan, these is only anarchy. But it is a constructive anarchy. Because there is no central grand plan, the Bazaar reacts to changing circumstances instantly. And the bazaar wins in the marketplace because, while its solutions aren't ideal, or even very good, the solutions are there. The Cathedral approach cannot deliver good-enough solutions in the same timescale as the Bazaar.

Ultimately both papers argue the same point. A working good-enough solution now is always better than a perfect solution sometime in the future.

I think there may be another Wizards Rule here:
> Perfect is the enemy of good enough.

But if you take a look at the Linux Kernel, it is very difficult to argue that it resembles the bazaar. It has much more features of the Cathedral approach. There's an enormous amount of code, that is carefully crafted to work together, according to a plan laid out and checked by a single chief architect--Linus Torvalds, another influential wizard.

Yet Linux, and the whole OpenSource movement, is the poster-child for the Bazaar approach, as well as 'Worse is Better'. What is going on?

## Scale and Change















