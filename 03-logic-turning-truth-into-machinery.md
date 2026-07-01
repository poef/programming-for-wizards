---
tags: programming for wizards
---

# Logic: turning truth into machinery

You are standing before two doors. One door will lead to your desire, the other to your doom. Before the doors are two guards. They both know which door leads where. You know one of the guards always lies. The other will always tell the truth.

However, you may only ask one question.

This is a famous riddle, with a single correct answer. An answer you can reach by rigorously applying logic. Boolean logic. Logic with just true and false.

Obviously you need to ask one of the guards a question that will reveal which door to pass through. But if you ask either guard which door to choose, you cannot know if the guard lied to you or not.

| answer | guard lies | guard tells the truth |
| - | - | - |
| left door | your doom | your desire |
| right door | your doom | your desire |

Without more information, you cannot know which door to use. However, you can ask a slightly more convoluted question, that will let you know for sure which door to use.

The question is:

> If I would ask the other guard which door leads to my desire, what would she answer?

Now whatever answer you get, you choose the other door.

If the guard you ask tells the truth, she must give you the wrong answer, since that is what the other guard would say. If the guard you ask always lies, she must also give you the wrong answer, because she lies about the other guard's true answer.

No matter which guard you ask, you will get the wrong door. So you choose the other one.

> **Interactive exhibit placeholder: `truth-table-riddle`**
>
> Show the two-door riddle as a truth table. Let the reader toggle which guard lies and which door is correct. Then show the normal question failing, and the indirect question always returning the wrong door. The moment should be: logic is not cleverness, it is bookkeeping.

## Boolean logic

Today we call this Boolean Logic, named after the 19th century wizard George Boole. And the tables above are called truth tables. Logic has a much longer history, through the 17th century wizard Leibniz, all the way to an ancient Greek wizard called Aristotle.

But Boolean logic is at the core of modern programming. It is at the core of computers. In a sense all things your computer can do for you today are based on application of Boolean logic: true and false, 1 and 0.

The operations described by Boolean logic are mostly applied on two terms. Lets call them `p` and `q`. Just like our guards, we don't know whether they are true or false. But using the power of the truth table, we can reason about them anyway.

The operations are: `and`, `or`, `not`, and `iff`.

| not q | q = true | q = false |
| - | - | - |
| | false | true |

| p iff q | q = true | q = false |
| - | - | - |
| p = true | true | false |
| p = false | false | true |

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

Well... it so happens that your computer can implement everything with just `nand`. All other operations can be written as combinations of one or more nands. Hardware wizards found ways to create tiny nand _gates_, and from those gates built the tiny parts of modern CPUs.

This is the second great trick in this chapter. First we turned a riddle into a table. Then we turned the table into a machine.

That is a very wizardly move. When intuition gets unreliable, make the possible cases explicit. Then let the table reason for you.

> **Interactive exhibit placeholder: `nand-all-the-way-down`**
>
> Let the reader choose `and`, `or`, or `not`. Show the selected logic gate, then show the equivalent circuit made only from NAND gates. Include a truth table that updates as gates are composed.

> **Wizard rule**
>
> When intuition becomes unreliable, build a table. Then let the table reason for you.
