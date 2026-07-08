---
tags: programming for wizards
---

# Architecture: arches, pyramids, and change

Open a modern web project and ask a simple question:

What does it take to show one useful page?

Sometimes the answer starts with a folder called `node_modules`.

This folder may contain more files than the program you are writing by several orders of magnitude. It may contain packages used by packages used by packages whose names sound like kitchen utensils, inside jokes, or tiny acts of revenge. None of this is automatically bad. Most of those pieces are there because someone solved a real problem and shared the solution.

Still, when your own code is a handful of files and the supporting pile is large enough to need archaeology, it is fair to ask what kind of structure we are building.

Alan Kay once compared modern software to pyramid building:

> "If you look at software today, through the lens of the history of engineering, it's certainly engineering of a sort--but it's the kind of engineering that people without the concept of the arch did. Most software today is very much like an Egyptian pyramid with millions of bricks piled on top of each other, with no structural integrity, but just done by brute force and thousands of slaves."

This is a cruel image, but not an empty one.

A pyramid is not stupid. It works. If you need height and you do not have a better structural trick, piling up stone is a reasonable plan. Many software piles work too. The page loads. The users click the button. The invoice is sent. The business continues.

But a pyramid gets height by adding mass.

An arch gets height by arranging force.

That is the useful part of the metaphor. The arch does not make gravity go away. It does not make stone lighter. It changes the arrangement so the pressure that might have crushed the structure becomes part of what holds it up.

So the software question is not:

How do we make a prettier diagram?

The question is:

What are we carrying, and is there a better way to carry it?

## The pile

Software is very good at becoming a pile.

You start with a page.

Then the page needs a route. Fine. Then it needs a little state, because of course it does. Someone has to log in. Someone else has to be refused politely. The database needs a migration. The build needs a build of its own. A background job appears, because sending email during a request feels rude. Later, at 03:17, that job stops working for reasons known only to the logs.

So you add better logs.

Again, none of these things are foolish by themselves. Most software mass arrives one sensible decision at a time.

This is why software piles are so hard to see while they are forming. Nobody says, "Today I will make this system too heavy to understand." They say, "We need one more thing."

And often they are right.

The trouble starts when every problem has the same answer: add another stone.

More code. More packages. More services. More configuration. More process. More meetings to keep the process coordinated. More diagrams explaining why the pile is not actually a pile but a carefully layered strategic platform.

Sometimes the pile is the correct answer. A pyramid is a valid structure. But if every new bit of height requires a larger base, then at some point you should at least wonder whether you are missing an arch.

## The arch

I used to think the word architecture came from arch, which came from arc, which would have been wonderfully convenient for this chapter. Unfortunately language refuses to arrange itself for our metaphors. It has its own work to do.

Still, real architecture begins when people stop only piling material and start using the forces inside the material.

The Egyptians built impressive pyramids. We still do not know every detail of how they did it. But the basic trick is visible from a distance: a lot of material, arranged so the weight above is carried by the mass below.

The Roman arch is a different answer to the same pressure. The arch existed before the Romans, but the Romans were very good at spotting useful ideas, stealing them, improving them, and repeating them with terrifying discipline. Bridges, aqueducts, gates, amphitheatres, bathhouses. Once you understand the arch, stone stops being only weight and starts becoming structure.

Nothing magical happened to the stone. Nobody negotiated with gravity. The builders just stopped treating weight as a reason to add more weight underneath.

That is the part of the metaphor I want to keep. A software arch would not be another layer on top of the pile. It would be a way of arranging the work so the forces that usually make software heavy have somewhere useful to go.

Which forces?

The boring ones, mostly. The customer who says, six months later, that when they said "archive" they did not mean "delete, but slower." The library that changes one small default and makes your clever shortcut look less clever. The screen that was supposed to be temporary, except people entered real data into it, so now it is historical record. The teammate who leaves and takes with them the memory of why the strange part is strange.

