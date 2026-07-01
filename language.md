---
tags: programming for wizards
---
# Programming for wizards: Language

Language is magic. We're so used to it that we don't see it, but think about it. While you are reading this, I have the capability to inject my thoughts into your mind. I can control your mind! And even more magically, I can do this while being miles away, or I might even be dead. My mind to your mind. You don't need to be a Vulcan, just start writing.

Lets start at the very beginning. A very good place to start. We don't know exactly when humans started to use language. But we can be sure it was before we started to write. The capacity to use and create language seems built in to our DNA, literally. It is one thing that clearly seperates us from our earth co-habitants. Scientists guesstimate that our earliest forays into language started somewhere between 200.000 and 100.000 years ago. What that language was like is unknowable. We do know that, when we finally decided to start to write something, language was already splintered into many, many different and incompatible versions.

The one constant in our use of language seems to be that every generation mutates the language they use. There is no human language, in actual every day use, that survives for long periods without large changes. To use language is to change it. Which is fitting, because the world around us changes, so to describe it, we need a changing medium.

An interesting question related to this is: does language dictate what we can think? Or is it the other way around? We change language to better express what we think? Or is it both? Can some ideas only spread after someone changes the language to be able to express it?

Whatever it is, we use language to communicate our ideas to each other. However, language is just a limited part of the human experience. We used to think that our language processing center is limited to one half of our brain. Today it is accepted that it is more nuanced, but language processing and generation occupy only a small part of your brain.

Another way to look at it is by dividing your brain functions in to the fast and slow systems. A wizard called Daniel Kahneman wrote a book called 'Thinking, Fast and Slow', which you definitely should read. In it he argues that most of our thinking, about 98%, is in our so-called Fast System. This is commonly known as our subconscious. It is effortless, autonomous or automatic. It observes and evaluates. Only 2% of our thinking is in our Slow System. This is the conscious part, where we use language, where we plan, where we are self-aware.

Looking at these percentages, it is no wonder that he argues that our system 2, the slow system, is a slave to our fast system. Research indicates that we actually make most of our decisions in the fast system, before we consciously think about it. When we do think about it, the fast system is usually tasked with finding a reason to substantiate or support the decision we've already made. Then the mind does a final trick. It will make you believe that you made your decision based on these reasons. You did not, your decision was already made.

A simple rule I've found to be true: You cannot change someone's decision with rational arguments if that decision was based on emotion. Daniel Kahneman argues that by far the most of our decisions are so conceived. Therefor rational arguments are a poor tool to change someone's mind.

You, as a wizard, and specifically focused on programming, are quite unusual. You have taught yourself to think up a new world, not just in your slow system, but in fact in an even slower system than that, using formal language with arcane rules. You are not normal. You should not expect to be understood, nor should you expect to convince other people by using this wholy unnatural way of thinking.

This doesn't mean that you are better, or other people are somehow worse. It does mean you are different. If you want to be understood, if you want to convince people, if you want to change the world, it is up to you to make the effort.

Now, to be clear, I do not advocate manipulating people. There is long and bad history of demagogues that somehow understand how to turn good people into unruly mobs. They do this by explicitly targeting the fast system, using things like flags, showmanship, feelings of dented pride, fear, etc. But they also use things like comradeship, feelings of belonging, working together for a greater good. All these things are powerful and you should be wary of people wielding them. Even with good intentions, you may not end up in a good place.

## Computer languages

A common misconception is that programming languages are designed to allow you to program computers. If that was the only reason, there wouldn't be that many programming languages. A computer doesn't need a programming language, humans do. Computers are perfectly fine executing instructions like this:


```
037744 016701 000026 012702 000352 005211 105711 100376 
116162 000002 037400 005267 177756 000765 177550
```
This machine code is written in octal, to make it slightly more readable for humans. But the first really usable step is to write it as assembly code:

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

The earliest programming languages designed for humans, that are still in use, are Fortran, Lisp and Cobol. And they represent completely different visions on what a programming language should be. 

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

Believe it or not, cobol is still in use today. The code above is copied from a current (2022) manual for DB2, an IBM database system that runs on their Z/OS mainframes. These in themselves are an evolution of the famous OS/360 mainframes of the 1960s. I'm not sure if this is a wizards rule, but if it is, it is:

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

Finally we arrive at Lisp. A wizard called John McCarthy dreamed up Lisp between 1956 and 1958. He succeeded in creating both the most succint and most expressive programming language. And this still holds today. The Lisp compiler, when written in Lisp, is remarkable small:

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

