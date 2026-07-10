---
tags: programming for wizards
---

# Numbers: bigger than you think

How do you make a number bigger than your fingers?

It's no secret that programming is based on numbers. Two of them, 0 and 1. It may come as a surprise that one of those numbers is much newer than the other. 

Let's go back, way back, to the first number system our cave-dwelling ancestors ever used: our fingers.

Hold up your hands and you can count to 10. But what if you want to add a number to your cave painting? Well, you make [tally marks](https://en.wikipedia.org/wiki/Tally_marks): `IIII`.

So the first number we used was `1`, or the tally mark: `I`. But tally marks get cumbersome quickly. So someone invented a new symbol to mark 5 tallies: <img src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Tally_marks-Five-bar_Gate.svg" style="height:1em">

And so it stayed for quite a while. Until a Roman (or probably someone else, and the Romans just stole the idea) had the idea to add symbols for other numbers. So we got `X` for 10. And the Romans redesigned the tally marks further. `I`, `II` and `III` remained the same, but 4 became `IV`, 5 became `V` and 6 became `VI`. 

What the Romans invented here was that you could write a calculation to describe the number. 4 is written as `V` minus `I`. The minus operation is indicated by writing the `I` before the `V`. If you write it after the `V`, it is `V` plus `I`, or 6.

The simple rule is that smaller marks before larger marks mean subtraction. If they are placed after larger marks, they mean addition. The Romans got creative after `X` and invented marks for 50, 100, 500, 1000 and 5000. They didn't need numbers bigger than that apparently. (Well, actually, a wizard somewhere says, they also had bars you could add on top of a mark to multiply its value by 1000... so there's that.)

