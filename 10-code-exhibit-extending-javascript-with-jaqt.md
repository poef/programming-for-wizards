---
tags: programming for wizards
---

# Code exhibit: extending JavaScript with JAQT

The previous chapter ended with the idea that every program contains a small language. That can sound a bit mystical, so in this chapter we are going to build one.

Not a real production-quality language. That would take us too far into the swamp. A small exhibit version. Something tiny enough to keep in your head, but large enough to show the trick.

A common way to create a small new language is to build a new language with a tokenizer, a parser and a translator. That is a valid way to make a DSL (Domain Specific Language). It is also the most obvious way: invent a new notation, then teach the computer how to read it.

But instead of building a new language from scratch, you can sometimes find a shape inside the language you're already using. Lets take Javascript for example. You add a few conventions, a few helper functions, and suddenly ordinary JavaScript starts to read like a little query language.

That distinction matters. A separate parser creates a border. On one side is PHP, JavaScript, Python or whatever language your program is written in. On the other side is your new little language. Once you cross that border, the things from the host language no longer come with you for free. Functions, imports, editor help, error messages, test tools, habits. They all need a passport.

Sometimes that border is worth it. SQL is not JavaScript, and that is part of its power. Regular expressions are their own dense, cursed little world, and we keep using them because the curse is useful.

But borders are expensive. So before we build one, it is worth asking a wizard's question:

> What if the language we need is already hiding inside the language we have?

> **Interactive exhibit placeholder: `jaqt-extension-lab`**
>
> Show the same query growing in stages: a loop, then `filter()` and `map()`, then small predicate functions, then an object-shaped pattern, then the final [JAQT](https://github.com/muze-nl/jaqt)-shaped query. Let the reader click a function such as `startsWith("O")` and watch it become a value that is stored, passed around and called later. The point is to make the host-language trick visible: no parser appears, because the query is already JavaScript.

## A pile of little records

Imagine we have some people:

```js id="q0mh6q"
const people = [
    {
        firstName: "Hilda",
        lastName: "Ogden",
        age: 62,
        address: {
            street: "Coronation Street",
            city: "Manchester"
        }
    },
    {
        firstName: "Stan",
        lastName: "Ogden",
        age: 64,
        address: {
            street: "Other Street",
            city: "Manchester"
        }
    },
    {
        firstName: "Kevin",
        lastName: "Webster",
        age: 28,
        address: {
            street: "Market Street",
            city: "Liverpool"
        }
    }
]
```

A pile of objects like this is not a database, but it starts to smell like one. We have records. They have fields. Some fields contain other records. Sooner or later we want to ask questions.

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
            city: person.address.city,
            label: `${person.firstName} ${person.lastName}`
        })
    }
}
```

This is fine. It says what to do. Walk through the people. Check each person. Push a smaller object into the result.

But the question is slightly hidden inside the instructions. The code spends quite a lot of its time telling JavaScript how to walk through an array and build another array. We did not really want to talk about walking and pushing. We wanted to talk about people, names and cities.

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
        city: person.address.city,
        label: `${person.firstName} ${person.lastName}`
    }))
```

This is better. The walking and pushing are gone. `filter()` says which records survive. `map()` says what shape they become.

Still, there is a small itch. The word `person` is everywhere. The shape of the input and the shape of the output are present, but they are buried in repeated property access. The query is visible, but it has not quite stepped forward.

A common wizard mistake is to notice this itch and immediately summon a parser.

## The tempting new language

It is easy to imagine a prettier notation:

```txt id="w69i9s"
from people
where lastName startsWith "O"
and address.city = "Manchester"
select firstName, lastName, address.city as city
```

This is attractive. It looks like a query. It removes the repeated `person`. It gives the problem a language of its own.

But now we have another problem. This text is not JavaScript. JavaScript cannot run it. So we need to tokenize it, parse it, build some kind of tree from it, and then turn that tree into something executable.

If we want `startsWith`, we must define that operation in the new language. If we want to use an existing JavaScript helper, we need a way to smuggle that helper across the border. If we want editor support, we need to teach the editor. If the user makes a mistake, we need to make our own error messages.

Again, this can be a good trade. SQL earns its border. A query string that can be sent to a database server, optimized, explained, logged and permission-checked is doing work that ordinary JavaScript cannot do by itself.

Our little array of people does not need that much ceremony yet.

So let us try a smaller spell.

## A question can be a function

JavaScript has one feature that looks ordinary but keeps opening trapdoors: functions are values.

You can put a function in a variable:

```js id="mre9w1"
const livesInManchester = person => person.address.city === "Manchester"
```

You can pass that function to another function:

```js id="cc90se"
const mancunians = people.filter(livesInManchester)
```

`filter()` does not know what counts as a match. It asks the function. The function is a small piece of delayed behavior. It is not the answer yet. It is a way to get an answer later, when a `person` is available.

You can also write a function that creates one of these little questions:

```js id="hlgk8c"
const olderThan = age => person => person.age > age

const isOlderThan40 = olderThan(40)

isOlderThan40({ age: 62 }) // true
isOlderThan40({ age: 28 }) // false
```

