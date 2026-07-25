# Editorial note: closing the first part with programming languages and a code exhibit

## Purpose

These three chapters form the closing movement of the first part of the book.

The earlier chapters move through numbers, logic, human language and the first layers of the Web. These chapters bring that argument into programming itself:

- programming languages exist primarily for humans;
- every program grows a local language of its own;
- a domain-specific language can make that local language deliberate;
- the code exhibit shows this happening inside ordinary JavaScript.

The movement is from observing other people’s inventions to making a small one ourselves.

That makes the JAQT exhibit a natural conclusion to the first part.

The editorial aim should be to preserve the forward movement and make the conceptual chain slightly clearer without turning these chapters into a general history of programming languages or a tutorial on language design.

A useful rule for this group is:

> **Show the reader what each language makes easier to think.**

The code samples do not need to teach COBOL, Fortran, Lisp or JAQT. They need to reveal that different languages expose different worlds to the programmer.

## Is the code exhibit a natural end to the first part?

Yes.

The first part begins by showing that representations are inventions:

- tally marks and positional notation change what numbers can do;
- Boolean logic turns reasoning into machinery;
- language gives ideas names;
- URLs make the network addressable;
- HTML gives documents structure;
- JavaScript gives documents behaviour.

Chapters 8 and 9 then turn the argument inward. The subject is no longer only the languages and systems inherited from history. The programmer is also a language designer, whether or not they notice.

Chapter 10 proves this with code.

The exhibit is therefore not an appendix or a technical interruption. It is the practical culmination of the first part:

> First the book argues that changing the representation changes what can be thought and built.  
> Then it shows the reader doing exactly that.

The ending is especially well placed because the chapter closes on a boundary question:

> The question is where the boundary belongs.

That both completes the language argument and prepares the architectural argument that follows. A language creates a boundary; the next part can ask what happens when boundaries are placed well or badly.

### One possible weakness

The current final paragraph is conceptually strong, but it ends at the exact moment the argument becomes clearest. With a visible part break, that may be enough. Without one, it may feel as though the chapter simply stops.

A short final beat could remind the reader what changed:

> The computer has learned nothing new. It still runs JavaScript.
>
> We changed the words available to the programmer, and the program changed shape.

That would make the code exhibit feel like a conclusion without summarising the entire first part.

If the next chapter begins directly with architecture or boundaries, an optional hinge could add:

> A language is also a boundary. Once more than one part depends on it, changing the words has consequences.

That should only be added if the next chapter picks up the thought immediately.

## Chapter 8: Teaching machines our words

### What already works

The opening is excellent:

> A computer doesn’t need a programming language. Humans do.

It reverses a familiar assumption immediately and ties the chapter back to the language chapter.

The movement from machine code to assembly also makes the argument concrete. Labels and comments do not change what the machine does. They change what the human can see.

The historical sequence then gives several answers to the same question:

- COBOL makes business procedures expressible;
- Fortran makes mathematical and numerical work expressible;
- Lisp makes language extension itself expressible.

The second half identifies the central trade-off:

- expressive freedom helps the writer;
- shared conventions help the reader;
- frameworks improve recognition by narrowing expression;
- every gain eventually presents a bill.

That is a strong and appropriately uncomfortable conclusion.

### Where additions may help

The historical examples would benefit from one clear instruction about what the reader should notice in each one.

At present, a non-specialist may see three old and unfamiliar code samples without fully understanding how they support the argument. The chapter does not need longer explanations. It may need one sentence per language that directs the eye.

For COBOL, the point is not that the syntax is pleasant. It is that the language names the kinds of sections and records business software needs.

For Fortran, the point is that formulas, arrays and loops become visible without the programmer manually managing machine instructions.

For Lisp, the point is stronger: the language makes it possible to add new forms of expression to the language itself.

This would turn the sequence from a small museum of old syntax into a sequence of expanding human capabilities.

### COBOL and tone

The line that COBOL was “very successful and almost universally hated” is funny, but it risks becoming the kind of glib judgement the rest of the book generally avoids.

The more interesting point is already present later: COBOL became part of institutional machinery and therefore acquired a life far beyond its original design context.

