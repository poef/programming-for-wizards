---
tags: programming for wizards
---

# Programming for wizards: logic


## Riddle me this

You are standing before two doors. One door will lead to your desire, the other to your doom. Before the doors are two guards, they both know which door leads where. You know one of the guards always lies. The other will always tell the truth. However, you may only ask one question.

This is a famous riddle, with a single correct answer. An answer you can reach by rigorously applying logic. Boolean logic. Logic with just true and false.

Obviously you will need to ask one of the guards a question that will reveal to you which door to pass through. But if you ask either of the guards which door to choose, or not to choose, you cannot know if the guard lied to you, or not.

<table>
    <tr>
        <th>answer</th><th>guard lies</th><th>guard tells the truth</th>
    </tr>
    <tr>
        <th>
            left door
        </th>
        <td>your doom</td>
        <td>your desire</td>
    </tr>
    <tr>
        <th>
            right door
        </th>
        <td>your doom</td>
        <td>your desire</td>
    </tr>
</table>

Without more information, you cannot know which door to use.

However, you can ask a slightly more convoluted question, that will let you know for sure which door to use.

The question is: _If I would ask the other guard which door leads to my desire, what would she answer?_

<table>
    <tr>
        <th>answer</th><th>guard lies</th><th>guard tells the truth</th>
    </tr>
    <tr>
        <th>
            left door
        </th>
        <td>your doom</td>
        <td>your doom</td>
    </tr>
    <tr>
        <th>
            right door
        </th>
        <td>your doom</td>
        <td>your doom</td>
    </tr>
</table>

So whatever the answer is, you now know that you must choose the _other_ door.

How can you know this? If the guard you ask the question, tells you the truth, she must give you the wrong answer, since that is what the _other_ guard would say.

If on the other hand, the guard you ask this question always lies, she must also give you the wrong answer.

No matter which guard you ask, you will get the wrong answer, so you choose to open the other door.

The reason this works can be encoded as a boolean logic problem. If you define a guard lying as a false statement, and a guard telling the truth as a true statement, then the question is defined as applying the _and_ operator on both guards answers. 

<table>
    <tr>
        <th></th><th>guard lies</th><th>guard tells the truth</th>
    </tr>
    <tr>
        <th>
            answer
        </th>
        <td>false and true</td>
        <td>true and false</td>
    </tr>
</table>

The and operator is defined like this:

<table>
    <tr>
        <th>and</th><th>true</th><th>false</th>
    </tr>
    <tr>
        <th>
           true     
        </th>
        <td>true</td>
        <td>false</td>
    </tr>
    <tr>
        <th>
           false
        </th>
        <td>false</td>
        <td>false</td>
    </tr>
</table>

So the only way to get the correct answer, is if both guards would tell the truth. But we know one will always lie. So the answer is always the wrong door.

## Boolean Logic

Today we call this Boolean Logic, named after the 19th century wizard George Boole. And the table above is called a truth table. 

Logic has a much longer history, through the 17th century wizard Leibniz, all the way to an ancient greek wizard called Aristotle.

But boolean logic is at the core of modern programming, it is at the core of computers. In a sense all things your computer can do for you today, is based on application of boolean logic, true and false, 1 and 0.

The operations described by boolean logic are mostly applied on two terms, lets call them p and q. Just like our guards we don't know whether they are true or false. But using the power of the truth table, we can reason about them anyway. 

The operations are: and, or, not, iff

Here are the remaining truth tables.

<table>
    <tr>
        <th>not q</th>
        <th>q = true</th>
        <th>q = false</th>
    </tr>
    <tr>
        <th></th>
        <td>false</td>
        <td>true</td>
    </tr>
</table>

<table>
    <tr>
        <th>iff q</th>
        <th>q = true</th>
        <th>q = false</th>
    </tr>
    <tr>
        <th></th>
        <td>true</td>
        <td>false</td>
    </tr>
</table>

<table>
    <tr>
        <th>p or q</th>
        <th>q = true</th>
        <th>q = false</th>
    </tr>
    <tr>
        <th>p = true</th>
        <td>true</td>
        <td>true</td>
    </tr>
    <tr>
        <th>p = false</th>
        <td>true</td>
        <td>false</td>
    </tr>
</table>

And of course:

<table>
    <tr>
        <th>p and q</th>
        <th>q = true</th>
        <th>q = false</th>
    </tr>
    <tr>
        <th>p = true</th>
        <td>true</td>
        <td>false</td>
    </tr>
    <tr>
        <th>p = false</th>
        <td>false</td>
        <td>false</td>
    </tr>
</table>

Combining these, we can also create:

<table>
    <tr>
        <th>p nor q</th>
        <th>q = true</th>
        <th>q = false</th>
    </tr>
    <tr>
        <th>p = true</th>
        <td>false</td>
        <td>false</td>
    </tr>
    <tr>
        <th>p = false</th>
        <td>false</td>
        <td>true</td>
    </tr>
</table>

<table>
    <tr>
        <th>p nand q</th>
        <th>q = true</th>
        <th>q = false</th>
    </tr>
    <tr>
        <th>p = true</th>
        <td>false</td>
        <td>true</td>
    </tr>
    <tr>
        <th>p = false</th>
        <td>true</td>
        <td>true</td>
    </tr>
</table>

Wait a minute... what is this nand thing? Why not just write not and? Well... it so happens that your computer actually implements only one of these logic operations. And it is the nand. All other operations can be written as combinations of just one or more nands. And hardware wizards have found ways to create tiny nand _gates_ that are the smallest part of modern computer CPU's.

Don;t believe me? [Take a look for yourself](https://en.wikipedia.org/wiki/NAND_logic).
