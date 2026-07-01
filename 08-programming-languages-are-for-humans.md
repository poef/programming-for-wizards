---
tags: programming for wizards
---

# Programming languages are for humans

A few chapters ago we looked at language as magic. Human language does not merely carry thoughts around; it changes what kinds of thoughts are easy to have.

Programming languages do the same thing, but with less tolerance for ambiguity and more semicolons.

This chapter returns to that idea, but now turns it toward programming proper. A programming language is not primarily a machine interface. It is a human thinking tool that happens to be precise enough for a machine to execute.

> **Interactive exhibit placeholder: `same-program-many-languages`**
>
> Show one tiny program in machine code, assembly, COBOL, Fortran, Lisp and a modern language. Let the reader reveal comments and structure step by step. The point is not to rank languages; the point is to feel which ideas each language makes cheap or expensive.

## Computer languages

A common misconception is that programming languages are designed to allow you to program computers. If that was the only reason, there wouldn't be that many programming languages. A computer doesn't need a programming language, humans do. Computers are perfectly fine executing instructions like this:


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
        LOAD = 0x7400				; Buffer address

0x7744	016701	BEGIN:	MOV	DEVICE, R1	; Get Device CSR
0x7746	000026
0x7750	012702	LOOP:	MOV	(PC)+, R2	; Get buffer offset
0x7752	000352	OFFSET:	.-LOAD
0x7754	005211	        INC	@R1		; Turn on reader
0x7756	105711	READY:	TSTB	@R1		; Done?
0x7760	100376	        BPL	READY
0x7762	116162	        MOVB	2(R1), LOAD(R2)	; Transfer
0x7764	000002
0x7766	0x7400
0x7770	005267		INC	OFFSET		; Bump buffer offset
0x7772	177756
0x7774	000765		BR	LOOP
0x7776	177550	DEVICE:	177550			; Input device CSR address
```

This is the code to [make a PDP-11 computer boot](http://gunkies.org/wiki/PDP-11_Bootstrap_Loader). It is commonly known as [bootstrap](https://en.wikipedia.org/wiki/Bootstrapping) code.

Even in this enhanced, more human form, this code is not very readable. Or expressive. Most humans don't code in assembly language. Yet all programming languages get compiled, or interpreted, to convert it ultimately to machine code.

The earliest programming languages designed for humans, that are still in use, are [Fortran](https://en.wikipedia.org/wiki/Fortran), [Lisp](https://en.wikipedia.org/wiki/Lisp_%28programming_language%29) and [COBOL](https://en.wikipedia.org/wiki/COBOL). And they represent completely different visions on what a programming language should be. 

Cobol is designed to be as human readable as possible. It is explicitly designed to an English-like grammar. Its intended use was in business settings. It was both very successful and almost universally hated. 

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

Believe it or not, cobol is still in use today. The code above is copied from a current (2022) manual for [DB2](https://www.ibm.com/products/db2), an IBM database system that runs on their [z/OS](https://www.ibm.com/products/zos) mainframes. These in themselves are an evolution of the famous [OS/360](https://en.wikipedia.org/wiki/OS/360) mainframes of the 1960s. I'm not sure if this is a wizards rule, but if it is, it is:

_Bad ideas and bad code never die, they will infect other programmers and proliferate faster than any good idea ever will._

Fortran, then, is a better language. It is the first imperative programming language. It influenced almost all of the programming languages in existence today. And it is still used and useful in scientific and numeric computing. Here is an example in Fortran 77:

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

Finally we arrive at Lisp. A wizard called [John McCarthy](https://en.wikipedia.org/wiki/John_McCarthy_%28computer_scientist%29) dreamed up Lisp between 1956 and 1958. He succeeded in creating both the most succint and most expressive programming language. And this still holds today. The Lisp compiler, when written in Lisp, is remarkable small:

```cl
(defun null. (x)
  (eq x '()))

(defun and. (x y)
  (cond (x (cond (y 't) ('t '())))
        ('t '())))

(defun not. (x)
  (cond (x '())
        ('t 't)))

(defun append. (x y)
  (cond ((null. x) y)
        ('t (cons (car x) (append. (cdr x) y)))))

(defun list. (x y)
  (cons x (cons y '())))

(defun pair. (x y)
  (cond ((and. (null. x) (null. y)) '())
        ((and. (not. (atom x)) (not. (atom y)))
         (cons (list. (car x) (car y))
               (pair. (cdr x) (cdr y))))))

(defun assoc. (x y)
  (cond ((eq (caar y) x) (cadar y))
        ('t (assoc. x (cdr y)))))

(defun eval. (e a)
  (cond
    ((atom e) (assoc. e a))
    ((atom (car e))
     (cond
       ((eq (car e) 'quote) (cadr e))
       ((eq (car e) 'atom)  (atom   (eval. (cadr e) a)))
       ((eq (car e) 'eq)    (eq     (eval. (cadr e) a)
                                    (eval. (caddr e) a)))
       ((eq (car e) 'car)   (car    (eval. (cadr e) a)))
       ((eq (car e) 'cdr)   (cdr    (eval. (cadr e) a)))
       ((eq (car e) 'cons)  (cons   (eval. (cadr e) a)
                                    (eval. (caddr e) a)))
       ((eq (car e) 'cond)  (evcon. (cdr e) a))
       ('t (eval. (cons (assoc. (car e) a)
                        (cdr e))
                  a))))
    ((eq (caar e) 'label)
     (eval. (cons (caddar e) (cdr e))
            (cons (list. (cadar e) (car e)) a)))
    ((eq (caar e) 'lambda)
     (eval. (caddar e)
            (append. (pair. (cadar e) (evlis. (cdr e) a))
                     a)))))

(defun evcon. (c a)
  (cond ((eval. (caar c) a)
         (eval. (cadar c) a))
        ('t (evcon. (cdr c) a))))

(defun evlis. (m a)
  (cond ((null. m) '())
        ('t (cons (eval.  (car m) a)
                  (evlis. (cdr m) a)))))
```

This is in fact a complete Lisp interpreter, written in Common Lisp. It is a translation of McCarthy's original, by a wizard called Paul Graham, in his [Roots of Lisp](http://www.paulgraham.com/rootsoflisp.html) article.

The power of Lisp is that it allows you to write code using almost any paradigm. For anything any other programming language can do, you can write Lisp code that does the same.

However, I lied a bit earlier. There is one other early programming language I didn't mention. And it is older than all these. It is called [lambda calculus](https://plato.stanford.edu/entries/lambda-calculus/), and it was first designed in the 1930's by a wizard called [Alonzo Church](https://en.wikipedia.org/wiki/Alonzo_Church). Lambda calculus is still in use today, and growing more influential, as functional programming. Below is an example written in [Miranda](https://en.wikipedia.org/wiki/Miranda_%28programming_language%29).


```miranda
hanoi 0 a b c = [] 
hanoi (n+1) a b c = hanoi n a c b
                    move a b
                    hanoi n c b a
move a b = "move the top disc from "++a++" to "++b++"\n"
```

These three lines of code solve the wellknown [Towers of Hanoi](https://en.wikipedia.org/wiki/Tower_of_Hanoi) problem. Just like Lisp, or perhaps even more so, functional programming is both powerful and expressive.  

## Differences, commonalities and why we can't have nice things

Computer languages are more commonly known as programming languages. They are designed to make a computer do something. Did you spot the lie?

Programming languages are designed, unlike human languages. However they aren't designed to make a computer do anything, they are designed so you, a human, can reason and communicate about what it is that you want the computer to do. This may seem like a small difference, but it is in fact the reason behind the proliferation of programming languages.

Just like human languages, a programming languages make it easier for some ideas to be expressed than others. The best programming language allows you to freely express all the ideas you need to solve a problem in as simple and straightforward a way as possible. And they do so with a minimum of required learning.

Unfortunately thats also not true. You see, almost anyone will tell you that, yes, Lisp is the most powerful yet simple programming language out there. And yet almost no one is actually using it in anger. Why?

The problem is communication. Not between the human wizard and their computer. The problem is communicating ideas between humans. You see, languages like Lisp are so powerful, you can create any existing paradigm or programming language idea in it. But the expression of that idea will be your own custom take on that idea. Any other wizard that wants to work with your ideas, your code, will have to learn your version, your implementation of these ideas. And lord help them if you thought up some crazy new ideas.

The problem in general is that reading code is hard. It is much easier to write code. This sounds nonsensical, yet it is true. It is the source of the [NIH syndrome](https://en.wikipedia.org/wiki/Not_invented_here) (Not Invented Here.)

One answer is to make programming languages bigger. Add more standard stuff. Add design patterns. Add frameworks. Make sure all programmers are fed the same cookie-cutter solutions, so all code starts to look roughly the same. Create frameworks that force all problems into a [Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) solution on top of an [Object-Relational Mapper](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). Boom :boom:, done!

There is a reason this keeps happening. Shared shapes make code easier to read. If every project invents its own private universe, every project becomes a new country with its own customs, grammar and strange little hand gestures. A framework gives everyone the same street names.

But there is a cost. Once the shared language becomes too large, the real problem starts to disappear underneath the standard machinery. You are no longer saying what your program means. You are saying how this particular framework wants the meaning to be dressed.

So the natural pressure on programming languages is strange. Small powerful languages are wonderful for the writer, but dangerous for the reader. Large standard languages are easier to share, but they also make it harder to say unusual things simply.

Just like human languages.

A wizard should be aware of this tension. You do not escape it by choosing the one true language, because the one true language does not exist. You escape it, when you can, by making the language of the program fit the problem more closely.

That is where [Domain Specific Languages](https://martinfowler.com/dsl.html) become interesting.

A DSL is not automatically a separate language with a parser and a manual. Sometimes it is. [SQL](https://en.wikipedia.org/wiki/SQL) is its own world, and for good reasons. But sometimes a DSL is smaller than that. It can be a handful of names, a few conventions, a shape in the data, a chain of functions, a way of arranging code so the important ideas stand next to each other.

The next chapter is an exhibit of that smaller kind of language. We will not build a grand new syntax. We will look for a little query language hiding inside JavaScript.

> **Wizard rule**
>
> Code, like language, should clarify, not hide intent.
