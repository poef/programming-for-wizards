---
tags: programming for wizards
---

# Teaching machines our words

A few chapters ago we looked at language as magic. Human language does not merely carry thoughts around; it changes what kinds of thoughts are easy to have.

Programming languages do the same thing, but with less tolerance for ambiguity and more semicolons.

This chapter returns to that idea, but now turns it toward programming proper. A programming language is not primarily a machine interface. It is a human thinking tool that happens to be precise enough for a machine to execute.

## Computer languages

A common misconception is that programming languages are designed to allow you to program computers. If that were the only reason, there wouldn't be that many programming languages. A computer doesn't need a programming language. Humans do. Computers are perfectly fine executing instructions like this:

```
037744 016701 000026 012702 000352 005211 105711 100376 
116162 000002 037400 005267 177756 000765 177550
```

This [machine code](https://en.wikipedia.org/wiki/Machine_code) is written in octal, to make it slightly more readable for humans. But the first really usable step is to write it as [assembly code](https://en.wikipedia.org/wiki/Assembly_language):

```
037744: 016701 000026          MOV   037776,R1
037750: 012702 000352          MOV   #352,R2
037754: 005211                 INC   @R1
037756: 105711                 TSTB  @R1
037760: 100376                 BPL   037756
037762: 116162 000002 037400   MOVB  2(R1),37400(R2)
037770: 005267 177756          INC   037752
037774: 000765                 BR    037750
037776: 177550                 .WORD 177550
```

And now with some labels and comments:

```
        LOAD = 0x7400                 ; Buffer address

0x7744  016701  BEGIN: MOV DEVICE, R1 ; Get Device CSR
0x7746  000026
0x7750  012702  LOOP:  MOV (PC)+, R2  ; Get buffer offset
0x7752  000352  OFFSET: .-LOAD
0x7754  005211         INC @R1        ; Turn on reader
0x7756  105711  READY: TSTB @R1       ; Done?
0x7760  100376         BPL READY
0x7762  116162         MOVB 2(R1), LOAD(R2) ; Transfer
0x7764  000002
0x7766  0x7400
0x7770  005267         INC OFFSET     ; Bump buffer offset
0x7772  177756
0x7774  000765         BR LOOP
0x7776  177550  DEVICE: 177550        ; Input device CSR address
```

This is the code to [make a PDP-11 computer boot](http://gunkies.org/wiki/PDP-11_Bootstrap_Loader). It is commonly known as [bootstrap](https://en.wikipedia.org/wiki/Bootstrapping) code.

Even in this enhanced, more human form, this code is not very readable. Or expressive. Most humans don't code in assembly language. In the end, the machine still gets instructions. The programming language exists because humans need to think, read, change, and share those instructions.

That is why there are so many programming languages. Different humans need different thoughts to be cheap.

[COBOL](https://en.wikipedia.org/wiki/COBOL) was designed to make business programs look more like business language. Its intended use was in offices, banks, governments, and large institutions. That does not make it beautiful. It does make it interesting. COBOL made records, reports, procedures, and money moving through organizations easier to say.

```cobol
/
IDENTIFICATION DIVISION.
*-----------------------
PROGRAM-ID.    UNLDBCU1
*
ENVIRONMENT DIVISION.
*
CONFIGURATION SECTION.
DATA DIVISION.
*
WORKING-STORAGE SECTION.
*
01  WORKAREA-IND.
       02  WORKIND PIC S9(4) COMP OCCURS 750 TIMES.
01  RECWORK.
       02  RECWORK-LEN PIC S9(8) COMP VALUE 32700.
       02  RECWORK-CHAR PIC X(1) OCCURS 32700 TIMES.
*
PROCEDURE DIVISION.
*
        CALL 'UNLDBCU2' USING WORKAREA-IND RECWORK.
        GOBACK.
```

Believe it or not, COBOL is still in use today. The code above is copied from a current manual for [DB2](https://www.ibm.com/products/db2), an IBM database system that runs on [z/OS](https://www.ibm.com/products/zos) mainframes. These are descendants of the famous [OS/360](https://en.wikipedia.org/wiki/OS/360) mainframes of the 1960s.

That is not an accident. Business software tends to outlive the people who wrote it. Once a language becomes part of the machinery of an institution, replacing it becomes a social, economic, and political problem. Not just a technical one.

[Fortran](https://en.wikipedia.org/wiki/Fortran) made a different bet. It was built for scientists and engineers. It made formulas, arrays, loops, and numerical work cheap. Here is an example in Fortran 77:

```fortran
PROGRAM MAIN
INTEGER N, X
EXTERNAL SUB1
COMMON /GLOBALS/ N
X = 0
PRINT *, 'Enter number of repeats'
READ (*,*) N
CALL SUB1(X,SUB1)
END

SUBROUTINE SUB1(X,DUMSUB)
INTEGER N, X
EXTERNAL DUMSUB
COMMON /GLOBALS/ N
IF(X .LT. N)THEN
  X = X + 1
  PRINT *, 'x = ', X
  CALL DUMSUB(X,DUMSUB)
END IF
END
```

COBOL and Fortran are not just old languages. They are old answers to different questions. What should business code look like? What should scientific code look like? What should the programmer be allowed to say directly?

Finally we arrive at [Lisp](https://en.wikipedia.org/wiki/Lisp_%28programming_language%29). A wizard called [John McCarthy](https://en.wikipedia.org/wiki/John_McCarthy_%28computer_scientist%29) dreamed up Lisp between 1956 and 1958. Lisp made a stranger bet: code and data could have almost the same shape.

That sounds like a technical detail until you feel what it does. Lisp doesn't just make it possible to solve problems. It makes it cheap to build little languages for solving problems.

Here is a tiny example:

```lisp
(defmacro unless (condition &body body)
  `(if (not ,condition)
       (progn ,@body)))
```

This adds a new word to the language: `unless`. After that, programmers can write code in terms of the idea they mean, instead of spelling out the smaller pieces every time.

That is why Lisp keeps returning in conversations about programming languages, not because everyone should use it, or because parentheses are secretly beautiful if you stare long enough. But because Lisp makes language-building visible.

A Lisp interpreter can be written in Lisp itself. Paul Graham shows one in [Roots of Lisp](http://www.paulgraham.com/rootsoflisp.html), based on McCarthy's original. That is a very wizardly trick: the language can describe a machine that runs the language.

## Differences, commonalities, and why we can't have nice things

Computer languages are more commonly known as programming languages. They are designed to make a computer do something. Did you spot the lie?

Programming languages are designed, unlike human languages. However, they aren't designed to make a computer do anything. They are designed so you, a human, can reason and communicate about what it is that you want the computer to do. This may seem like a small difference, but it is in fact the reason behind the proliferation of programming languages.

Just like human languages, programming languages make it easier for some ideas to be expressed than others. The best programming language allows you to freely express all the ideas you need to solve a problem in as simple and straightforward a way as possible. And it does so with as little required learning as possible.

Unfortunately, that's also not true.

The problem is communication. Not between the human wizard and the computer. The problem is communicating ideas between humans. Small, powerful languages are seductive because they let you create your own vocabulary. But every private vocabulary has a cost. Any other wizard who wants to work with your ideas, your code, will have to learn your version: your implementation, your little country with its own customs, grammar, and strange hand gestures.

> **Wizard's seventh rule**
>
> The bill always comes due.

Reading code is hard. It is much easier to write code. This sounds nonsensical, yet it is true. It is the source of the [NIH syndrome](https://en.wikipedia.org/wiki/Not_invented_here): Not Invented Here.

One answer is to make programming languages bigger. Add more standard stuff. Add design patterns. Add frameworks. Make sure all programmers are fed the same cookie-cutter solutions, so all code starts to look roughly the same. Create frameworks that force all problems into a [Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) solution on top of an [Object-Relational Mapper](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). Boom, done!

There is a reason this keeps happening. Shared shapes make code easier to read. If every project invents its own private universe, every project becomes a new country with its own customs, grammar, and strange little hand gestures. A framework gives everyone the same street names.

But there is a cost. Once the shared language becomes too large, the real problem starts to disappear underneath the standard machinery. You are no longer saying what your program means. You are saying how this particular framework wants the meaning to be dressed.

So the natural pressure on programming languages is strange. Small, powerful languages are wonderful for the writer, but dangerous for the reader. Large, standard languages are easier to share, but they also make it harder to say unusual things simply.

Just like human languages.

A wizard should be aware of this tension. You do not escape it by choosing the one true language, because the one true language does not exist. You escape it, when you can, by making the language of the program fit the problem more closely.

That is where [domain-specific languages](https://martinfowler.com/dsl.html) become interesting.

A DSL is not automatically a separate language with a parser and a manual. Sometimes it is. [SQL](https://en.wikipedia.org/wiki/SQL) is its own world, and for good reasons. But sometimes a DSL is smaller than that. It can be a handful of names, a few conventions, a shape in the data, a chain of functions, a way of arranging code so the important ideas stand next to each other.

But before we build one, we need to notice something stranger: every program already contains a language of its own.