A formulation focused on the trade-off may fit the book better:

> COBOL was extraordinarily successful, though few programmers have ever described it as beautiful.

Or:

> COBOL succeeded at becoming readable to institutions, which is not always the same thing as becoming pleasant to programmers.

The aim is not to defend COBOL. It is to keep the criticism attached to consequences and design choices rather than to a community’s taste.

### The chapter’s deeper progression

The chapter can make this sequence slightly more visible:

1. Assembly gives names to machine operations.
2. COBOL and Fortran give names to recurring kinds of human work.
3. Lisp makes the creation of new language visible.
4. Frameworks and patterns standardise local languages so other people can recognise them.
5. Every increase in shared readability reduces some freedom of expression.

The chapter is not really about old languages.

It is about the recurring tension between **expressiveness and shared understanding**.

### What to avoid

The chapter should not become a fuller history of programming languages. More languages would weaken the argument.

It also does not need to explain the code samples line by line. One sentence telling the reader what became easier to express is enough.

The framework criticism should remain focused on the trade-off. Frameworks are not merely cookie cutters; they are attempts to make code legible across teams and time. Their cost is that the pattern can become more visible than the problem.

## Chapter 9: Every program grows a language

### What already works

This is a short and strong chapter.

Its central claim is immediately understandable:

> A program is not only written in a language. A program also creates a language.

The explanation that every variable, function, class and method adds a word is enough to make the idea concrete.

The line about accidental language growing teeth is memorable and carries the right amount of humour.

The movement from accidental local vocabulary to deliberate DSL is natural. The chapter does not need to prove every advantage of DSLs because the code exhibit follows immediately.

### Where additions may help

The chapter could spend a little more time on the fact that a program’s vocabulary is also its model of the world.

If a program contains `customer`, `invoice`, `subscription`, `cancel` and `renew`, those words do more than name pieces of code. Together they say what kinds of things the program believes exist and which actions are possible.

This connects the chapter to the earlier language argument without making it anthropological. It also prepares the later architectural chapters: the local language often reveals where the actual domain boundaries are.

A useful addition might make clear that the language controls change:

> When the program has a good word for an idea, changes involving that idea have somewhere to go. When the idea has no name, its behaviour tends to leak into many unrelated places.

That would connect naming directly to maintainability and boundaries.

### The deliberate reveal about DSLs

The statement:

> Creating a true DSL means creating your own compiler and runtime.

sets up the next chapter’s reveal that a language can also hide inside its host language.

This works as a narrative trick because chapter 10 follows immediately.

However, readers already familiar with internal DSLs may see it as simply incorrect rather than productively incomplete. The phrase “true DSL” is especially risky.

The surprise can be preserved with a slightly narrower claim:

> The clearest kind of DSL has its own parser or compiler. That gives the new language a hard boundary.

Or:

> One way to create a DSL is to give it its own parser, compiler and runtime. This makes the boundary extremely clear.

Chapter 10 can then reveal that a hard boundary is not the only choice.

If the intentional overstatement remains, the immediate transition into the code exhibit is essential. A part break or unrelated interlude between chapters 9 and 10 would make the correction arrive too late.

### What to avoid

The chapter should stay short.

It is a doorway into the exhibit, not the place to classify external, internal, fluent, declarative and embedded DSLs.

One concrete example of a program’s local vocabulary may help. A taxonomy will not.

## Chapter 10: Code exhibit—extending JavaScript with JAQT

### What already works

The exhibit has a very strong teaching sequence:

1. begin with ordinary records;
2. express the query as a loop;
3. improve it with `filter()` and `map()`;
4. feel the temptation to invent syntax;
5. count the cost of a parser and hard boundary;
6. use functions as delayed behaviour;
7. make the query resemble the data;
8. give the emerging language a few words;
9. compose it with the host language;
10. return to the boundary question.

This is exactly the right shape for the chapter. The reader does not receive a finished abstraction and an explanation. They watch the abstraction appear because each previous version leaves a small itch.

That iterative construction also quietly supports the later architectural argument. The language is not designed in one heroic step. It grows through a series of small, inspectable improvements.

### Why the example works as a capstone

