---
tags: programming for wizards
---

# Code exhibit: extending JavaScript with JAQT

<!-- paragraph-id: p-10-the-previous-chapter-introduced-the-concept-of-a -->
The previous chapter introduced the concept of a domain-specific language as a way to focus on a specific problem, without worrying about the outside world. But it left out a little trick. 

<!-- paragraph-id: p-10-you-can-create-a-dsl-with-its-own -->
You can create a DSL with its own parser or compiler. But you don't always have to.

<!-- paragraph-id: p-10-sometimes-the-language-you-need-is-already-hiding -->
Sometimes the language you need is already hiding inside the language you're using. You add a few conventions, a few helper functions, and suddenly ordinary JavaScript starts to read like a little query language.

<!-- paragraph-id: p-10-that-distinction-matters-a-separate-parser-creates-a -->
That distinction matters. A separate parser creates a hard border. On one side is PHP, JavaScript, Python, or whatever language your program is written in. On the other side is your new little language. Once you cross that boundary, you no longer have access to all the useful things from the host language. Functions, imports, editor help, error messages, test tools, and familiar habits.

<!-- paragraph-id: p-10-sometimes-that-border-is-worth-it-sql-is -->
Sometimes that border is worth it. SQL is not JavaScript, and that is part of its power. Regular expressions are their own dense, cursed little world, and we keep using them because the curse is useful.

<!-- paragraph-id: p-10-but-borders-are-expensive-so-before-we-build -->
But borders are expensive. So before we build one, it is worth asking a wizard's question:

<!-- aside-id: aside-10-what-if-the-language-we-need-is-already -->
> What if the language we need is already hiding inside the language we have?

<!-- paragraph-id: p-10-now-for-this-example-well-wade-into-the -->
Now, for this example, we'll wade into the deeper waters of JavaScript. Don't worry if you didn't bring your wellies. You can watch from the bank. The code should reveal the trick anyway.

## A pile of little records

<!-- paragraph-id: p-10-imagine-we-have-some-people -->
Imagine we have some people:

<!-- code-id: q0mh6q -->
```js id="q0mh6q"
const people = [
    {
        firstName: "Hilda",
        lastName: "Ogden",
        address: {
            city: "Manchester"
        }
    },
    {
        firstName: "Stan",
        lastName: "Ogden",
        address: {
            city: "Manchester"
        }
    },
    {
        firstName: "Kevin",
        lastName: "Webster",
        address: {
            city: "Liverpool"
        }
    }
]
```

<!-- paragraph-id: p-10-a-list-of-objects-like-this-is-not -->
A list of objects like this is not a database, but it starts to smell like one. We have records. They have fields. Some fields contain other records. Sooner or later we want to ask questions.

<!-- paragraph-id: p-10-for-example -->
For example:

<!-- aside-id: aside-10-give-me-the-people-whose-last-name-starts -->
> Give me the people whose last name starts with `O` and who live in Manchester. Then return only the bits I want to show.

<!-- paragraph-id: p-10-the-most-direct-version-is-a-loop -->
The most direct version is a loop:

<!-- code-id: h7p0ep -->
```js id="h7p0ep"
const result = []

for (const person of people) {
    if (
        person.lastName.startsWith("O") &&
        person.address.city === "Manchester"
    ) {
        result.push({
            firstName: person.firstName,
            lastName: person.lastName,
            address: {
                city: person.address.city
            },
            label: `${person.firstName} ${person.lastName}`
        })
    }
}
```

<!-- paragraph-id: p-10-this-is-fine-it-works-but-the-question -->
This is fine. It works. But the question is hidden inside walking, checking, and pushing. We wanted to talk about people, names, and cities.

<!-- paragraph-id: p-10-javascript-already-gives-us-a-nicer-shape -->
JavaScript already gives us a nicer shape:

<!-- code-id: p9drf7 -->
```js id="p9drf7"
const result = people
    .filter(person =>
        person.lastName.startsWith("O") &&
        person.address.city === "Manchester"
    )
    .map(person => ({
        firstName: person.firstName,
        lastName: person.lastName,
        address: {
            city: person.address.city
        },
        label: `${person.firstName} ${person.lastName}`
    }))
```

<!-- paragraph-id: p-10-this-is-better-filter-says-which-records-survive -->
This is better. `filter()` says which records survive. `map()` says what shape they become.

<!-- paragraph-id: p-10-still-there-is-a-small-itch-the-word -->
Still, there is a small itch. The word `person` is everywhere. The input shape and the output shape are present, but buried in repeated property access. 

