---
tags: programming for wizards
---

# Numbers: hiding calculations in symbols

How do you make a number bigger than your fingers?

That sounds like a childish question, but it is one of the first great programming questions. You have a thing in the world. You need to represent it. The first representation works for a while. Then the world grows larger than the representation, and the representation starts fighting you.

Numbers are a good place to begin because they look natural. They are not. Number systems are inventions. Interfaces. Little machines for doing work in your head.

> **Interactive exhibit placeholder: `numbers-are-machines`**
>
> Let the reader enter a number and switch between tally marks, Roman numerals, abacus columns, decimal, binary, octal and hexadecimal. Each switch should show which calculation is hidden in the notation. Adding `1` should visibly create carry in decimal and binary.

## Numbers, numbers, numbers

Its no secret that programming is based on numbers. Two of them, 0 and 1. It may come as a surprise to some that one of those numbers is much newer than the other.

Lets go back, way back, back into time, when the only people who existed were cavemen, cavewomen, troglodytes.

These, our ancestors, probably counted using their fingers. Holding up one or more fingers, you can count to 10 using two hands. But what if you want to add numbers to your cave painting? Well, you make tally marks: IIII etc.

So the first number we used, was 1, or I. But tally marks get cumbersome quickly. So someone invented a new symbol to mark 5 tallies: <img src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Tally_marks-Five-bar_Gate.svg" style="height:1em">

And so it stayed for quite a while. Untill a roman (or probably someone else and the romans just stole the idea) had the idea to add symbols for other numbers. So we got X for 10. And the romans redesigned the tally marks further. I, II and III remained the same, but 4 became IV, 5 became V and 6 became VI. 

What the romans invented here was that you could write a calculation to describe the number. 4 is written as V minus I. The minus operation is indicated by writing the I before the V. If you write it after the V, it is V plus I, or 6.

The simple rule is that smaller marks before larger marks mean subtraction. If they are placed after larger marks, they mean addition. The romans got creative after X and invented marks for 50, 100, 500, 1000 and 5000. They didn't need numbers bigger than that apparantly. (Well, actually, a wizard somewhere says, they also had bars you could add on top of a mark to multiply its value by 1000... so there's that.)

