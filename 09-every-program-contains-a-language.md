---
tags: programming for wizards
---

# Every program contains a language

A program is not only written in a language. A program also creates a language.

Every variable name, function name, class name, method name, command name, file name and folder name adds a word to that language. Anyone reading your program must learn that language before they can safely change it.

This is why reading code is hard. It is much easier to write code. When you write code, you already know the language you are inventing. Everyone else has to reverse-engineer it from the traces you leave behind.

> **Interactive exhibit placeholder: `tiny-dsl-boundary`**
>
> Start with a small validation problem written as ordinary `if` statements. Then turn repeated fragments into named functions, then into a table, then into a tiny DSL. Let the reader compare what each version makes visible. The point is to show that language-making happens gradually, not only when you build a parser.

## Domain Specific Languages

Domain Specific Languages are just programming languages. In fact, FORTRAN is a DSL for math, COBOL is a DSL for ... ehm... lets forget about COBOL. But in general a DSL is much more limited than a normal programming language. It is small and simple, focused on single problem domain (hence the name.)

When you start using DSL's, you don't use a single programming language. You use many of them, and glue them together to form your program.

In fact, if you've done any programming, you have used the exact same ideas, though expressed less powerfully. Any time you create a variable or a function, or classes and methods, you are creating your own DSL, expressed within the limitations of your programming language.

You are continually extending your programming language, creating a new language in the process. Anyone reading your code must first learn this language. And while we start out young and amazingly adept at learning languages, as we grow up most of us lose this ability. Or at least it gets degraded. Unless you keep practicing.

You can make it easier for other people to learn your language. One way is to mimic existing languages. Design patterns fit into this approach. Another way is to keep your changes small. This approach leads to composable components. And finally, you can create real DSL's, that aren't limited to the syntax and capabilities of your source programming language. 

Creating a true DSL means that you have to create your own compiler and runtime. But it has the benefit of making the boundary between the DSL and the source programming language extremely clear. Done well, this boundary lines up well with a natural boundary in the problem domain. The best DSL's are so well known that we don't actually think of them as DSL's anymore. 

One example is Regular Expressions. Any non-trivial program will have them. Beginning programmers hate them, because they are so unreadable.. for the untrained.

Another example is SQL. Almost any software that uses a database, will have some SQL in it. It may be hidden behind an ORM, but it will be there.

Done correctly, a DSL allows you to divide your problem along natural boundaries in the domain. Then you can solve each sub-problem seperately. While you are solving that sub-problem, you don't have to think about the solution for other problems. You will not need to read code that isn't related. Your programming language doesn't need to have tools that aren't related to your current problem. DSL's allow you to have a high level view of the problem and not worry about low level implementation details.

But the most important thing to remember is that you are creating a new language whenever you add any variable, function, class or method. By being conscious of this, you can make sure that the language you are building is easy to learn, simple to use and expressive. Designed for humans, not computers.

> **Wizard move**
>
> Whenever you name something, you are teaching the next reader a word. Make sure the word earns its place.