And then there is the future, which keeps arriving before the system is ready.

You can answer all of this by adding more stuff. More rules, more checks, more meetings, more glue code, more careful comments around the dangerous part. Sometimes that is exactly what you should do. A pile is not a sin.

But if the same kind of weight keeps returning, it is worth asking whether the system is saying things the hard way.

That is where language comes back into the story. Not language as decoration. Language as the shape that decides which thoughts are cheap, which mistakes are easy, and which bits of machinery have to be repeated until nobody remembers why.

## Change the language?

Alan Kay did not only complain about pyramids. He spent a good part of his career trying to build software that behaved less like one.

One later attempt came through the Viewpoints Research Institute, or [VPRI](http://www.vpri.org/). One of its projects asked an almost rude question:

How much software would it take to build a complete personal computing system if you refused to accept the usual piles?

Not just an app. A stack: graphics, networking, operating-system-like pieces, user interface, languages. The sort of thing that normally arrives with millions of lines of code and enough build machinery to make a calm person stare out of a window for a while.

The VPRI answer was the [STEPS project](http://www.vpri.org/pdf/tr2007008_steps.pdf). The numbers in the report are startling:

| Piece | STEPS version | Ordinary version |
| --- | ---: | ---: |
| TCP/IP | under 200 lines | 10,000 to 20,000 lines |
| Cairo-like graphics | under 500 lines | about 44,000 lines |

These are not neat one-for-one product comparisons. The point is the scale of the attempt. VPRI was not trying to shave a few percent off a familiar stack. It was asking whether the stack had been described in the wrong shape.

Your first reaction should be distrust.

Good. Distrust is healthy.

But your second reaction should be curiosity.

What changed? Did they merely hide the pile somewhere else? Or did they find an arch?

The trick was not simply writing cleverer C. VPRI treated language-making as an architectural tool.

Each domain got a small language fitted to that domain. The project did not ask one general-purpose language to express every idea directly. It built little notations, little interpreters, little worlds where the right ideas could be said compactly.

[OMeta](http://www.vpri.org/pdf/tr2007003_ometa.pdf) was one of the tools that made this style practical. It is a language for writing languages, based on ideas from [Parsing Expression Grammars](https://en.wikipedia.org/wiki/Parsing_expression_grammar). OMeta can describe itself in about a hundred lines, which is the kind of sentence that makes language people smile in a slightly worrying way.

But OMeta itself is not the arch.

Nor are DSLs automatically the arch. A bad little language is just a bad little language with extra ceremony. We have already seen this danger. Every program grows a language, whether you admit it or not. If the language fits the problem, the problem gets smaller. If the language fits only the author, everyone else gets a border crossing.

So where did the mass go?

Some of it went into the languages. Not vanished, exactly. More like folded. The repeated machinery became grammar. The annoying distinction became a word. The thing that used to take a page of careful code became a sentence in a smaller language.

That is the architectural move hiding inside the language trick.

You are not only deciding which modules talk to which other modules. You are deciding what the system is allowed to mean cheaply.

That can be an arch.

Not always. Sometimes it is just a private dialect with a README and a bad attitude. But when it works, the structure gets lighter because the right things have names.

## Better can still lose

There is a trap here.

Once you see a beautiful arch, you may start believing that the better structure should win. It should be smaller, clearer, more elegant, more powerful. It should arrive, explain itself politely, and replace the pile.

Software history does not have these manners.

Richard P. Gabriel wrote [*The Rise of "Worse is Better"*](https://www.dreamsongs.com/WorseIsBetter.html), an essay with a title that still makes programmers uncomfortable. The uncomfortable claim is that software that is in some ways worse can win because it is simpler, earlier, easier to spread, easier to implement, or easier to adapt.

Once it wins, everyone else builds on it.

Then the better idea is no longer competing with the original problem. It is competing with the installed world.

This is annoying, but it is not mysterious. A useful imperfect thing today changes what tomorrow needs. The perfect thing that arrives later may be perfect for a world that no longer exists.

This does not mean bad software is noble. It does not mean quality does not matter. It means timing is part of architecture.

Once something works, people start leaning on it. They write tutorials. They build wrappers. They save files in its format because that is the format the tool understands. Someone puts it in a build script. Someone else copies the build script. A year later, the rough edge is no longer a rough edge. It is compatibility.

An arch that arrives too late may be admired, studied, and ignored.

That is one reason software architecture is harder than it looks. You are not only arranging code. You are arranging code in time.

## The bazaar is not the opposite of architecture

Eric S. Raymond later wrote [*The Cathedral and the Bazaar*](http://www.catb.org/~esr/writings/cathedral-bazaar/cathedral-bazaar/), contrasting carefully planned cathedral-style development with the messy, adaptive energy of open source.

This image is useful, but it can also make people silly.

The bazaar is not good because it is messy. Mess by itself is just mess. Anyone who has tried to use an abandoned open source library with three competing forks and no working examples already knows this.

The useful part is that many people can react, repair, extend, and redirect the work while the world is still changing. But even a bazaar needs places to stand.

Someone has to be able to find the code. Someone has to know where a bug report goes. A patch needs somewhere to land, and someone grumpy enough to say no when it should not land there. The old argument about why the strange part is strange has to live somewhere better than one person's memory.

The Linux kernel is a good example because it refuses to be simple.

From far away, Linux is the bazaar. Open source. Many contributors. A system shaped by the work of thousands of people across the world.

From close up, it is not a picnic. It has maintainers, subsystems, rules, review, rituals, arguments, long memories, release cycles, mailing lists, and Linus Torvalds still looming over the whole thing like a weather system.

So is it a cathedral or a bazaar?

Yes.

That is the wrong question.

The useful question is whether the structure can keep changing without losing itself completely.

That is the force software architecture has to carry.

Change.

Not change as a slogan. Not change as a slide with arrows on it. Plain, inconvenient change. The kind that arrives after the names have been chosen, after the database has been filled, after someone has built their day around the thing working exactly as it works now.

## Being wrong without breaking everything

Software changes the world, and is changed by it.

Any useful program will eventually meet new machines, new uses, new libraries, new laws, new attacks, new expectations, and new mistakes. Users will do things the program did not expect. Other programs will depend on it in ways nobody planned. Someone will run it for longer than seems reasonable. Someone will put important data into the field you thought was temporary.

This is one of the fundamental differences between software and older engineering metaphors.

A building project can be late, expensive, and politically cursed, but the ground usually does not rewrite the laws of stone halfway through. Software has no such manners.

So architecture cannot mean certainty.

Certainty is too expensive, and usually fake.

Architecture is how you survive being wrong.

You will choose the wrong database sometimes. You will give a private thing a public name, or a public thing no name at all. You will build a pile where an arch might have worked, and sometimes you will build an arch nobody needs.

That is not a moral failure. It is what happens when you have to work before the future has finished introducing itself.

The question is whether being wrong breaks everything.

If one piece is wrong, can it be replaced without dragging half the system behind it? If the data has to move, did you leave it a door? If the language you invented is missing a word, can it grow without making all the old sentences meaningless?

The diagram may help. The vocabulary may help. Layers may help, if they are honest layers and not just lines drawn through a pile. But the thing you are really trying to preserve is the ability to change shape without becoming nothing.

> **Wizard's eleventh rule**
>
> You will be wrong. Try not to make it hurt.

If being wrong is normal, then a system cannot get all its answers from the room where it was designed.

Some answers arrive later, carried in by users, other tools, other communities, or people solving a problem you did not know your system would touch.

So the next question is not how to make a system clever enough to predict all of that.

It is how to make one open enough to benefit from work you did not control.

That is where the Web comes back into the story: not as something finished, but as shared ground we can still build on.
