---
tags: programming for wizards
---

# Every program grows a language

A program is not only written in a language. A program also creates a language.

Every variable name, function name, class name, method name, command name, file name, and folder name adds a word to that language. Anyone reading your program must learn that language before they can safely change it.

This is why reading code is hard. It is much easier to write code. When you write code, you already know the language you are inventing. Everyone else has to reverse-engineer it from the traces you leave behind.

Most of the time, this local language grows by accident. That is the uncomfortable part. You do not get to choose whether your program has a language. You only get to choose whether you notice it before it grows teeth.

You add a function because one bit of code got annoying. You add a class because three things started to look alike. You add a convention because it made one page easier to read. After a while, your program has its own vocabulary. It has things you can say easily, things you can barely say at all, and things that only make sense to people who already live there.

That is not automatically bad. It is how useful code grows.

But sometimes the local language wants to stop being accidental. Sometimes the problem has a vocabulary of its own, and forcing that vocabulary through the general-purpose language starts to feel like translating a poem through a tax form.

At that point, a wizard may decide to make the language explicit.

> **Wizard's eighth rule**
>
> Everything gets a name. It's better if you know it.

## Domain Specific Languages

A Domain Specific Language, or DSL, is a language made for one kind of problem. A DSL is much more limited than a normal programming language. It is small and simple, focused on a single problem domain.

When you start using DSLs, you don't use a single programming language anymore. You use many small languages, and glue them together to form your program.

Creating a true DSL means creating your own compiler and runtime. It makes the boundary between the DSL and the source programming language extremely clear. Done well, this boundary lines up with a natural boundary in the problem domain.

The best DSLs are so well known that we don't think of them as DSLs anymore.

One example is [Regular Expressions](https://en.wikipedia.org/wiki/Regular_expression). Any non-trivial program will have them. Beginning programmers hate them, because they are so unreadable... for the untrained.

Another example is SQL. Almost any software that uses a database will have some SQL in it. It may be hidden behind an ORM, but it will be there.

Done correctly, a DSL allows you to divide your problem along natural boundaries in the domain. Then you can solve each sub-problem separately. While you are solving that sub-problem, you don't have to think about the solution for other problems. You will not need to read code that isn't related. Your programming language doesn't need to have tools that aren't related to your current problem. DSLs allow you to have a high level view of the problem and not worry about low level implementation details.

But the most important thing to remember is that you are creating a new language whenever you add any variable, function, class or method. By being conscious of this, you can make sure that the language you are building is easy to learn, simple to use and expressive. Designed for humans, not computers. 

Most names only need to work inside one program. Some eventually want to leave.

Let's make that practical.
