---
tags: programming for wizards
---

# The knitted castle

Why does software get harder as it gets larger?

It is tempting to answer with a complaint about bad programmers, bad managers, bad requirements, bad frameworks, or bad luck. There is enough of all of that, of course. But the deeper answer is less comforting: complexity grows naturally.

You don't need to be stupid to create a knitted castle. You only need to keep adding useful things.

> **Interactive exhibit placeholder: `knitted-castle-vs-lego-castle`**
>
> Begin with five clean modules. Let the reader add features one by one. Each feature creates dependency threads. Then offer a different representation: stable boundaries, ports, small languages, derived data. The goal is not to remove all dependencies, but to make the kinds of dependencies visible.

The famous wizard Alan Kay once said:

> "Whatever we [in computing] do is more like what the Egyptians did. Building pyramids, piling things on top of each other." [(video)](https://www.tele-task.de/lecture/video/2772/)

I think the situation is more dire than that. We're not stacking bricks, [we're knitting castles](https://youtu.be/SxdOUGdseq4?t=1287).

Let's take a step back first. Go back to when you first discovered programming. I hope it isn't too hard to remember the heady first days, the unimaginable power you had to make a computer do your bidding, to create something entirely new.

Then, if you are like me, you got serious about writing software, your darling program grew up, grew big. And adding new features, or debugging existing ones, grew more and more difficult. Your guestimates more and more wildly off. Untill you, disgusted with your past self, decided to redo the whole thing from scratch, but this time doing it the Right Way(tm).

Even if you resisted the temptation to add stuff to your program, after building the first one, you find you have lots of ideas on how to create a much more capable, even impressive second version. And thus you fail to the [Second System effect.](https://en.wikipedia.org/wiki/Second-system_effect)

You cannot win. The problem is complexity. In software development it appears that growing complexity is a similarly harsh law as the [second law of thermodynamics.](https://en.wikipedia.org/wiki/Second_law_of_thermodynamics)

Most software projects at some point end up looking like this:

![A knitted castle](https://i.imgur.com/VuNPlRt.png)

While what we really want is something like this:

![A lego castle](https://i.imgur.com/72XbV8z.png)

So why don't we build software like that? Well, we're trying to, but we don't know how to build really re-usable building blocks. Re-usable components are difficult to create. In fact this is one of the triumphs of Javascript. The list of NPM packages you can use is intimidatingly large. However, you can't just plug in some library. You need to understand how to use it, what its API is, what its data model is, etc. etc.

This is because even NPM packages are still build more like the knitted castle than the lego castle. Each package can be re-used as a whole, but not so much broken apart and used partly, to create something entirely new.

> **Wizard move**
>
> Complexity is not only a matter of size. It is a matter of how many kinds of connections the reader must keep in their head.