This is called [higher-order programming](https://en.wikipedia.org/wiki/Higher-order_function). The name sounds as if it was designed by people who wanted to keep the rabble out, but the idea is small enough:

A function can receive another function.
A function can return another function.
A function can be carried around like any other value.

That means we can make tiny reusable bits of query logic without inventing syntax for them:

```js id="oa4e35"
const startsWith = prefix => value => value.startsWith(prefix)
const fullName = person => `${person.firstName} ${person.lastName}`
```

`startsWith("O")` returns a function. Later, that function can be given a last name and decide whether it matches.

This is the first small step. We have not made a DSL yet. We have only noticed that JavaScript already has a way to treat behavior as data.

## A shape can be a question

The next step is to stop writing the whole predicate by hand.

Suppose we write the question as an object:

```js id="rt25sv"
{
    lastName: startsWith("O"),
    address: {
        city: "Manchester"
    }
}
```

This object looks a little like the data. That is the trick. A pattern shaped like the data can describe what we want from the data.

Static values mean: this field must equal this value.

Functions mean: call this function with the field value.

Nested objects mean: go down into the nested object and continue matching there.

Now the query is no longer hidden inside `person.lastName` and `person.address.city`. The fields we care about are visible as fields.

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
const pattern = {
    lastName: startsWith("O"),
    address: {
        city: "Manchester"
    }
}

const matchesPattern = person => matches(pattern, person)
const result = people.filter(matchesPattern)
```

This is already interesting. We did not parse a string. We did not create a second language. We gave an ordinary JavaScript object a new meaning.

## The result also has a shape

Filtering is only half the problem. We also want to say what the result should look like.

We could use `map()` directly:

```js id="dc9fuz"
const result = people
    .filter(person => matches(pattern, person))
    .map(person => ({
        firstName: person.firstName,
        lastName: person.lastName,
        city: person.address.city,
        label: fullName(person)
    }))
```

This is still good code. But we can try the same move again.

If an object can describe the shape we want to match, perhaps an object can also describe the shape we want to return.

We need one tiny marker. 

```js id="sr68jo"
const _ = Symbol("copy this property")
```

In the real JAQT, `_` does more. In this exhibit version, it only means: copy the property with this name.

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

We are now quite close to a query language, but we arrived one small step at a time.

A question became a function.

A pattern became an object.

A result shape became an object.

The host language did not disappear. It became the material.

## Giving the shape a few words

The code still uses `filter()` and `map()` directly. There is nothing wrong with that, but the shape would be easier to read if the query had a few words of its own.

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

That is almost embarrassingly small. `where()` is a thin wrapper around `filter()`. `select()` is a thin wrapper around `map()`. `value()` gives the array back.

But the words matter. They give the little language a surface.

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

This is not real JAQT. It is a small wooden model of the bridge. Real JAQT has a more capable `_`, more operations and a lot more practical edge-case handling. Libraries are where edge cases go to start families.

The point of the model is the shape.

The query looks like a query, but every piece of it is still JavaScript. The object literals are JavaScript. The nested objects are JavaScript. The functions are JavaScript. The method chain is JavaScript. The helper functions can be imported, named, tested and reused with no special bridge.

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

A parser would have felt more impressive. There would have been tokens, grammar rules, parse trees, maybe a compiler. We could have built a tiny kingdom.

If we had stopped at the previous chapter, this might not look like a true DSL at all. The previous chapter made the boundary sound much harder: a compiler, a runtime, a new little language separated from the old one.

That was the trap.

Those are real tools, and sometimes you need them. SQL needs its own world. Regular expressions are their own strange little machine. But a DSL is not made true by the size of the border around it. The important part is that a problem has been given a language that fits it.

This exhibit went in a smaller direction. Instead of building a new kingdom, we moved the problem slightly.

The query is no longer a string that must be understood by a new language. It is a JavaScript object whose shape carries meaning. The places where the query needs behavior are filled with JavaScript functions. The chain gives the object-shapes a readable path: start here, keep these, make this shape, give me the value.

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

The little query language did not become powerful because we cut it loose from JavaScript. It became useful because we found a small query-shaped hollow inside JavaScript and gave it a name.

## The border question

This does not mean every DSL should be embedded in a host language.

Sometimes you want the hard border. A database server cannot run arbitrary JavaScript helper functions every time someone sends it a query. A configuration file should perhaps be boring data, not a program in disguise. A language used by non-programmers may need its own guardrails, error messages and vocabulary.

A host-language DSL has its own dangers. If the conventions are too weak, it dissolves back into ordinary code. If the tricks are too clever, readers have to learn JavaScript and your secret dialect of JavaScript at the same time.

So the question is not whether separate DSLs are bad and embedded DSLs are good. That would be too easy, and therefore suspicious.

The question is where the boundary belongs.

A parser version of a DSL puts the boundary around a new query language. The JAQT-shaped version moves the boundary inward. JavaScript remains the language. The DSL is the shape of a few objects, a handful of functions, and the agreement that certain positions in the shape mean certain things.

That smaller change gives us enough of the query idea to be useful, without making us leave the world we are already in.

> **Wizard's ninth rule**
>
> When you invent a language, first look for the smallest change in shape that lets the old problem become smaller. A new border is powerful only when it opens more than it closes.