The exhibit repeats several ideas from the first part in miniature.

#### Representation changes the problem

The loop and the object pattern produce the same result, but they make different things visible.

The loop foregrounds control flow:

- walk;
- check;
- push.

The pattern foregrounds the question:

- this name;
- this city;
- this result shape.

The machine can execute either form. The difference is for the human.

#### New words create new thought

`where`, `select` and `_` do not add new computational power to JavaScript. They make a different way of thinking available inside it.

This directly demonstrates the language chapter’s rule.

#### Small pieces create larger systems

The final wrapper is almost embarrassingly small. Yet it creates enough new vocabulary for the code to feel like a query language.

This echoes the Web chapters: the significant invention is often a small combination of existing parts.

#### Boundaries have costs

A separate parser gives the DSL a clear and protective border. Staying inside JavaScript preserves composition, imports, functions, tests and tooling.

Neither choice is universally correct.

That prepares the reader for the architectural part of the book, where boundary placement becomes the central concern.

### Where additions may help

The exhibit already explains itself well. Additions should be sparse.

One useful sentence could appear when the object pattern is introduced:

> The loop describes the work required to answer the question. The pattern describes the question itself.

That sharpens the contrast without adding a digression.

Another possible addition belongs after the fluent `from().where().select()` example:

> Nothing new has become computable. Something new has become sayable.

That line connects the exhibit directly to the book’s argument while allowing the code to remain the proof.

The “small wooden model of the bridge” passage is strong. It could perhaps make the experimental nature slightly more explicit:

> The model is small enough to reveal which pieces create the language and which pieces merely handle the weather.

That may be unnecessary; the existing line about edge cases starting families already does much of the work.

### One technical-conceptual point to guard

The exhibit calls the emerging structure “close to a query language” and later a DSL. That is defensible, but the chapter’s strongest point is not whether it satisfies a formal definition of DSL.

The point is that a small agreement about:

- object shapes;
- functions in particular positions;
- markers such as `_`;
- words such as `where` and `select`;

changes how the program can express a problem.

Avoid letting terminology become the argument.

### The current ending

The current ending is:

> A parser version of a DSL puts the boundary around a new query language. The JAQT-shaped version moves the boundary inward. JavaScript remains the language. The DSL is the shape of a few objects, a handful of functions, and an agreement about what certain positions mean.

This is a good ending because it resolves the chapter’s opening question.

It also contains a hidden summary of the first part:

- meaning comes from position;
- representations are agreements;
- a few small pieces can create a new world of expression;
- boundaries determine what remains available on either side.

The only question is whether to add one final landing sentence.

Possible options:

> The computer still sees JavaScript. We have taught the humans a few new words.

Or:

> Nothing new has become computable. Something new has become sayable.

Or:

> We did not teach the machine a new language. We taught ourselves a better way to ask the question.

The last option most directly echoes the chapter 8 opening and would close the three-chapter arc neatly.

## The progression across the three chapters

These chapters form a compact argument:

### Chapter 8

Programming languages are not primarily for commanding machines.

They are for helping humans express, reason about and share instructions.

### Chapter 9

The chosen programming language is only the beginning.

Every program adds a vocabulary and grows a local language of its own.

### Chapter 10

That local language can be designed consciously.

It does not always require a compiler or new syntax. Sometimes a few shapes, functions and words are enough.

The full movement is:

> Machine instructions become human words.  
> Human words become a program’s local language.  
> The local language becomes an explicit tool for thinking.

That is a convincing conclusion to the first part.

## Relationship to the book’s larger ideas

### Change the words

The exhibit gives the book’s most concrete demonstration so far that changing the words changes the available thought.

The query was always computable. It became easier to see only after the program gained words shaped around the problem.

### Contingency

Programming languages are historical collections of decisions, communities and compromises.

The chapter does not need to say that every syntax choice was an accident. It only needs to preserve the fact that no single language is the natural form of computation.

### Stable boundaries

The code exhibit introduces the boundary question before the architectural part begins.

The hard parser boundary and the softer host-language boundary preserve different things and impose different costs.

This makes the exhibit a useful hinge rather than merely a conclusion.

### Cheap experimentation