So as an example, what does the roman numeral MMXXI translate to in our arabic numerals? (Yes, they are arabic in origin, I'll get to that, patience.) Or what about MCMXCVIII? And we're still just around 2000. Roman numerals still get unwieldy fairly quickly. But its better than tally marks.

Notice we've come from the cavemen period, at least 35.000 years ago all the way to the romans, and we still have to do without 0.

But lets step back a bit and introduce the abacus. This simple devices' origins are unknown. It could be that its been invented multiple times. We know for certain that it was in use by the roman era, they probably stole it from the greeks. Who may have gotten it from egyptians or babylonians, who probably got it from the sumerians. 

This may be a good first rule of programming for wizards: 

## Wizards first rule: steal

Its better to steal a good idea, rather than trying to come up with your own.

Anyway, back to the abacus. Lets show one for those who haven't seen one yet:

<img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Abacus_6.png">

This is a chinese version, you could probably find its like still in use all over the world today. The idea is simple, each column represents a number between 1 and 10. The upper beads denote 5, the lower beads denote 1. An observant wizard may spot a discrepancy here. Couldn't you do with one less upper and lower bead? Well, yes you could. Its a kind of magic.

But much more important is that here, again, the system introduces a calculation into the representation of numbers. Its different from the roman one, and its much more consistent and still in use today. Its the idea that each column is multiplied by a number. The right most column is multiplied by |, so not much change there. The one next to it is multiplied by X, the next one by C, the next by M and so on. Except of course the romans had trouble writing numbers bigger than about M, without trickery.

It is lot easier to explain if I use arabic numerals. They use the exact same multiplication by column as the abacus does. The rightmost column is multiplied by 1, the next is multiplied by 10, then 100, then 1000 and so on.

And here we have for the first time the number 0. Without it, arabic numerals are impossible. 

As a side note, the idea of a [number 0](https://en.wikipedia.org/wiki/0) is much older than this. But its status was not well established. How can a number, or anything, be nothing, the mathematicians of the time asked. But with the idea of a positional notation, the status of 0 as a true number became standardized. 

As another aside, I should probably call the arabic numerals [hindu numerals](https://en.wikipedia.org/wiki/Hindu%E2%80%93Arabic_numeral_system) instead. It seems the arabs stole the idea from the hindu, who had been using these for a few hundred years already. See wizards first rule.

Now back to large numbers. Using the position to multipy each numeral to describe large numbers, we can create very large numbers. Much larger than we usually need, say on a market square haggling over the price of a chicken. And all this by multiplying by 10.

But there is another calculation hidden inside these numbers. This is called '[modular arithmetic](https://en.wikipedia.org/wiki/Modular_arithmetic)'. The idea is that we can divide a number by another number, and instead of using the resulting fraction, we only use the remainder of the division. So 12 modulo 10 is 2. And in arabic numberals each position is filled with a number from 0 to 9, which matches the modulo 10 operation exactly.

Why is this important? Well, this insight opens the way for the first calculator. A mechanical device that can add and subtract numbers. It does so using a carry mechanism. You can see these still in use today in simple counting devices. Each position of a large number is represented with a wheel with the numbers 0 to 9 on it. Each click moves the rightmost wheel one position, using 10 gearing pins attached to the wheel. When the number displayed is 9 and you click the counter, the wheel continues to 0. The wheel to the left of it is then pushed forward by the single gearing pin attached to the first wheel on the other side. This pin only engages when moving from 9 to 0. This is called the carry, and it carries 1 from the right wheel to the left wheel, so multiplying it by 10.

<img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Detail_of_a_Roth_Calculating_machine.png">

[Blaise Pascal](https://en.wikipedia.org/wiki/Blaise_Pascal) is credited with making the first usable mechanical calculator. It could add and subtract, and with repeated motions also multiply and divide. Its not a computer yet, but we've come a long way from scratch marks.

I should mention the [Antikythera device](https://en.wikipedia.org/wiki/Antikythera_mechanism). This is a device from the classic greek era, which is purported to be able to calculate astronomical positions and eclipses. It is called the earliest (analogue) computer, it has been dated to somewhere between 205BC and 87BC. [The next time we know of that a device of similar complexity was made, we're in the renaissance in western europe](https://www.nature.com/articles/444534a).

To really understand how much of a leap this is, just take a look back at our timeline of numbers. Around 100BC is before the invention of 0, before positional notation and the carry mechanism. Yet some greek wizard, probably from Rhodes, made this device still.

This leads to wizards first rule's corollary:

## Wizards first rule, corollary: Your creation will probably outlive you, so document it.

We're getting pretty good at writing large numbers. We can write down 1,000,000 and read it without blinking an eye. But science is progressing and making up bigger numbers faster than we can write them down. How about the number of atoms in the universe? Or even bigger, all the possible move variations in the game of chess?

To write that number down you will need a number with at least 111 0's. Clearly that is no longer practical. So enter the scientific notation, where we add another calculation as part of the notation of a number: exponents.

$$
2 \times 10^{111}
$$

But we can also use these to explain the positional nature of arabic numerals:

| $$ \times 10^{2} $$  | $$ \times 10^{1} $$ | $$ \times 10^{0} $$ |
| - | - | - |
| 9 | 7 | 2 |

So the number 972 is equal to $$ 9 \times 10^2 + 7 \times 10^1 +2 \times 10^0 $$

So what about our original two numbers, 1 and 0. Well, if you understand the magic of positional notation, it turns out that you don't actually need all 10 numerals on each position.

You can use any amount of numbers, like 16 for hexadecimal numbers, e.g:

$$
    0x1F   = 1 \times 16 + 15
$$

*$0x$ is just a convention to say 'this is a hexadecimal number', and since there are 16 single position numerals, we've A to F as placeholders for 11 to 16.*

Or octal, with 8 numerals per position:

$$
    017 = 1 \times 8 + 7
$$

Or, minimize it two two numbers, 1 and 0 and you get binary:

$$
    11 = 1 \times 2 + 1
$$

And using exponents, we can explain it a bit better:

| $$ \times 2^{2} $$  | $$ \times 2^{1} $$ | $$ \times 2^{0} $$ |
| - | - | - |
| 1 | 0 | 1 |

Which means that the binary number 101 is equal to

$$
    1 \times 2^2 + 0 \times 2^1 + 1 \times 2^0
$$

This simplifies to

$$
    1 \times 4 + 1 = 5
$$


Binary numbers are so ubiquitous in programming, that you'll see the powers of 2 around a lot. So here are the first few:

| $2^{10}$ | $2^9$ | $2^8$ | $2^7$ | $2^6$ | $2^5$ | $2^4$ | $2^3$ | $2^2$ | $2^1$ | $2^0$  |
| - | - | - | - | - | - | - | - | - | - | - |
|1024 | 512 | 256 | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

This is a good time to end our archaeological dig through numbers. There is quite a bit more to explore, but you can do that yourself. The web contains all the information you need and more.

The important thing for now is this: every number system we saw did work for us. Tally marks counted. Roman numerals embedded small calculations. Positional notation made zero necessary. The carry mechanism turned notation into machinery. Binary made the smallest useful alphabet large enough to build a computer.

> **Wizard rule**
>
> A notation is not just a way to write something down. A good notation performs part of the work for you.
