---
tags: programming for wizards
---

# Logic: the truth is out there

## Riddle me this

You are standing before two doors. One door leads to your desire. The other leads to your doom. Before the doors are two guards. They both know which door leads where. One guard always lies. The other always tells the truth.

You may ask one question.

Obviously, you need to ask a question that reveals which door to use. But the obvious question doesn't work.

> Which door should I choose?

If you ask the truthful guard, she'll point to your desire. If you ask the lying guard, she'll point to your doom. Since you don't know which guard you're asking, the answer is useless. Let's put both possibilities in a table:

| Guard you ask | Door they point to |
| - | - |
| Truthful | Desire |
| Liar | Doom |

That doesn't help. The answer depends on which guard you asked, and you don't know that. So the famous solution is to ask a different, less direct question:

> If I asked the other guard which door leads to my desire, what would she answer?

Now whatever answer you get, you choose the other door.

If the guard you ask tells the truth, she must give you the wrong answer, because that is what the liar would say. If the guard you ask lies, she must also give you the wrong answer, because she lies about the truthful guard's answer.

| Guard you ask | What happens | Door they point to |
| - | - | - |
| Truthful | Truthfully reports the liar's answer | Doom |
| Liar | Lies about the truthful guard's answer | Doom |

No matter which guard you ask, you get the wrong answer. So you choose the other door.

Your brain is good at guessing. Logic is what we use when guessing isn’t good enough.

> **Wizard's second rule**
>
> Tables don't lie.

## Boolean logic

Today we call this Boolean logic, after [George Boole](https://en.wikipedia.org/wiki/George_Boole). The tables above are called [truth tables](https://en.wikipedia.org/wiki/Truth_table).

Logic itself is much older, going back through the 17th century wizard Leibniz, to an ancient Greek wizard called Aristotle. Boolean logic is the smaller, stricter version that computers use today.

Boolean logic has only two values:

| Value   | Meaning                    |
| ------- | -------------------------- |
| `true`  | yes, on, present, allowed  |
| `false` | no, off, absent, forbidden |

Boolean logic is at the core of modern programming. It is at the core of computers. Everything your computer does for you is built, eventually, on Boolean logic: true and false, 1 and 0.

Most Boolean operations combine two terms. Let's call them `p` and `q`. Just like our guards, we don't know whether they are true or false. But using truth tables, we can reason about them anyway.

The operations are: `and`, `or` and `not`.

| q | not q |
| - | - |
| true | false |
| false | true |

| p or q | q = true | q = false |
| - | - | - |
| p = true | true | true |
| p = false | true | false |

And of course:

| p and q | q = true | q = false |
| - | - | - |
| p = true | true | false |
| p = false | false | false |

Combining these, we can also create `nor` and `nand`.

| p nor q | q = true | q = false |
| - | - | - |
| p = true | false | false |
| p = false | false | true |

| p nand q | q = true | q = false |
| - | - | - |
| p = true | false | true |
| p = false | true | true |

Wait a minute... what is this `nand` thing? Why not just write `not and`?

Well... it so happens that your computer can implement just about everything with only [`nand` logic](https://en.wikipedia.org/wiki/NAND_logic). All other operations can be written as combinations of one or more NANDs. Hardware wizards found ways to create tiny [NAND _gates_](https://en.wikipedia.org/wiki/NAND_gate), and from those gates built the tiny parts of modern CPUs.

Tables don't lie, but people do. And we like it. So much that we've invented something entirely new. Something clever and diabolical, called language.
