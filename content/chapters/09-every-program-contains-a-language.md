---
tags: programming for wizards
---

# Every program grows a language

<!-- paragraph-id: p-09-a-program-is-not-only-written-in-a -->
A program is not only written in a language. A program also creates a language.

<!-- paragraph-id: p-09-every-time-you-name-a-variable-function-class -->
Every time you name a variable, function, class or method, you add a word to your program. Add enough words and you've created a language all your own.

<!-- paragraph-id: p-09-when-you-write-the-code-that-language-is -->
When you write the code, that language is obvious because you've invented it. Anyone else must learn it before they can safely change your program.

<!-- paragraph-id: p-09-this-is-why-reading-code-is-harder-than -->
This is why reading code is harder than writing it.

<!-- paragraph-id: p-09-most-of-the-time-programs-grow-their-local -->
Most of the time, programs grow their local language by accident. You do not choose to create it--it just happens. Always. You only get to choose whether you notice it before it grows teeth.

<!-- paragraph-id: p-09-that-is-not-automatically-bad-it-is-how -->
That is not automatically bad. It is how useful code grows.

<!-- paragraph-id: p-09-but-sometimes-the-local-language-wants-to-stop -->
But sometimes the local language wants to stop being accidental. Sometimes the problem has a vocabulary of its own, and forcing that vocabulary through the general-purpose language starts to feel like translating a poem through a tax form.

<!-- paragraph-id: p-09-at-that-point-a-wizard-may-decide-to -->
At that point, a wizard may decide to make the language explicit.

<!-- rule-id: rule-09-wizards-eighth-rule -->
> **Wizard's eighth rule**
>
> Mind your language.

## Domain-Specific Languages

<!-- paragraph-id: p-09-a-domain-specific-language-or-dsl-is-a -->
A domain-specific language, or DSL, is a language made for one kind of problem. A DSL is much more limited than a normal programming language. It is small and simple, focused on a single problem domain.

<!-- paragraph-id: p-09-when-you-start-using-dsls-you-dont-use -->
When you start using DSLs, you don't use a single programming language anymore. You use many small languages, and glue them together to form your program.

<!-- paragraph-id: p-09-creating-a-true-dsl-means-creating-your-own -->
Creating a true DSL means creating your own compiler and runtime. It makes the boundary between the DSL and the source programming language extremely clear. Done well, this boundary lines up with a natural boundary in the problem domain.

<!-- paragraph-id: p-09-the-best-dsls-are-so-well-known-that -->
The best DSLs are so well known that we don't think of them as DSLs anymore.

<!-- paragraph-id: p-09-one-example-is-regular-expressions-any-non-trivial -->
One example is [Regular Expressions](https://en.wikipedia.org/wiki/Regular_expression). Any non-trivial program will have them. Beginning programmers hate them, because they are so unreadable. Don't worry. With practice you can become an experienced programmer who hates them.

<!-- paragraph-id: p-09-another-example-is-sql-almost-any-software-that -->
Another example is SQL. Almost any software that uses a database will have some SQL in it. It may be hidden behind an ORM, but it will be there.

<!-- paragraph-id: p-09-done-correctly-a-dsl-allows-you-to-divide -->
Done correctly, a DSL allows you to divide your problem along natural boundaries in the domain. 

<!-- paragraph-id: p-09-sql-allows-you-to-express-ideas-about-data -->
SQL allows you to express ideas about data without worrying about functions, loops or variables. Regular expressions allow you to define text patterns, without added ceremony.

<!-- paragraph-id: p-09-inside-a-dsl-you-can-focus-on-the -->
Inside a DSL, you can focus on the specific problem it was designed to solve, and forget the outer world.

<!-- paragraph-id: p-09-but-the-most-important-thing-to-remember-is -->
But the most important thing to remember is that you are creating a new language whenever you add any variable, function, class or method. By being conscious of this, you can make sure that the language you are building is easy to learn, simple to use and expressive. 

<!-- paragraph-id: p-09-designed-for-humans-not-computers -->
Designed for humans, not computers.