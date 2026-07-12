---
tags: programming for wizards
---

# Architecture: arches and change

<!-- paragraph-id: p-13-i-used-to-think-the-word-architecture-came -->
I used to think the word architecture came from arch, which came from arc, which would have been wonderfully convenient for this chapter. Unfortunately language refuses to arrange itself for our metaphors. It has its own work to do.

<!-- paragraph-id: p-13-the-arch-is-still-a-useful-metaphor -->
The arch is still a useful metaphor.

<!-- paragraph-id: p-13-the-egyptians-built-impressive-pyramids-the-basic-trick -->
The Egyptians built impressive pyramids. The basic trick is visible from a distance: a lot of material, arranged so the weight above is carried by the mass below.

<!-- paragraph-id: p-13-the-roman-arch-is-a-different-answer-to -->
The Roman arch is a different answer to the same pressure. The arch existed before the Romans, but the Romans were very good at spotting useful ideas, stealing them, improving them, and repeating them with terrifying discipline. Bridges, aqueducts, gates, amphitheatres, bathhouses. Once you understand the arch, stone stops being only weight and starts becoming structure.

<!-- paragraph-id: p-13-a-software-arch-should-do-something-similar-it -->
A software arch should do something similar. It would not be another layer on top of the pile. It would be a way of arranging the work so the forces that usually make software heavy have somewhere useful to go.

<!-- paragraph-id: p-13-which-forces -->
Which forces?

<!-- paragraph-id: p-13-the-boring-ones-mostly-the-customer-who-says -->
The boring ones, mostly. The customer who says, six months later, that when they said "archive" they did not mean "delete, but slower." The library that changes one small default and makes your clever shortcut look less clever. The screen that was supposed to be temporary, except people entered real data into it, so now it is a historical record. The teammate who leaves and takes with them the memory of why the strange part is strange.

<!-- paragraph-id: p-13-and-then-there-is-the-future-which-keeps -->
And then there is the future, which keeps arriving before the system is ready.

<!-- paragraph-id: p-13-you-can-answer-all-of-this-by-adding -->
You can answer all of this by adding more stuff. More rules, more checks, more meetings, more glue code, more careful comments around the dangerous part. Sometimes that is exactly what you should do.

<!-- paragraph-id: p-13-but-if-the-same-kind-of-weight-keeps -->
But if the same kind of weight keeps returning, it is worth asking whether the system is saying things the hard way.

<!-- paragraph-id: p-13-this-is-where-language-comes-back-into-the -->
This is where language comes back into the story. The language of a system decides which thoughts are easy to express, which mistakes are easy to make, and how much ceremony is needed.

## Change the language?

<!-- paragraph-id: p-13-alan-kay-did-not-only-complain-about-pyramids -->
Alan Kay did not only complain about pyramids. He spent a good part of his career trying to build software that behaved less like one.

