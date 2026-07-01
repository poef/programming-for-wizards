---
tags: programming for wizards
---
# Architecture: arches, pyramids, and change

Alan Kay once compared modern software to pyramid building:

> “If you look at software today, through the lens of the history of engineering, it’s certainly engineering of a sort—but it’s the kind of engineering that people without the concept of the arch did. Most software today is very much like an Egyptian pyramid with millions of bricks piled on top of each other, with no structural integrity, but just done by brute force and thousands of slaves.”

At first it sounds like the kind of thing software people say when they want to sound disappointed in the entire industry. Which, to be fair, is one of our oldest traditions.

But the metaphor is worth taking seriously.

A pyramid is not a stupid structure. It is an extremely successful one. If your goal is to build something large, stable, and hard to accidentally knock over, piling up an enormous amount of stone is a respectable strategy.

It is also a very expensive way to create height.

And a terrible way to create empty space.

An arch solves a different problem. It does not win by adding more material. It wins by arranging the material differently. The weight that might have made the structure collapse is redirected, shared, and turned into part of what keeps the structure standing.

That is the part Kay's metaphor points at.

Software is very good at piling up stones.

More code. More packages. More layers. More services. More configuration. More process. More diagrams explaining why the pile is actually carefully designed.

Sometimes the pile works. Pyramids do work. But if every new problem asks for more stone, more carrying, more coordination, and more explanation, then we should at least wonder whether we are missing an arch.

So the question for this chapter is:

What would a software arch look like?

> **Interactive exhibit placeholder: `pyramid-arch-bazaar`**
>
> Let the reader compare three growth strategies: pile-on pyramid, planned cathedral, adaptive bazaar. Add changing requirements over time. Show where each strategy absorbs change and where it cracks.

## Pyramids and arches

I used to think the word architecture had its roots in the word arch, which had its roots in arc. Unfortunately the world is not this simple or elegant. Words rarely have the decency to arrange themselves for our metaphors.

Still, I maintain that real architecture starts when people stop only piling material and begin using the forces inside the material.

The Egyptians built some impressive pyramids. We still do not know every detail of how they pulled it off. There are theories, some more convincing than others. But in essence, a pyramid is a magnificent pile. A very clever pile, but still a pile.

The Roman arch is something else. The arch existed before the Romans, but the Romans were very good at spotting useful ideas, stealing them, improving them, and then repeating them with almost terrifying discipline. Bridges, aqueducts, gates, amphitheatres, bath houses. Once you understand the arch, stone can do things that a pile of stone cannot.

This matters because the arch is not just a shape. It is a different answer to the same world.

Gravity did not go away. Stone did not become lighter. The problem was reframed. The builder learned to arrange the pieces so that the forces pushing down and sideways became part of the solution.

That is what makes the image useful for software.

A software arch would not be a prettier diagram. It would not be another layer on the pile. It would be a way of arranging the work so that the forces that normally make software collapse help carry the structure instead.

The hard part is knowing what those forces are.

In buildings, some of the forces are literal: weight, compression, tension, wind, earthquakes, water, time. In software, the forces are stranger. Changing requirements. Missing knowledge. Competing teams. Dependencies. Users who do not do what the diagram says. Libraries that update. Platforms that change direction. The future arriving with muddy boots.

A software architecture that ignores those forces is just decoration.

## Patterns from buildings

Most architecture is not made of world-famous monuments. Most buildings are ordinary buildings. Houses, shops, schools, sheds, streets. The way they are designed differs more by region than by grand theory. Local builders learn what works. Over time, those solutions become patterns.

