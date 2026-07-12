---
tags: programming for wizards
---

# Teaching machines our words

<!-- paragraph-id: p-08-a-common-misconception-is-that-programming-languages-are -->
A common misconception is that programming languages are designed to allow you to program computers. If that were the only reason, there wouldn't be that many programming languages. 

<!-- paragraph-id: p-08-a-computer-doesnt-need-a-programming-language-humans -->
A computer doesn't need a programming language. Humans do. 

<!-- paragraph-id: p-08-computers-are-perfectly-fine-executing-instructions-like-this -->
Computers are perfectly fine executing instructions like this:

<!-- code-id: code-08-code-037744-016701-000026-012702-000352-005211-105711 -->
```
037744 016701 000026 012702 000352 005211 105711 100376 
116162 000002 037400 005267 177756 000765 177550
```

<!-- paragraph-id: p-08-this-machine-code-is-written-in-octal-to -->
This [machine code](https://en.wikipedia.org/wiki/Machine_code) is written in octal, to make it slightly more readable for humans. But the first really usable step is to write it as [assembly code](https://en.wikipedia.org/wiki/Assembly_language):

<!-- code-id: code-08-code-037744-016701-000026-mov-037776-r1 -->
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

<!-- paragraph-id: p-08-and-now-with-some-labels-and-comments -->
And now with some labels and comments:

<!-- code-id: code-08-code-load-0x7400-buffer-address -->
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

<!-- paragraph-id: p-08-this-is-the-code-to-make-a-pdp -->
This is the code to [make a PDP-11 computer boot](http://gunkies.org/wiki/PDP-11_Bootstrap_Loader). It is commonly known as [bootstrap](https://en.wikipedia.org/wiki/Bootstrapping) code.

<!-- paragraph-id: p-08-even-in-this-enhanced-more-human-form-this -->
Even in this enhanced, more human form, this code is not very readable. Or expressive. Most humans don't code in assembly language. In the end, the machine still receives instructions. 

<!-- paragraph-id: p-08-the-programming-language-is-there-for-the-humans -->
The programming language is there for the humans who have to write and understand those instructions.

<!-- paragraph-id: p-08-cobol-was-designed-to-make-business-programs-look -->
[COBOL](https://en.wikipedia.org/wiki/COBOL) was designed to make business programs look more like business language. It was very successful and almost universally hated.

<!-- code-id: code-08-cobol -->
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

<!-- paragraph-id: p-08-believe-it-or-not-cobol-is-still-in -->
Believe it or not, COBOL is still in use today. The code above is copied from a current manual for [DB2](https://www.ibm.com/products/db2), an IBM database system that runs on [z/OS](https://www.ibm.com/products/zos) mainframes. These are descendants of the famous [OS/360](https://en.wikipedia.org/wiki/OS/360) mainframes of the 1960s.

<!-- paragraph-id: p-08-that-is-not-an-accident-business-software-tends -->
That is not an accident. Business software tends to outlive the people who wrote it. Once a language becomes part of the machinery of an institution, replacing it becomes a social, economic, and political problem. Not just a technical one.

<!-- paragraph-id: p-08-fortran-was-built-for-scientists-and-engineers-it -->
[Fortran](https://en.wikipedia.org/wiki/Fortran) was built for scientists and engineers. It made formulas, arrays, loops, and numerical work easier to express. 

<!-- paragraph-id: p-08-here-is-an-example-in-fortran-77 -->
Here is an example in Fortran 77:

<!-- code-id: code-08-fortran-program-main -->
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

<!-- paragraph-id: p-08-finally-we-arrive-at-lisp-a-wizard-called -->
Finally we arrive at [Lisp](https://en.wikipedia.org/wiki/Lisp_%28programming_language%29). A wizard called [John McCarthy](https://en.wikipedia.org/wiki/John_McCarthy_%28computer_scientist%29) dreamed up Lisp between 1956 and 1958. 

<!-- paragraph-id: p-08-lisp-is-both-very-small-and-absurdly-expressive -->
Lisp is both very small and absurdly expressive. More importantly for this chapter, it makes it unusually easy to add new words to the language.

<!-- paragraph-id: p-08-here-is-a-tiny-example -->
Here is a tiny example:

<!-- code-id: code-08-lisp-defmacro-unless-condition-body-body -->
```lisp
(defmacro unless (condition &body body)
  `(if (not ,condition)
       (progn ,@body)))
```

<!-- paragraph-id: p-08-that-is-why-lisp-keeps-returning-in-conversations -->
That is why Lisp keeps returning in conversations about programming languages, not because everyone should use it, or because parentheses are secretly beautiful if you stare long enough. But because Lisp makes language-building visible.

<!-- paragraph-id: p-08-a-lisp-interpreter-can-be-written-in-lisp -->
A Lisp interpreter can be written in Lisp itself. Paul Graham shows one in [Roots of Lisp](http://www.paulgraham.com/rootsoflisp.html), based on McCarthy's original. 

## Differences, commonalities, and why we can't have nice things

<!-- paragraph-id: p-08-computer-languages-are-more-commonly-known-as-programming -->
Computer languages are more commonly known as programming languages. They are designed to make a computer do something. Did you spot the lie?

<!-- paragraph-id: p-08-unlike-human-languages-programming-languages-are-designed-however -->
Unlike human languages, programming languages are designed. However, they aren't designed to make a computer do anything. They are designed so you, a human, can reason and communicate about what it is that you want the computer to do. This may seem like a small difference, but it is in fact the reason behind the proliferation of programming languages.

<!-- paragraph-id: p-08-just-like-human-languages-programming-languages-make-it -->
Just like human languages, programming languages make it easier for some ideas to be expressed than others. The best programming language allows you to freely express all the ideas you need to solve a problem in as simple and straightforward a way as possible. And it does so with as little required learning as possible.

<!-- paragraph-id: p-08-unfortunately-thats-also-not-true -->
Unfortunately, that's also not true.

<!-- paragraph-id: p-08-the-problem-is-communication-any-other-wizard-who -->
The problem is communication. Any other wizard who wants to work with your ideas, your code, will have to learn your version, your implementation of these ideas. And lord help them if you thought up some crazy new ideas.

<!-- paragraph-id: p-08-reading-code-is-hard-it-is-much-easier -->
Reading code is hard. It is much easier to write code. This sounds nonsensical, yet it is true. It is the source of the [NIH syndrome](https://en.wikipedia.org/wiki/Not_invented_here): Not Invented Here.

<!-- paragraph-id: p-08-one-answer-is-to-make-programming-languages-bigger -->
One answer is to make programming languages bigger. Add more standard stuff. Add design patterns. Add frameworks. Make sure all programmers are fed the same cookie-cutter solutions, so all code starts to look roughly the same. Create frameworks that force all problems into a [Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) solution on top of an [Object-Relational Mapper](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). Boom, done!

<!-- paragraph-id: p-08-there-is-a-reason-this-keeps-happening-code -->
There is a reason this keeps happening. Code is easier to read when everyone uses the same patterns.

<!-- paragraph-id: p-08-but-there-is-a-cost-eventually-the-patterns -->
But there is a cost. Eventually the patterns become the language. Instead of writing code to solve the problem, you are adding controllers, models, maps and whatever else the framework requires, so that it can solve the problem for you.

<!-- paragraph-id: p-08-so-the-natural-pressure-on-programming-languages-is -->
So the natural pressure on programming languages is not to become smaller and more powerful, but bigger and less powerful.

<!-- paragraph-id: p-08-small-powerful-languages-are-wonderful-for-the-writer -->
Small, powerful languages are wonderful for the writer, but dangerous for the reader. Large, standard languages are easier to share, but they also make it harder to say unusual things simply.

<!-- paragraph-id: p-08-just-like-human-languages -->
Just like human languages.

<!-- rule-id: rule-08-wizards-seventh-rule -->
> **Wizard's seventh rule**
>
> The bill always comes due.

<!-- paragraph-id: p-08-you-should-be-aware-of-this-tension-you -->
You should be aware of this tension. You do not escape it by choosing the one true language, because the one true language does not exist. You escape it, when you can, by making the language of the program fit the problem more closely.

<!-- paragraph-id: p-08-that-is-where-domain-specific-languages-come-in -->
That is where [domain-specific languages](https://martinfowler.com/dsl.html) come in.