<!-- paragraph-id: p-10-a-common-mistake-is-to-notice-this-itch -->
A common mistake is to notice this itch and immediately summon a parser.

## The tempting new language

<!-- paragraph-id: p-10-it-is-easy-to-imagine-a-prettier-notation -->
It is easy to imagine a prettier notation:

<!-- code-id: w69i9s -->
```txt id="w69i9s"
from people
where lastName startsWith "O"
and address.city = "Manchester"
select firstName, lastName, address.city, fullName as label
```

<!-- paragraph-id: p-10-this-is-attractive-it-looks-like-a-query -->
This is attractive. It looks like a query. It removes the repeated `person`. It gives the problem a language of its own.

<!-- paragraph-id: p-10-but-now-the-text-is-not-javascript-javascript -->
But now the text is not JavaScript. JavaScript cannot run it. We need tokens, grammar rules, a parse tree, a translator, and our own error messages. If we want `startsWith`, we must define that operation in the new language. If we want to use an existing JavaScript helper, we need a way to smuggle that helper across the border.

<!-- paragraph-id: p-10-again-this-can-be-a-good-trade-sql -->
Again, this can be a good trade. SQL earns its border. A query string that can be sent to a database server, optimized, explained, logged, and permission-checked is doing work that ordinary JavaScript cannot do by itself.

<!-- paragraph-id: p-10-our-little-array-of-people-does-not-need -->
Our little array of people does not need that much ceremony yet. The bill would come due before the language had earned it.

<!-- paragraph-id: p-10-so-lets-try-a-smaller-spell -->
So let's try a smaller spell.

## A question can be a function

<!-- paragraph-id: p-10-javascript-functions-are-themselves-values-that-fact-gives -->
JavaScript functions are themselves values. That fact gives us a useful opportunity.

<!-- code-id: oa4e35 -->
```js id="oa4e35"
const startsWith = prefix => value => value.startsWith(prefix)
const fullName = person => `${person.firstName} ${person.lastName}`
```

<!-- paragraph-id: p-10-startswith-o-returns-a-function-later-that-function -->
`startsWith("O")` returns a function. Later, that function can be given a last name and decide whether it matches.

<!-- paragraph-id: p-10-so-instead-of-inventing-syntax-for-every-operation -->
So instead of inventing syntax for every operation, we can carry little pieces of behavior around as JavaScript values.

<!-- paragraph-id: p-10-this-is-not-a-dsl-yet-but-it -->
This is not a DSL yet, but it opens the door to making one.

## A shape can be a question

<!-- paragraph-id: p-10-the-next-step-is-to-stop-writing-the -->
The next step is to stop writing the whole predicate by hand.

<!-- paragraph-id: p-10-suppose-we-write-the-question-as-an-object -->
Suppose we write the question as an object:

<!-- code-id: rt25sv -->
```js id="rt25sv"
const pattern = {
    lastName: startsWith("O"),
    address: {
        city: "Manchester"
    }
}
```

<!-- paragraph-id: p-10-this-object-looks-like-the-data-that-is -->
This object looks like the data. That is the trick. A pattern shaped like the data can describe what we want from the data.

<!-- paragraph-id: p-10-static-values-mean-this-field-must-equal-this -->
Static values mean: this field must equal this value.

<!-- paragraph-id: p-10-functions-mean-call-this-function-with-the-field -->
Functions mean: call this function with the field value.

<!-- paragraph-id: p-10-nested-objects-mean-go-down-into-the-nested -->
Nested objects mean: go down into the nested object and continue matching there.

<!-- paragraph-id: p-10-here-is-a-small-matcher -->
Here is a small matcher:

<!-- code-id: v9dzxh -->
```js id="v9dzxh"
function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
}

function matches(pattern, item) {
    return Object.entries(pattern).every(([key, expected]) => {
        const actual = item?.[key]

        if (typeof expected === "function") {
            return expected(actual, item)
        }

        if (isObject(expected)) {
            return matches(expected, actual)
        }

        return actual === expected
    })
}
```

<!-- paragraph-id: p-10-and-now-we-can-use-it-with-normal -->
And now we can use it with normal `filter()`:

<!-- code-id: x4l9yb -->
```js id="x4l9yb"
const result = people.filter(person => matches(pattern, person))
```

<!-- paragraph-id: p-10-still-not-a-dsl-but-the-question-is -->
Still not a DSL, but the question is already easier to see.

## The result also has a shape

<!-- paragraph-id: p-10-filtering-is-only-half-the-problem-we-also -->
Filtering is only half the problem. We also want to say what the result should look like.

