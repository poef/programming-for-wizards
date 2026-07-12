---
tags: programming for wizards
---

# Code exhibit: extending JavaScript with JAQT

The previous chapter introduced the concept of a domain-specific language as a way to focus on a specific problem, without worrying about the outside world. But it left out a little trick. 

You can create a DSL with its own parser or compiler. But you don't always have to.

Sometimes the language you need is already hiding inside the language you're using. You add a few conventions, a few helper functions, and suddenly ordinary JavaScript starts to read like a little query language.

That distinction matters. A separate parser creates a hard border. On one side is PHP, JavaScript, Python, or whatever language your program is written in. On the other side is your new little language. Once you cross that boundary, you no longer have access to all the useful things from the host language. Functions, imports, editor help, error messages, test tools, and familiar habits.

Sometimes that border is worth it. SQL is not JavaScript, and that is part of its power. Regular expressions are their own dense, cursed little world, and we keep using them because the curse is useful.

But borders are expensive. So before we build one, it is worth asking a wizard's question:

> What if the language we need is already hiding inside the language we have?

Now, for this example, we'll wade into the deeper waters of JavaScript. Don't worry if you didn't bring your wellies. You can watch from the bank. The code should reveal the trick anyway.

## A pile of little records

Imagine we have some people:

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

A list of objects like this is not a database, but it starts to smell like one. We have records. They have fields. Some fields contain other records. Sooner or later we want to ask questions.

For example:

> Give me the people whose last name starts with `O` and who live in Manchester. Then return only the bits I want to show.

The most direct version is a loop:

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

This is fine. It works. But the question is hidden inside walking, checking, and pushing. We wanted to talk about people, names, and cities.

JavaScript already gives us a nicer shape:

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

This is better. `filter()` says which records survive. `map()` says what shape they become.

Still, there is a small itch. The word `person` is everywhere. The input shape and the output shape are present, but buried in repeated property access. 

A common mistake is to notice this itch and immediately summon a parser.

## The tempting new language

It is easy to imagine a prettier notation:

```txt id="w69i9s"
from people
where lastName startsWith "O"
and address.city = "Manchester"
select firstName, lastName, address.city, fullName as label
```

This is attractive. It looks like a query. It removes the repeated `person`. It gives the problem a language of its own.

But now the text is not JavaScript. JavaScript cannot run it. We need tokens, grammar rules, a parse tree, a translator, and our own error messages. If we want `startsWith`, we must define that operation in the new language. If we want to use an existing JavaScript helper, we need a way to smuggle that helper across the border.

Again, this can be a good trade. SQL earns its border. A query string that can be sent to a database server, optimized, explained, logged, and permission-checked is doing work that ordinary JavaScript cannot do by itself.

Our little array of people does not need that much ceremony yet. The bill would come due before the language had earned it.

So let's try a smaller spell.

## A question can be a function

JavaScript functions are themselves values. That fact gives us a useful opportunity.

```js id="oa4e35"
const startsWith = prefix => value => value.startsWith(prefix)
const fullName = person => `${person.firstName} ${person.lastName}`
```

`startsWith("O")` returns a function. Later, that function can be given a last name and decide whether it matches.

So instead of inventing syntax for every operation, we can carry little pieces of behavior around as JavaScript values.

This is not a DSL yet, but it opens the door to making one.

## A shape can be a question

The next step is to stop writing the whole predicate by hand.

Suppose we write the question as an object:

```js id="rt25sv"
const pattern = {
    lastName: startsWith("O"),
    address: {
        city: "Manchester"
    }
}
```

This object looks like the data. That is the trick. A pattern shaped like the data can describe what we want from the data.

Static values mean: this field must equal this value.

Functions mean: call this function with the field value.

Nested objects mean: go down into the nested object and continue matching there.

Here is a small matcher:

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

And now we can use it with normal `filter()`:

```js id="x4l9yb"
const result = people.filter(person => matches(pattern, person))
```

Still not a DSL, but the question is already easier to see.

## The result also has a shape

Filtering is only half the problem. We also want to say what the result should look like.

We need one tiny marker:

```js id="sr68jo"
const _ = Symbol("copy this property")
```

In the real [JAQT](https://github.com/muze-nl/jaqt/), which this is inspired by, `_` does more. In this exhibit version, it only means: copy the property with this name.

Now we can describe the result:

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

This says: copy `firstName`, copy `lastName`, copy `address.city`, and calculate `label` by calling `fullName`.

A small projector can interpret that shape:

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

And again, we can use it without leaving JavaScript:

```js id="wmlcgg"
const result = people
    .filter(person => matches(pattern, person))
    .map(person => project(personCard, person))
```

We are now close to a query language, but every part of it is still JavaScript. We did not create a new border--we've extended the territory.

## Giving the shape a few words

The code still uses `filter()` and `map()` directly. There is nothing wrong with that, but the query would be easier to read if it had a few words of its own.

We can wrap the array:

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

That is almost embarrassingly small. `where()` wraps `filter()`. `select()` wraps `map()`. `value()` gives the array back.

But the words matter. `where`, `select`, and `value` are not decoration. They are the little language becoming visible.

Now the query can read like this:

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

The result is:

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

This is not real JAQT. It is a small wooden model of the bridge. Real JAQT has a more capable `_`, more operations, and a lot more practical edge-case handling. Libraries are where edge cases go to start families.

The point of the model is the shape.

## The whole exhibit version

Here is the complete tiny version in one place:

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

It is small enough to be disappointing, which is usually a good sign.

## Composing inside the host language

The reward for staying inside JavaScript is that composition keeps working.

We can make little pieces:

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

And combine them with JavaScript itself:

```js id="ucz6xq"
const result = from(people)
    .where({
        ...inCity("Manchester"),
        ...lastNameStartsWith("O")
    })
    .select(personCard)
    .value()
```

The spread operator did not need to be added to our DSL. It was already in JavaScript. Arrow functions did not need to be added. Imports did not need to be added. Tests did not need to be added. The surrounding language remains available.

Every piece of it is still JavaScript, so it works with all the other JavaScript you already have. It can be tested and reused like any other code. There are just a few new words to learn.

## The border question

This does not mean every DSL should be embedded in a host language.

Sometimes you want the hard border. A database server cannot run arbitrary JavaScript helper functions every time someone sends it a query. A configuration file should be boring data, not a program in disguise. A language used by non-programmers may need its own guardrails, error messages, and vocabulary.

A host-language DSL has its own dangers. If the conventions are too weak, it dissolves back into ordinary code. If the tricks are too clever, readers have to learn JavaScript and your secret dialect of JavaScript at the same time.

So the question is not whether separate DSLs are bad and embedded DSLs are good.

The question is where the boundary belongs.

A parser version of a DSL puts the boundary around a new query language. The JAQT-shaped version moves the boundary inward. JavaScript remains the language. The DSL is the shape of a few objects, a handful of functions, and an agreement about what certain positions mean.