So as an example, what does the [Roman numeral](https://en.wikipedia.org/wiki/Roman_numerals) `MMXXI` translate to in our [Arabic numerals](https://en.wikipedia.org/wiki/Hindu%E2%80%93Arabic_numeral_system)? Yes, we call them Arabic numerals. No, the story is not quite that simple. Patience.

Now what about `MCMXCVIII`? And we're still just around 2000. Roman numerals still get unwieldy fairly quickly. But it's better than tally marks.

Notice we've come from the age of cave paintings, at least 35,000 years ago, all the way to the Romans, and we still have to do without `0`.

But let's step back a bit and introduce the [abacus](https://en.wikipedia.org/wiki/Abacus). This simple device's origins are unknown, and it may have been invented more than once. We know for certain that it was in use by the Roman era; they probably stole it from the Greeks, who may have gotten it from Egyptians or Babylonians, who probably got it from the Sumerians. 

By now, you may have noticed a pattern. Everyone is stealing from everyone else.

That's how good ideas travel. They get copied, renamed, improved and eventually taught to children as if they had always existed.

> **Wizard's first rule**
>
> Steal the good stuff.

Anyway, back to the abacus. Let's show one for those who haven't seen one yet:

<img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Abacus_6.png">

This is a Chinese version; you could probably find something like it still in use around the world today. The idea is simple: each column represents one position in a number. The upper beads denote 5, the lower beads denote 1. An observant wizard may spot a discrepancy here. Couldn't you do with one less upper and lower bead? Well, yes you could. It's a kind of magic.

But much more important is that here, again, the system introduces a calculation into the representation of numbers. It's different from the Roman one, and it's much more consistent and still in use today. It's the idea that each column is multiplied by a number. The rightmost column is multiplied by `I`, so not much change there. The one next to it is multiplied by `X`, the next one by `C`, the next by `M` and so on. Except of course the Romans had trouble writing numbers bigger than about `M`, without trickery.

It's a lot easier to explain if I use Arabic numerals. They use the exact same multiplication by column as the abacus does. The rightmost column is multiplied by 1, the next is multiplied by 10, then 100, then 1000 and so on.

And here, for the first time in our story, we have the number `0`. You can write `11`, but how do you write 'one ten and no ones'? Zero fills that hole elegantly.

As a side note, the idea of a [number 0](https://en.wikipedia.org/wiki/0) is much older than this. But its status was not well established. The mathematicians of the time asked how a number, or anything, could be nothing. With [positional notation](https://en.wikipedia.org/wiki/Positional_notation), `0` became not just a placeholder, but as a number in its own right. 

As another aside, I should probably call Arabic numerals Hindu numerals instead. It seems the Arabs got the idea from Indian mathematicians, who had been using these symbols for a few hundred years already. (See the wizard's first rule.)

Now back to large numbers. By using position to multiply each numeral, we can write very large numbers. Much larger than we usually need, say on a market square haggling over the price of a chicken. And all this by multiplying by 10.

But there is another calculation hidden inside these numbers. This is called [modular arithmetic](https://en.wikipedia.org/wiki/Modular_arithmetic). The idea is that we can divide a number by another number, and instead of using the result of that division, we only keep the remainder. So 12 modulo 10 is 2. And in Arabic numerals each position is filled with a number from 0 to 9, which matches the modulo 10 operation exactly.

Why is this important? Well, this insight opens the way for mechanical calculators: devices that can add and subtract numbers. They do so using a carry mechanism. You can see these still in use today in simple counting devices. Each position of a large number is represented with a wheel with the numbers 0 to 9 on it. Each click moves the rightmost wheel one position, using 10 gearing pins attached to the wheel. When the number displayed is 9 and you click the counter, the wheel continues to 0. The wheel to the left of it is then pushed forward by the single gearing pin attached to the first wheel on the other side. This pin only engages when moving from 9 to 0. This is called the carry, and it carries 1 from the right wheel to the left wheel, effectively multiplying it by 10.

<img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Detail_of_a_Roth_Calculating_machine.png">

[Blaise Pascal](https://en.wikipedia.org/wiki/Blaise_Pascal) is credited with making one of the first usable mechanical calculators. It could add and subtract, and with repeated motions also multiply and divide. It's not a computer yet, but we've come a long way from scratch marks.

I should mention the [Antikythera device](https://en.wikipedia.org/wiki/Antikythera_mechanism). This is a device from the classical Greek era, which is thought to have been able to calculate astronomical positions and eclipses. It is called the earliest analog computer. It has been dated to somewhere between 205 BC and 87 BC. [The next time we know of that a device of similar complexity was made, we're in the Renaissance in Western Europe](https://www.nature.com/articles/444534a).

To really understand how much of a leap this is, just take a look back at our timeline of numbers. Around 100 BC is before the invention of 0, before positional notation and the carry mechanism. Yet some Greek wizard, perhaps from Rhodes, still managed to make this device.

We're getting pretty good at writing large numbers. We can write down 1,000,000 and read it without blinking an eye. But science is progressing and making up bigger numbers faster than we can write them down. How about the number of atoms in the universe? Or even bigger, all the possible move sequences in the game of chess?

To write that number down, you will need a number with at least 111 zeros. Clearly that is no longer practical. So enter [scientific notation](https://en.wikipedia.org/wiki/Scientific_notation), where we add another calculation as part of the notation of a number: exponents.

$$
2 \times 10^{111}
$$

But we can also use these to explain the positional nature of Arabic numerals:

| $$ \times 10^{2} $$  | $$ \times 10^{1} $$ | $$ \times 10^{0} $$ |
| - | - | - |
| 9 | 7 | 2 |

So the number 972 is equal to $$ 9 \times 10^2 + 7 \times 10^1 + 2 \times 10^0 $$

So what about our original two numbers, `1` and `0`? Well, if you understand the magic of positional notation, it turns out that you don't actually need all 10 numerals in each position.

You can use any number of numerals, such as 16 for [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) numbers, for example:

$$
    0x1F   = 1 \times 16 + 15
$$

*`0x` is just a convention to say 'this is a hexadecimal number', and since there are 16 single-position numerals, we've got `A` to `F` as placeholders for 10 to 15.*

Or [octal](https://en.wikipedia.org/wiki/Octal), with 8 numerals per position:

$$
    0o17 = 1 \times 8 + 7
$$

Or reduce it to two numerals, `1` and `0`, and you get [binary](https://en.wikipedia.org/wiki/Binary_number):

$$
    11 = 1 \times 2 + 1
$$

And using exponents, we can explain it a bit better:

| $$ \times 2^{2} $$  | $$ \times 2^{1} $$ | $$ \times 2^{0} $$ |
| - | - | - |
| 1 | 0 | 1 |

This means that the binary number `101` is equal to

$$
    1 \times 2^2 + 0 \times 2^1 + 1 \times 2^0
$$

This simplifies to

$$
    1 \times 4 + 1 = 5
$$


Binary numbers are so ubiquitous in programming that you'll see the powers of 2 often. Here are the first few:

| $2^{10}$ | $2^9$ | $2^8$ | $2^7$ | $2^6$ | $2^5$ | $2^4$ | $2^3$ | $2^2$ | $2^1$ | $2^0$  |
| - | - | - | - | - | - | - | - | - | - | - |
|1024 | 512 | 256 | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

This is a good time to end our archaeological dig through numbers. We started with fingers and tally marks, and ended with two numerals that can represent any number a computer needs.

So how do you make a number bigger than your fingers? You invent a better way to write it down.
