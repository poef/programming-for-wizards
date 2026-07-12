---
tags: programming for wizards
---

# Every program grows a language

A program is not only written in a language. A program also creates a language.

Every time you name a variable, function, class or method, you add a word to your program. Add enough words and you've created a language all your own.

When you write the code, that language is obvious because you've invented it. Anyone else must learn it before they can safely change your program.

This is why reading code is harder than writing it.

Most of the time, programs grow their local language by accident. You do not choose to create it--it just happens. Always. You only get to choose whether you notice it before it grows teeth.

That is not automatically bad. It is how useful code grows.

But sometimes the local language wants to stop being accidental. Sometimes the problem has a vocabulary of its own, and forcing that vocabulary through the general-purpose language starts to feel like translating a poem through a tax form.

At that point, a wizard may decide to make the language explicit.

> **Wizard's eighth rule**
>
> Mind your language.

## Domain-Specific Languages

A domain-specific language, or DSL, is a language made for one kind of problem. A DSL is much more limited than a normal programming language. It is small and simple, focused on a single problem domain.

When you start using DSLs, you don't use a single programming language anymore. You use many small languages, and glue them together to form your program.

Creating a true DSL means creating your own compiler and runtime. It makes the boundary between the DSL and the source programming language extremely clear. Done well, this boundary lines up with a natural boundary in the problem domain.

The best DSLs are so well known that we don't think of them as DSLs anymore.

One example is [Regular Expressions](https://en.wikipedia.org/wiki/Regular_expression). Any non-trivial program will have them. Beginning programmers hate them, because they are so unreadable. Don't worry. With practice you can become an experienced programmer who hates them.

Another example is SQL. Almost any software that uses a database will have some SQL in it. It may be hidden behind an ORM, but it will be there.

Done correctly, a DSL allows you to divide your problem along natural boundaries in the domain. 

SQL allows you to express ideas about data without worrying about functions, loops or variables. Regular expressions allow you to define text patterns, without added ceremony.

Inside a DSL, you can focus on the specific problem it was designed to solve, and forget the outer world.

But the most important thing to remember is that you are creating a new language whenever you add any variable, function, class or method. By being conscious of this, you can make sure that the language you are building is easy to learn, simple to use and expressive. 

Designed for humans, not computers.