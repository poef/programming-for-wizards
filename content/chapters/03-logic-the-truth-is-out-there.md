---
tags: programming for wizards
---

# Logic: the truth is out there

## Riddle me this

<!-- paragraph-id: p-03-you-are-standing-before-two-doors-one-door -->
You are standing before two doors. One door leads to your desire. The other leads to your doom. Before the doors are two guards. They both know which door leads where. One guard always lies. The other always tells the truth.

<!-- paragraph-id: p-03-you-may-ask-one-question -->
You may ask one question.

<!-- paragraph-id: p-03-obviously-you-need-to-ask-a-question-that -->
Obviously, you need to ask a question that reveals which door to use. But the obvious question doesn't work.

<!-- aside-id: aside-03-which-door-should-i-choose -->
> Which door should I choose?

<!-- paragraph-id: p-03-if-you-ask-the-truthful-guard-shell-point -->
If you ask the truthful guard, she'll point to your desire. If you ask the lying guard, she'll point to your doom. Since you don't know which guard you're asking, the answer is useless. Let's put both possibilities in a table:

| Guard you ask | Door they point to |
| - | - |
| Truthful | Desire |
| Liar | Doom |

<!-- paragraph-id: p-03-that-doesnt-help-the-answer-depends-on-which -->
That doesn't help. The answer depends on which guard you asked, and you don't know that. So the famous solution is to ask a different, less direct question:

<!-- aside-id: aside-03-if-i-asked-the-other-guard-which-door -->
> If I asked the other guard which door leads to my desire, what would she answer?

<!-- paragraph-id: p-03-now-whatever-answer-you-get-you-choose-the -->
Now whatever answer you get, you choose the other door.

<!-- paragraph-id: p-03-if-the-guard-you-ask-tells-the-truth -->
If the guard you ask tells the truth, she must give you the wrong answer, because that is what the liar would say. If the guard you ask lies, she must also give you the wrong answer, because she lies about the truthful guard's answer.

| Guard you ask | What happens | Door they point to |
| - | - | - |
| Truthful | Truthfully reports the liar's answer | Doom |
| Liar | Lies about the truthful guard's answer | Doom |

<!-- paragraph-id: p-03-no-matter-which-guard-you-ask-you-get -->
No matter which guard you ask, you get the wrong answer. So you choose the other door.

<!-- paragraph-id: p-03-your-brain-is-good-at-guessing-logic-is -->
Your brain is good at guessing. Logic is what we use when guessing isn’t good enough.

<!-- rule-id: rule-03-wizards-second-rule -->
> **Wizard's second rule**
>
> Tables don't lie.

## Boolean logic