The tiny JAQT model also demonstrates a small version of cheap experimentation.

Instead of building a complete parser and runtime, the exhibit tests the central idea with ordinary JavaScript objects and functions.

The model is cheap enough to reveal whether the language has value before the expensive border is built.

This idea should remain implicit here. The later architectural chapters can give it its full meaning through stable boundaries and replaceable software.

## Editorial cautions

These chapters will weaken if they:

- add more historical programming languages;
- explain the old code samples in technical detail;
- turn chapter 9 into a taxonomy of DSLs;
- turn chapter 10 into documentation for JAQT;
- overstate the inferiority of COBOL, frameworks, ORMs or separate parsers;
- repeatedly announce that language shapes thought after the code has already demonstrated it;
- add a long retrospective summary before the part break.

The code exhibit should be allowed to do the concluding work.

## Candidate additions to consider

These are rough formulations to adapt, shorten or discard.

### Chapter 8: what to notice in assembly

Possible addition after the commented assembly example:

> The labels and comments do not add a single capability to the machine.
>
> They give the human names for the parts of the process: `BEGIN`, `LOOP`, `READY`, `DEVICE`.
>
> The machine executes the same instructions. The programmer can now see a program.

### Chapter 8: COBOL’s world

> COBOL gave business software words for records, divisions, procedures and storage.
>
> Its programs did not look much like mathematics because accounting, payroll and inventory do not look much like mathematics either.

### Chapter 8: Fortran’s world

> Fortran moved in another direction. Scientists and engineers could write formulas, loops and operations over arrays without translating each step into registers and memory addresses.

### Chapter 8: Lisp’s decisive difference

> COBOL and Fortran made particular kinds of work easier to express.
>
> Lisp made it easier to change what could be expressed.

### Chapter 8: frameworks as shared dialects

> A framework is partly a shared dialect.
>
> When everyone calls the same things models, views, controllers and routes, a new programmer has fewer local words to learn.
>
> The cost is that the dialect may keep speaking even when the problem has nothing useful to say in it.

### Chapter 9: a program’s vocabulary is its model

> A program’s words describe the world it believes in.
>
> If it contains customers, invoices, subscriptions and renewals, those are not only names in the code. They are the kinds of things the program knows how to see.

### Chapter 9: names give change somewhere to go

> When a program has a good word for an idea, changes involving that idea have somewhere to go.
>
> When the idea has no name, its behaviour tends to leak into many unrelated places.

### Chapter 9: soften the external-DSL overstatement

Possible replacement:

> One way to create a DSL is to give it its own parser, compiler and runtime. This makes the boundary between the DSL and the source language extremely clear.

Or, preserving more of the reveal:

> The clearest kind of DSL has its own parser or compiler. It draws a hard border around the new language.

### Chapter 10: work versus question

> The loop describes the work required to answer the question.
>
> The pattern describes the question itself.

### Chapter 10: nothing new became computable

> Nothing new has become computable.
>
> Something new has become sayable.

### Chapter 10: the experiment before the border

> Before building a parser, we used ordinary JavaScript to find out whether the new language was worth having.
>
> The cheap model let us test the idea before committing to the border.

This is useful conceptually, but may point too directly toward the later cheap-experimentation argument. It should only remain if it fits naturally in the surrounding voice.

### Chapter 10: possible final landing

Option one:

> The computer still sees JavaScript.
>
> We have taught the humans a few new words.

Option two:

> We did not teach the machine a new language.
>
> We taught ourselves a better way to ask the question.

Option three, with a bridge to architecture:

> We did not teach the machine a new language. We changed the boundary between the language and the problem.
>
> The next question is what happens when the rest of the system begins to depend on that boundary.

## Working conclusion

These chapters complete the first part by bringing its argument into the reader’s own code.

The first part has shown that notation, logic, language and Web standards are made things. They carry history, choices and trade-offs.

The code exhibit adds one final step:

> You are making such things too.

Every name alters the language of the program. Every abstraction makes some thought easier and another harder. Every DSL draws a boundary and sends a bill somewhere.

The exhibit should be the conclusion because it leaves the reader not only with an idea, but with the experience of watching a new language appear.