<!-- paragraph-id: p-10-we-need-one-tiny-marker -->
We need one tiny marker:

<!-- code-id: sr68jo -->
```js id="sr68jo"
const _ = Symbol("copy this property")
```

<!-- paragraph-id: p-10-in-the-real-jaqt-which-this-is-inspired -->
In the real [JAQT](https://github.com/muze-nl/jaqt/), which this is inspired by, `_` does more. In this exhibit version, it only means: copy the property with this name.

<!-- paragraph-id: p-10-now-we-can-describe-the-result -->
Now we can describe the result:

<!-- code-id: ndpu66 -->
```js id="ndpu66"
const personCard = {
    firstName: _,
    lastName: _,
    address: {
        city: _
    },
    label: fullName
}
```

<!-- paragraph-id: p-10-this-says-copy-firstname-copy-lastname-copy-address -->
This says: copy `firstName`, copy `lastName`, copy `address.city`, and calculate `label` by calling `fullName`.

<!-- paragraph-id: p-10-a-small-projector-can-interpret-that-shape -->
A small projector can interpret that shape:

<!-- code-id: h502kl -->
```js id="h502kl"
function project(shape, source, root = source) {
    return Object.fromEntries(
        Object.entries(shape).map(([key, rule]) => {
            if (rule === _) {
                return [key, source?.[key]]
            }

            if (typeof rule === "function") {
                return [key, rule(root, source)]
            }

            if (isObject(rule)) {
                return [key, project(rule, source?.[key] ?? {}, root)]
            }

            return [key, rule]
        })
    )
}
```

<!-- paragraph-id: p-10-and-again-we-can-use-it-without-leaving -->
And again, we can use it without leaving JavaScript:

<!-- code-id: wmlcgg -->
```js id="wmlcgg"
const result = people
    .filter(person => matches(pattern, person))
    .map(person => project(personCard, person))
```

<!-- paragraph-id: p-10-we-are-now-close-to-a-query-language -->
We are now close to a query language, but every part of it is still JavaScript. We did not create a new border--we've extended the territory.

## Giving the shape a few words

<!-- paragraph-id: p-10-the-code-still-uses-filter-and-map-directly -->
The code still uses `filter()` and `map()` directly. There is nothing wrong with that, but the query would be easier to read if it had a few words of its own.

<!-- paragraph-id: p-10-we-can-wrap-the-array -->
We can wrap the array:

<!-- code-id: xk67tk -->
```js id="xk67tk"
function from(items) {
    return {
        where(pattern) {
            return from(items.filter(item => matches(pattern, item)))
        },
        select(shape) {
            return from(items.map(item => project(shape, item)))
        },
        value() {
            return items
        }
    }
}
```

<!-- paragraph-id: p-10-that-is-almost-embarrassingly-small-where-wraps-filter -->
That is almost embarrassingly small. `where()` wraps `filter()`. `select()` wraps `map()`. `value()` gives the array back.

<!-- paragraph-id: p-10-but-the-words-matter-where-select-and-value -->
But the words matter. `where`, `select`, and `value` are not decoration. They are the little language becoming visible.

<!-- paragraph-id: p-10-now-the-query-can-read-like-this -->
Now the query can read like this:

<!-- code-id: p036fn -->
```js id="p036fn"
const result = from(people)
    .where({
        lastName: startsWith("O"),
        address: {
            city: "Manchester"
        }
    })
    .select({
        firstName: _,
        lastName: _,
        address: {
            city: _
        },
        label: fullName
    })
    .value()
```

<!-- paragraph-id: p-10-the-result-is -->
The result is:

<!-- code-id: g2h23j -->
```js id="g2h23j"
[
    {
        firstName: "Hilda",
        lastName: "Ogden",
        address: {
            city: "Manchester"
        },
        label: "Hilda Ogden"
    },
    {
        firstName: "Stan",
        lastName: "Ogden",
        address: {
            city: "Manchester"
        },
        label: "Stan Ogden"
    }
]
```

<!-- paragraph-id: p-10-this-is-not-real-jaqt-it-is-a -->
This is not real JAQT. It is a small wooden model of the bridge. Real JAQT has a more capable `_`, more operations, and a lot more practical edge-case handling. Libraries are where edge cases go to start families.

<!-- paragraph-id: p-10-the-point-of-the-model-is-the-shape -->
The point of the model is the shape.

<!-- aside-id: aside-10-this-trick-was-inspired-by-lisp-in-lisp -->
> This trick was inspired by Lisp. In Lisp, a macro can receive a piece of program before it is evaluated, inspect its shape and turn it into different code. JavaScript functions cannot do that: their arguments have already been evaluated before the function sees them. So JAQT takes a different route. It represents the query as an ordinary object, and puts functions in the places where the query needs behaviour that must wait until later. A Lisp version would probably use macros to turn the query into those functions. JAQT carries the unfinished behaviour around explicitly instead.

## The whole exhibit version

<!-- paragraph-id: p-10-here-is-the-complete-tiny-version-in-one -->
Here is the complete tiny version in one place:

<!-- code-id: jaqt-mini-complete -->
```js id="jaqt-mini-complete"
const _ = Symbol("copy this property")

function from(items) {
    return {
        where(pattern) {
            return from(items.filter(item => matches(pattern, item)))
        },
        select(shape) {
            return from(items.map(item => project(shape, item)))
        },
        value() {
            return items
        }
    }
}

function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
}

function matches(pattern, item) {
    return Object.entries(pattern).every(([key, expected]) => {
        const actual = item?.[key]

        if (typeof expected === "function") {
            return expected(actual, item)
        }

        if (isObject(expected)) {
            return matches(expected, actual)
        }

        return actual === expected
    })
}

function project(shape, source, root = source) {
    return Object.fromEntries(
        Object.entries(shape).map(([key, rule]) => {
            if (rule === _) {
                return [key, source?.[key]]
            }

            if (typeof rule === "function") {
                return [key, rule(root, source)]
            }

            if (isObject(rule)) {
                return [key, project(rule, source?.[key] ?? {}, root)]
            }

            return [key, rule]
        })
    )
}

const startsWith = prefix => value => value.startsWith(prefix)
const fullName = person => `${person.firstName} ${person.lastName}`
```

<!-- paragraph-id: p-10-it-is-small-enough-to-be-disappointing-which -->
It is small enough to be disappointing, which is usually a good sign.

## Composing inside the host language

<!-- paragraph-id: p-10-the-reward-for-staying-inside-javascript-is-that -->
The reward for staying inside JavaScript is that composition keeps working.

<!-- paragraph-id: p-10-we-can-make-little-pieces -->
We can make little pieces:

<!-- code-id: g2ce8l -->
```js id="g2ce8l"
const inCity = city => ({
    address: { city }
})

const lastNameStartsWith = prefix => ({
    lastName: startsWith(prefix)
})

const personCard = {
    firstName: _,
    lastName: _,
    label: fullName
}
```

<!-- paragraph-id: p-10-and-combine-them-with-javascript-itself -->
And combine them with JavaScript itself:

<!-- code-id: ucz6xq -->
```js id="ucz6xq"
const result = from(people)
    .where({
        ...inCity("Manchester"),
        ...lastNameStartsWith("O")
    })
    .select(personCard)
    .value()
```

<!-- paragraph-id: p-10-the-spread-operator-did-not-need-to-be -->
The spread operator did not need to be added to our DSL. It was already in JavaScript. Arrow functions did not need to be added. Imports did not need to be added. Tests did not need to be added. The surrounding language remains available.

<!-- paragraph-id: p-10-every-piece-of-it-is-still-javascript-so -->
Every piece of it is still JavaScript, so it works with all the other JavaScript you already have. It can be tested and reused like any other code. There are just a few new words to learn.

## The border question

<!-- paragraph-id: p-10-this-does-not-mean-every-dsl-should-be -->
This does not mean every DSL should be embedded in a host language.

<!-- paragraph-id: p-10-sometimes-you-want-the-hard-border-a-database -->
Sometimes you want the hard border. A database server cannot run arbitrary JavaScript helper functions every time someone sends it a query. A configuration file should be boring data, not a program in disguise. A language used by non-programmers may need its own guardrails, error messages, and vocabulary.

<!-- paragraph-id: p-10-a-host-language-dsl-has-its-own-dangers -->
A host-language DSL has its own dangers. If the conventions are too weak, it dissolves back into ordinary code. If the tricks are too clever, readers have to learn JavaScript and your secret dialect of JavaScript at the same time.

<!-- paragraph-id: p-10-so-the-question-is-not-whether-separate-dsls -->
So the question is not whether separate DSLs are bad and embedded DSLs are good.

<!-- paragraph-id: p-10-the-question-is-where-the-boundary-belongs -->
The question is where the boundary belongs.

<!-- paragraph-id: p-10-a-parser-version-of-a-dsl-puts-the -->
A parser version of a DSL puts the boundary around a new query language. The JAQT-shaped version moves the boundary inward. JavaScript remains the language. The DSL is the shape of a few objects, a handful of functions, and an agreement about what certain positions mean.