<!-- paragraph-id: p-03-today-we-call-this-boolean-logic-after-george -->
Today we call this Boolean logic, after [George Boole](https://en.wikipedia.org/wiki/George_Boole). The tables above are called [truth tables](https://en.wikipedia.org/wiki/Truth_table).

<!-- paragraph-id: p-03-logic-itself-is-much-older-going-back-through -->
Logic itself is much older, going back through the 17th century wizard Leibniz, to an ancient Greek wizard called Aristotle. Boolean logic is the smaller, stricter version that computers use today.

<!-- paragraph-id: p-03-boolean-logic-has-only-two-values -->
Boolean logic has only two values:

| Value   | Meaning                    |
| ------- | -------------------------- |
| `true`  | yes, on, present, allowed  |
| `false` | no, off, absent, forbidden |

<!-- paragraph-id: p-03-boolean-logic-is-at-the-core-of-modern -->
Boolean logic is at the core of modern programming. It is at the core of computers. Everything your computer does for you is built, eventually, on Boolean logic: true and false, 1 and 0.

<!-- paragraph-id: p-03-most-boolean-operations-combine-two-terms-lets-call -->
Most Boolean operations combine two terms. Let's call them `p` and `q`. Just like our guards, we don't know whether they are true or false. But using truth tables, we can reason about them anyway.

<!-- paragraph-id: p-03-the-operations-are-and-or-and-not -->
The operations are: `and`, `or` and `not`.

| q | not q |
| - | - |
| true | false |
| false | true |

| p or q | q = true | q = false |
| - | - | - |
| p = true | true | true |
| p = false | true | false |

<!-- paragraph-id: p-03-and-of-course -->
And of course:

| p and q | q = true | q = false |
| - | - | - |
| p = true | true | false |
| p = false | false | false |

<!-- paragraph-id: p-03-combining-these-we-can-also-create-nor-and -->
Combining these, we can also create `nor` and `nand`.

| p nor q | q = true | q = false |
| - | - | - |
| p = true | false | false |
| p = false | false | true |

| p nand q | q = true | q = false |
| - | - | - |
| p = true | false | true |
| p = false | true | true |

<!-- paragraph-id: p-03-wait-a-minute-what-is-this-nand-thing -->
Wait a minute... what is this `nand` thing? Why not just write `not and`?

<!-- paragraph-id: p-03-well-it-so-happens-that-your-computer-can -->
Well... it so happens that your computer can implement just about everything with only [`nand` logic](https://en.wikipedia.org/wiki/NAND_logic). All other operations can be written as combinations of one or more NANDs. Hardware wizards found ways to create tiny [NAND _gates_](https://en.wikipedia.org/wiki/NAND_gate), and from those gates built the tiny parts of modern CPUs.

## This much is true

<!-- paragraph-id: p-03-what-does-all-this-logic-trickery-do-for -->
What does all this logic trickery do for you? Well, you can reason with it, of course. But doing so can become difficult pretty quickly. For example, when is this logic equation true?

<!-- code-id: code-03-code-not-p-and-not-q-and-r -->
```
(not p and not q and r) 
or (not p and q and r) 
or (p and q and r) 
or (p and not q and r)
```

<!-- paragraph-id: p-03-unless-you-are-a-computer-you-probably-struggle -->
Unless you are a computer, you probably struggle coming up with the answer. A truth table won't help you here, there are three variables, not two. It becomes difficult to see the pattern. But there is a slightly different truth table that may help: A [Karnaugh map](https://en.wikipedia.org/wiki/Karnaugh_map):

| p \ qr | 00 | 01 | 11 | 10 |
| ------ | -- | -- | -- | -- |
| 0      | 0  | 1  | 1  | 0  |
| 1      | 0  | 1  | 1  | 0  |

<!-- paragraph-id: p-03-instead-of-true-and-false-were-using-1 -->
Instead of `true` and `false`, we're using `1` and `0`, but they mean the same thing.

<!-- paragraph-id: p-03-the-column-headings-now-show-a-combination-of -->
The column headings now show a combination of both `q` and `r`, in an unusual order. The trick is that this order makes sure that only one of those values changes when you move to the left or the right. So each column shows answers that only differ in one detail, one input, compared to the columns next to them.

<!-- paragraph-id: p-03-what-you-probably-noticed-immediately-is-that-the -->
What you probably noticed immediately is that the `true` outputs, the `1`s, are clustered in a block in the middle. If you look carefully, in that block both `p` and `q` vary, while `r` stays the same. So the output always matches the value of `r`. 

<!-- paragraph-id: p-03-you-can-simplify-the-whole-equation-to-just -->
You can simplify the whole equation to just `r` and get the same result.

<!-- paragraph-id: p-03-the-map-did-not-change-the-equation-it -->
The map did not change the equation, it only changed how it was written down. It contains the same answers as a truth table would. The only thing that changes is that we chose a notation that allows you to see the patterns.

<!-- paragraph-id: p-03-a-useful-notation-changes-what-you-can-easily -->
A useful notation changes what you can easily express and see.

<!-- paragraph-id: p-03-tables-dont-lie-but-people-do-and-we -->
Tables don't lie, but people do. And we like it. So much that we've invented something entirely new. Something clever and diabolical, called language.
