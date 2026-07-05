---
tags: programming for wizards
---

# Logic: turning truth into machinery

In the last chapter, we saw that a good notation can do some of the calculation for you. Logic does something similar for reasoning.

This matters because your brain is a wonderful machine, but it cheats. It guesses. It skips steps. It sees patterns that aren't there and misses patterns that are. Most of the time this is useful. Sometimes it gets you killed by a door.

You are standing before two doors. One door leads to your desire. The other leads to your doom. Before the doors are two guards. They both know which door leads where. One guard always lies. The other always tells the truth.

You may ask one question.

Obviously, you need to ask a question that reveals which door to use. But the obvious question doesn't work.

> Which door should I choose?

If you ask the truthful guard, she'll point to your desire. If you ask the lying guard, she'll point to your doom. Since you don't know which guard you're asking, the answer is useless.

The problem isn't that you're not clever enough. The problem is that the truth has the wrong shape. So we need to put it into a better one: a table.

If you ask a guard directly which door leads to your desire, the table looks like this:

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

No matter which guard you ask, you get the wrong door. So you choose the other one.

The trick isn't that you became smarter than the guards. It's that you asked a question that made both possible worlds collapse into the same answer. You made the uncertainty stop mattering. That is logic doing its work.

## Boolean logic

Today we call this Boolean logic, after [George Boole](https://en.wikipedia.org/wiki/George_Boole). The tables above are called [truth tables](https://en.wikipedia.org/wiki/Truth_table).

Boolean logic is brutally small. Everything gets squeezed into two values:

| Value   | Meaning                    |
| ------- | -------------------------- |
| `true`  | yes, on, present, allowed  |
| `false` | no, off, absent, forbidden |

That should feel familiar. In the last chapter, we squeezed numbers into symbols and columns. Here we squeeze reasoning into cases.

And once reasoning fits into cases, we can start building machinery around it.

Boolean logic is at the core of modern programming. It is at the core of computers. Everything your computer does for you is built, eventually, on Boolean logic: true and false, 1 and 0.

Most Boolean operations combine two terms. Let's call them `p` and `q`. Just like our guards, we don't know whether they are true or false. But using the power of the truth table, we can reason about them anyway.

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

Well... it so happens that your computer can implement everything with just `nand`. All other operations can be written as combinations of one or more NANDs. Hardware wizards found ways to create tiny [NAND _gates_](https://en.wikipedia.org/wiki/NAND_gate), and from those gates built the tiny parts of modern CPUs.

This is the second great trick in this chapter. First we turned a riddle into a table. Then we turned the table into a machine.

That is a very wizardly move. When intuition gets unreliable, make the possible cases explicit. Then let the table reason for you.

> **Interactive exhibit placeholder: `nand-all-the-way-down`**
>
> Let the reader choose `and`, `or`, or `not`. Show the selected logic gate, then show the equivalent circuit made only from NAND gates. Include a truth table that updates as gates are composed.

> **Wizard's second rule**
>
> Tables don't lie.