<!-- paragraph-id: p-13-one-later-attempt-came-through-the-viewpoints-research -->
One later attempt came through the Viewpoints Research Institute, or [VPRI](http://www.vpri.org/). One of its projects asked an almost rude question:

<!-- paragraph-id: p-13-how-much-software-would-it-take-to-build -->
How much software would it take to build a complete personal computing system if you refused to accept the usual piles?

<!-- paragraph-id: p-13-not-just-an-app-a-stack-graphics-networking -->
Not just an app. A stack: graphics, networking, operating-system-like pieces, user interface, languages. The sort of thing that normally arrives with millions of lines of code and enough build machinery to make a calm person stare out of a window for a while.

<!-- paragraph-id: p-13-the-vpri-answer-was-the-steps-project-the -->
The VPRI answer was the [STEPS project](http://www.vpri.org/pdf/tr2007008_steps.pdf). The numbers in the report are startling:

| Piece               |   STEPS version |       Ordinary version |
| ------------------- | --------------: | ---------------------: |
| TCP/IP              | under 200 lines | 10,000 to 20,000 lines |
| Cairo-like graphics | under 500 lines |     about 44,000 lines |

<!-- paragraph-id: p-13-these-are-not-neat-one-for-one-product -->
These are not neat one-for-one product comparisons. The numbers deserve some distrust. But the scale of the attempt is still interesting. VPRI was not trying to shave a few percent off a familiar stack. It was asking whether the stack had been described in the wrong shape.

<!-- paragraph-id: p-13-where-did-all-that-code-go -->
Where did all that code go?

<!-- paragraph-id: p-13-the-trick-was-not-simply-writing-cleverer-c -->
The trick was not simply writing cleverer C. VPRI treated language-making as an architectural tool.

<!-- paragraph-id: p-13-each-domain-got-a-small-language-fitted-to -->
Each domain got a small language fitted to that domain. The project did not ask one general-purpose language to express every idea directly. It built little notations and interpreters in which the important ideas could be said compactly.

<!-- paragraph-id: p-13-ometa-was-one-of-the-tools-that-made -->
[OMeta](http://www.vpri.org/pdf/tr2007003_ometa.pdf) was one of the tools that made this practical. It is a language for writing languages, based on ideas from [Parsing Expression Grammars](https://en.wikipedia.org/wiki/Parsing_expression_grammar). OMeta can describe itself in about a hundred lines, which is the kind of sentence that makes language people smile in a slightly worrying way.

<!-- paragraph-id: p-13-ometa-itself-is-not-the-arch-neither-is -->
OMeta itself is not the arch. Neither is every DSL.

<!-- paragraph-id: p-13-a-bad-little-language-is-still-a-bad -->
A bad little language is still a bad little language, only with extra ceremony. We have already seen this danger. Every program grows a language, whether you admit it or not. If the language fits the problem, the problem gets smaller. If it fits only the author, everyone else gets a border crossing.

<!-- paragraph-id: p-13-in-steps-some-of-the-repeated-machinery-became -->
In STEPS, some of the repeated machinery became grammar or vocabulary. A distinction that previously required careful code could become a word. Something that took a page could become a sentence in a language designed for that problem.

<!-- paragraph-id: p-13-changing-the-language-changed-the-amount-and-shape -->
Changing the language changed the amount and shape of the software.

<!-- paragraph-id: p-13-that-can-be-an-arch -->
That can be an arch.

<!-- paragraph-id: p-13-sometimes-it-is-just-a-private-dialect-with -->
Sometimes it is just a private dialect with a README and a bad attitude. But when it works, the structure gets lighter because the right things have names.

## Better can still lose

<!-- paragraph-id: p-13-there-is-a-trap-here -->
There is a trap here.

<!-- paragraph-id: p-13-once-you-see-a-beautiful-arch-you-may -->
Once you see a beautiful arch, you may start believing that the better structure should win. It is smaller, clearer, more elegant, more powerful. Surely it should arrive, explain itself politely, and replace the pile.

<!-- paragraph-id: p-13-software-history-does-not-have-these-manners -->
Software history does not have these manners.

<!-- paragraph-id: p-13-richard-p-gabriel-wrote-the-rise-of-worse -->
Richard P. Gabriel wrote [*The Rise of "Worse is Better"*](https://www.dreamsongs.com/WorseIsBetter.html). Its uncomfortable claim is that software that is worse in some ways can win because it is simpler, earlier, easier to implement, easier to spread, or easier to adapt.

<!-- paragraph-id: p-13-once-it-wins-everyone-else-builds-on-it -->
Once it wins, everyone else builds on it.

<!-- paragraph-id: p-13-the-better-idea-is-no-longer-competing-with -->
The better idea is no longer competing with the original problem. It is competing with the installed world.

<!-- paragraph-id: p-13-a-useful-imperfect-thing-today-changes-what-tomorrow -->
A useful imperfect thing today changes what tomorrow needs. People write tutorials for it. They build wrappers. They save files in its format because that is the format the tool understands. Someone puts it in a build script. Someone else copies the build script.

<!-- paragraph-id: p-13-a-year-later-the-rough-edge-is-no -->
A year later, the rough edge is no longer merely a rough edge. It is compatibility.

<!-- paragraph-id: p-13-this-does-not-mean-bad-software-is-noble -->
This does not mean bad software is noble. It means timing is part of architecture.

<!-- paragraph-id: p-13-an-arch-that-arrives-too-late-may-be -->
An arch that arrives too late may be admired, studied, and ignored. You are not only arranging code. You are arranging code in time.

## Being wrong without breaking everything

<!-- paragraph-id: p-13-software-changes-the-world-and-is-changed-by -->
Software changes the world, and is changed by it.

<!-- paragraph-id: p-13-any-useful-program-will-eventually-meet-new-machines -->
Any useful program will eventually meet new machines, new uses, new libraries, new laws, new attacks, new expectations, and new mistakes. Users will do things the program did not expect. Other programs will depend on it in ways nobody planned. Someone will run it for longer than seems reasonable. Someone will put important data into the field you thought was temporary.

<!-- paragraph-id: p-13-this-is-one-of-the-problems-with-comparing -->
This is one of the problems with comparing software to buildings. The ground usually does not rewrite the laws of stone halfway through construction. Software has no such manners.

<!-- paragraph-id: p-13-architecture-cannot-mean-certainty -->
Architecture cannot mean certainty.

<!-- paragraph-id: p-13-certainty-is-too-expensive-and-usually-fake -->
Certainty is too expensive, and usually fake.

<!-- paragraph-id: p-13-architecture-is-how-you-survive-being-wrong -->
Architecture is how you survive being wrong.

<!-- paragraph-id: p-13-you-will-choose-the-wrong-database-sometimes-you -->
You will choose the wrong database sometimes. You will give a private thing a public name, or a public thing no name at all. You will build a pile where an arch might have worked, and sometimes you will build an arch nobody needs.

<!-- paragraph-id: p-13-that-is-not-a-moral-failure-it-is -->
That is not a moral failure. It is what happens when you have to work before the future has finished introducing itself.

<!-- paragraph-id: p-13-the-question-is-whether-being-wrong-breaks-everything -->
The question is whether being wrong breaks everything.

<!-- paragraph-id: p-13-if-one-piece-is-wrong-can-it-be -->
If one piece is wrong, can it be replaced without dragging half the system behind it? If the data has to move, did you leave it a door? If the language you invented is missing a word, can it grow without making all the old sentences meaningless?

<!-- paragraph-id: p-13-diagrams-may-help-vocabulary-may-help-layers-may -->
Diagrams may help. Vocabulary may help. Layers may help, if they are honest layers and not just lines drawn through a pile.

<!-- paragraph-id: p-13-but-architecture-is-not-the-diagram-it-is -->
But architecture is not the diagram. It is the structure that allows the system to change when the diagram turns out to be wrong.

<!-- rule-id: rule-13-wizards-eleventh-rule -->
> **Wizard's eleventh rule**
>
> You will be wrong. Try not to make it hurt.