However, I lied a bit earlier. There is one other early programming language I didn't mention. And it is older than all these. It is called lambda calculus, and it was first designed in the 1940's by a wizard called Alonzo Church. Lambda calculus is still in use today, and growing more influential, as functional programming. Below is an example written in [Miranda](https://en.wikipedia.org/wiki/Miranda_(programming_language)).


```miranda
hanoi 0 a b c = [] 
hanoi (n+1) a b c = hanoi n a c b
                    move a b
                    hanoi n c b a
move a b = "move the top disc from "++a++" to "++b++"\n"
```

These three lines of code solve the wellknown Towers of Hanoi problem. Just like Lisp, or perhaps even more so, functional programming is both powerful and expressive.  

## Differences, commonalities and why we can't have nice things

Computer languages are more commonly known as programming languages. They are designed to make a computer do something. Did you spot the lie?

Programming languages are designed, unlike human languages. However they aren't designed to make a computer do anything, they are designed so you, a human, can reason and communicate about what it is that you want the computer to do. This may seem like a small difference, but it is in fact the reason behind the proliferation of programming languages.

Just like human languages, a programming languages make it easier for some ideas to be expressed than others. The best programming language allows you to freely express all the ideas you need to solve a problem in as simple and straightforward a way as possible. And they do so with a minimum of required learning.

Unfortunately thats also not true. You see, almost anyone will tell you that, yes, Lisp is the most powerful yet simple programming language out there. And yet almost no one is actually using it in anger. Why?

The problem is communication. Not between the human wizard and their computer. The problem is communicating ideas between humans. You see, languages like Lisp are so powerful, you can create any existing paradigm or programming language idea in it. But the expression of that idea will be your own custom take on that idea. Any other wizard that wants to work with your ideas, your code, will have to learn your version, your implementation of these ideas. And lord help them if you thought up some crazy new ideas.

The problem in general is reading code is hard. It is much easier to write code. This sounds non-sensical, yet it is true. It is the source of the NIH syndrome (Not Invented Here.)

So what can we do to mitigate this? Simple, make programming languages bigger, add more standard stuff, add design patterns. In short, make sure all programmers are fed the same cookie-cutter solutions, so all code starts to look the same. Create frameworks that force all problems into a Model-View-Controller solution on top of an Object-Relation-Mapper. Boom :boom:, done!

Now all you need to do to understand a piece of software, is look for the differences. So the natural progression for programming languages is not to become smaller and more powerful, but bigger and less powerful.

Just like human languages.

As a wizard you should be aware of these forces, and fight them. And you can fight them using Domain Specific Languages (DSL's)

## Domain Specific Languages

Domain Specific Languages are just programming languages. In fact, FORTRAN is a DSL for math, COBOL is a DSL for ... ehm... lets forget about COBOL. But in general a DSL is much more limited than a normal programming language. It is small and simple, focused on single problem domain (hence the name.)

When you start using DSL's, you don't use a single programming language. You use many of them, and glue them together to form your program.

In fact, if you've done any programming, you have used the exact same ideas, though expressed less powerfully. Any time you create a variable or a function, or classes and methods, you are creating your own DSL, expressed within the limitations of your programming language.

You are continually extending your programming language, creating a new language in the process. Anyone reading your code must first learn this language. And while we start out young and amazingly adept at learning languages, as we grow up most of us lose this ability. Or at least it gets degraded. Unless you keep practicing.

You can make it easier for other people to learn your language. One way is to mimic existing languages. Design patterns fit into this approach. Another way is to keep your changes small. This approach leads to composable components. And finally, you can create real DSL's, that aren't limited to the syntax and capabilities of your source programming language. 

Creating a true DSL means that you have to create your own compiler and runtime. But it has the benefit of making the boundary between the DSL and the source programming language extremely clear. Done well, this boundary lines up well with a natural boundary in the problem domain. The best DSL's are so well known that we don't actually think of them as DSL's anymore. 

One example is Regular Expressions. Any non-trivial program will have them. Beginning programmers hate them, because they are so unreadable.. for the untrained.

Another example is SQL. Almost any software that uses a database, will have some SQL in it. It may be hidden behind an ORM, but it will be there.

Done correctly, a DSL allows you to divide your problem along natural boundaries in the domain. Then you can solve each sub-problem seperately. While you are solving that sub-problem, you don't have to think about the solution for other problems. You will not need to read code that isn't related. Your programming language doesn't need to have tools that aren't related to your current problem. DSL's allow you to have a high level view of the problem and not worry about low level implementation details.

But the most important thing to remember is that you are creating a new language whenever you add any variable, function, class or method. By being conscious of this, you can make sure that the language you are building is easy to learn, simple to use and expressive. Designed for humans, not computers.