In 1977, Christopher Alexander and his co-authors published [*A Pattern Language*](https://en.wikipedia.org/wiki/A_Pattern_Language). In 1979 Alexander followed it with [*The Timeless Way of Building*](https://en.wikipedia.org/wiki/The_Timeless_Way_of_Building). Together these books argued for a culture of building based on patterns: recurring solutions to recurring problems, grounded in human life rather than only in abstract design.

In one of history's little jokes, software people listened.

Human architects mostly argued about Alexander or ignored him. Software architects grabbed the idea and ran off with it. These days no programmer is unaware of design patterns, even if only because at some point someone tried to solve a small problem by introducing a factory that manufactures factories.

I will not spend much time on software design patterns here. More than enough has been said about them, and some of it was even useful.

The important thing for this chapter is that Alexander gives us a second way to think about architecture. Architecture is not only grand structures. It is also a shared language for recurring forces.

A pattern is not a law. It is not a recipe you apply blindly. It is a remembered shape: when the world pushes like this, perhaps arrange the pieces like that.

That is close to what software wants. Not universal answers, but better ways to recognize the pressure.

## Software arches

Alan Kay did not merely complain about pyramids. He also spent a good part of his career trying to build something closer to an arch.

One later attempt was the Viewpoints Research Institute, or [VPRI](http://www.vpri.org/). One of its projects asked an almost ridiculous question: how much software would it take to build a complete personal computing system if you refused to accept the usual piles?

Not just an app. A stack: graphics, networking, operating-system-like pieces, user interface, languages. The sort of thing that normally arrives with millions of lines of code and enough build scripts to frighten livestock.

The VPRI answer was the [STEPS project](http://www.vpri.org/pdf/tr2007008_steps.pdf). The numbers in the report are startling. A TCP/IP implementation in hundreds of lines instead of tens of thousands. A Cairo-like graphics system in hundreds of lines instead of tens of thousands. Whether or not you believe every comparison is fair, the direction is hard to ignore.

The trick was not simply writing cleverer C.

VPRI treated language-making as an architectural tool. Each domain got a small language fitted to that domain. The project did not ask one general-purpose language to express every idea directly. It built little notations, little interpreters, little worlds where the right ideas could be said compactly.

[OMeta](http://www.vpri.org/pdf/tr2007003_ometa.pdf) was one of the tools that made this style practical. It is a language for writing languages, based on ideas from [Parsing Expression Grammars](https://en.wikipedia.org/wiki/Parsing_expression_grammar). OMeta can describe itself in about a hundred lines, which is the kind of sentence that makes language people smile in a slightly worrying way.

But OMeta itself is not the software arch.

Nor are DSLs automatically the software arch. A bad little language is just a bad little language with extra ceremony. We have already seen that in the language chapters. A language helps when it makes the right distinctions visible and hides the accidental machinery.

The VPRI lesson is more general:

Sometimes the architecture is not the arrangement of modules. Sometimes the architecture is the arrangement of meanings.

Instead of piling up code in the same old shapes, you ask what language would make the problem smaller. That is one possible software arch. Not the only one. But a real one.

## Rustic architecture

There is another direction from Alexander that is just as useful and less glamorous.

Forget the monumental building for a moment. Think about local building. The village. The workshop. The kitchen table that has been repaired three times. The pattern that survives because it keeps being useful.

Software architecture often wants to sound like skyscrapers. The important documents use words like enterprise, platform, governance, strategic alignment. But a lot of good software is more rustic than that. It grows out of tools people use, problems they have, habits they repeat, and shortcuts that become roads.

This is where the neat engineering story starts to blur.

If software were only a matter of arranging known forces, architecture might be simpler. But software changes the forces. A successful program does not merely sit in the world. It teaches people new habits. It creates new expectations. It becomes a dependency. It invites competitors. It changes what users ask for next.

A bridge does not usually make people invent a new kind of river.

Software does that sort of thing all the time.

So perhaps software architecture cannot be the art of designing the perfect structure. The perfect structure would have to be perfect for a world that is still moving.

This brings us to two old essays that seem, at first, to be about a different question.

Richard P. Gabriel wrote [*The Rise of “Worse is Better”*](https://www.dreamsongs.com/WorseIsBetter.html). The uncomfortable claim is that software that is in some ways worse can win because it is simpler, earlier, easier to spread, easier to implement, or easier to adapt. Once it wins, everyone else builds on it, and the better idea becomes a historical footnote.

Eric S. Raymond later wrote [*The Cathedral and the Bazaar*](http://www.catb.org/~esr/writings/cathedral-bazaar/cathedral-bazaar/), contrasting carefully planned cathedral-style development with the messy, adaptive energy of open source. His bazaar is not beautiful because it is messy. Mess by itself is just mess. The useful part is that many people can react, repair, extend and redirect the work while the world is still changing.

These essays are not the same, but they rhyme.

They both make software perfection look suspicious.

A working good-enough solution now is always better than a perfect solution sometime in the future.

I know. Always is a dangerous word. Good. Dangerous words wake people up.

The reason is not that bad software is noble. It is not that quality does not matter. It is that the future solution is not competing with today's problem. It is competing with the world as it exists when that future solution finally arrives.

And by then the world may have learned to ask another question.

## Scale and change

The Linux kernel makes this wonderfully confusing.

From far away, Linux is the poster child for the bazaar. Open source. Many contributors. A system shaped by the work of thousands of people across the world.

From close up, it does not look like anarchy. It is an enormous body of carefully reviewed code, with maintainers, subsystems, rules, arguments, rituals, long memories and Linus Torvalds still looming over the whole thing like a weather system.

So is it a cathedral or a bazaar?

Yes.

That is the wrong question.

The useful distinction is not whether software is planned or unplanned. Large successful software is almost always both. The useful question is whether the structure can keep changing without losing itself completely.

That is the force software architecture has to handle.

Change.

Software changes the world, and is changed by it. Any software you create has to live in an environment full of new uses, new machines, new libraries, new laws, new attacks, new expectations and new mistakes. Software that cannot change with that world will eventually be left behind, wrapped in a compatibility layer, or worshipped by a small group of specialists who know which version of which compiler still understands it.

This is one of the fundamental differences between software and traditional engineering. It is also why software project management keeps getting into trouble when it borrows too directly from older engineering disciplines.

A building project can be late, expensive and politically cursed, but the ground usually does not rewrite the laws of stone halfway through. Software has no such manners.

That does not mean architecture is hopeless. It means architecture is less about certainty than we would like.

A good architecture does not prove that you were right. It gives you somewhere to go when you discover that you were wrong.

> **Interactive exhibit placeholder: `change-arrives-before-perfect`**
>
> Show two teams. One ships a small imperfect system early and adapts. The other designs a more complete system but ships later. Introduce environmental changes every few turns. The demo should make clear that the future solution is not competing with today's problem, but with tomorrow's changed problem.

This also leads to the next question.

If the world keeps changing, where do the useful answers come from?

Not always from inside your project. Not even usually from inside your project, if the project is interesting enough. Other people are solving adjacent problems. Other communities are inventing tools. Other systems are creating expectations. Other wizards are making strange little things that may suddenly become the missing piece of your own work.

The next chapter follows that thread.

> **Wizard's twelfth rule**
>
> Perfect is the enemy of good enough because the world does not wait for perfect.
