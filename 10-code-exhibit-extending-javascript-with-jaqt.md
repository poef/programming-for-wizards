---
tags: programming for wizards
---

# Code exhibit: extending JavaScript with JAQT

The previous chapter ended with Domain Specific Languages. This chapter is still a workshop, but the workshop has changed shape.

The obvious way to make a DSL is to make a new language. You define a grammar, write a tokenizer, build a parser, maybe turn the result into SQL, maybe turn it into a filter function. That is a perfectly respectable way to do it. Many useful languages are built that way.

It also creates a border.

On one side of the border is your normal programming language, with all its functions, libraries, syntax, editor support, error messages, habits and tricks. On the other side is your new little language. The little language may be lovely, but it cannot automatically use the things on the other side. Every function you want inside it must be re-invented there, or exposed through some bridge you now have to maintain.

This is not always wrong. Sometimes the border is exactly the point. SQL is useful partly because it is not JavaScript or PHP or Python. Regular expressions are useful partly because they have their own dense, cursed little notation.

But a wizard should be careful about borders. A border is a place where ideas have to show their passport.

JAQT takes a different route. It has a query-like shape, inspired by SQL and GraphQL, but it stays in JavaScript. It does not parse a string. It does not ask you to step into a smaller language. It adds a few words and conventions to JavaScript itself, so that normal JavaScript functions, objects, arrays, operators and syntax can keep doing the work.

That is the interesting move.

> **Interactive exhibit placeholder: `jaqt-extension-lab`**
>
> Show three panes. In the first pane, use plain JavaScript with `filter()` and `map()`. In the second pane, show the same query in a JAQT-shaped form with `from().where().select()`. In the third pane, show the tiny implementation from this chapter. Let the reader click on a function value in the query and see where it is called later. The important thing to make visible is that the DSL is not parsed. It is executed as ordinary JavaScript.

## The problem

Imagine we have some JSON-like data:

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

We want the people whose last name starts with `O` and who live in Manchester. Then we want a smaller result, with only the fields we care about.

In plain JavaScript this is not terrible:

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

There is nothing wrong with this code. In fact, this is one of the reasons JavaScript is a nice language for this kind of work. Arrays already have `filter()` and `map()`. Functions can be written inline. Objects are easy to create. A great deal of the machinery is already there.

Still, there is some noise. The word `person` is repeated everywhere. The shape of the output is mixed with the mechanics of looping over the input. The query is visible, but it is not quite as visible as it could be.

A separate query language might solve this by introducing a new string syntax:

```txt id="w69i9s"
lastName startsWith "O" and address.city = "Manchester"
```

That has a certain appeal. It also means we now have to parse that string. If we want `startsWith`, we have to define what it means in the new language. If we want a helper function that already exists in our JavaScript program, we have to make it available to the parser somehow. If we want syntax highlighting, error messages, editor integration and tests, we are building a small programming language whether we admit it or not.

For some problems that is the right amount of trouble.

For this one, maybe not.

## Functions as values

To understand the JAQT-shaped solution, you need one idea that is strange only until it isn't:

```js id="hlgk8c"
const olderThan = age => person => person.age > age
```

This is a function that returns another function.

If you call `olderThan(40)`, you get a new function back:

```js id="xmjsy7"
const isOlderThan40 = olderThan(40)

isOlderThan40({ age: 62 }) // true
isOlderThan40({ age: 28 }) // false
```

This is higher-order programming. The name sounds like someone wanted to scare off beginners, but the idea is not that mysterious. A function can be a value. You can put it in a variable. You can pass it to another function. You can return it from a function. You can store it in an object.

JavaScript programmers use this all the time:

```js id="s0ro6e"
people.filter(person => person.age > 40)
people.map(person => person.firstName)
```

`filter()` does not know what counts as a match. You hand it a function. `map()` does not know what the new value should be. You hand it a function. The function is not the result yet. It is a small piece of delayed behavior.

This is the door JAQT walks through.

Instead of inventing a new syntax for every possible operation, we can let JavaScript functions carry the parts that need computation.

```js id="oa4e35"
const startsWith = prefix => value => value.startsWith(prefix)
const fullName = person => `${person.firstName} ${person.lastName}`
```

Now `startsWith("O")` is a reusable test. `fullName` is a reusable transformation. They are normal JavaScript functions. They can be tested, named, imported, combined and debugged like any other JavaScript function.

No border crossing needed.

## A tiny JAQT-shaped query

Here is the kind of shape we want:

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

This is not real JAQT yet. It is a small exhibit version, designed to fit in one chapter.

But the important shape is already there.

`where()` receives an object that looks like the data we want to match. Static values are compared directly. Nested objects match nested objects. Functions are called, so the query can still use any ordinary JavaScript function.

`select()` receives an object that looks like the data we want back. The `_` placeholder means: copy the value with this name. A function means: calculate this value.

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

The interesting thing here is what stayed ordinary. The query is an object. The parts that need calculation are functions. The program can run the whole thing directly, without a tokenizer sitting between the reader and JavaScript.

The DSL is the shape of the objects and the meaning of the functions we pass in.

## The whole exhibit version

This is the complete tiny implementation:

```js id="xk67tk"
const _ = Symbol("copy this property")

function from(items) {
    return {
        where(pattern) {
            return from(items.filter(item => matches(pattern, item)))
        },
        select(shape) {
            return from(items.map(item => project(shape, item, item)))
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
    if (typeof pattern === "function") {
        return pattern(item)
    }

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

function project(shape, source, root) {
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

That is small enough to hold in your head, which is important for this chapter. Real JAQT has more features. It has a more capable `_`. It supports more operations. It has to deal with more annoying cases, because libraries are where annoying cases go to have long careers.

But the skeleton is here.

`from()` wraps an array and adds a few words to it: `where`, `select` and `value`.

`where()` is a thin layer over `filter()`.

`select()` is a thin layer over `map()`.

`matches()` understands the object shape used for filtering.

`project()` understands the object shape used for selecting.

Most of the magic is not in the amount of code. It is in choosing which things should be represented as data and which things should remain functions.

## The small trick

The `_` placeholder is deliberately boring in this exhibit version:

```js id="sr68jo"
const _ = Symbol("copy this property")
```

It is just a unique marker. In a `select()` shape, it means: copy the property with the same name from the source object.

```js id="ul9vxl"
select({
    firstName: _,
    lastName: _
})
```

This is not something JavaScript normally means. We invented that meaning. But we did it inside ordinary JavaScript syntax. The object is still an object. The property names are still property names. The helper functions are still functions.

The real JAQT takes this further. Its `_` is a pointer-like function, so you can write expressions that point into the data. That is a cleverer trick, and a useful one, but I do not want to hide the smaller trick under a larger one too quickly.

The smaller trick is already enough:

> an object can describe a shape, and functions inside that object can describe the places where the shape must do work.

Once you see that, the query no longer has to be a string.

## Reusing JavaScript

Because the query is JavaScript, we can add helpers without teaching a parser about them.

```js id="g2ce8l"
const inCity = city => ({
    address: { city }
})

const lastNameStartsWith = prefix => ({
    lastName: value => value.startsWith(prefix)
})

const personCard = {
    firstName: _,
    lastName: _,
    label: person => `${person.firstName} ${person.lastName}`
}

const result = from(people)
    .where({
        ...inCity("Manchester"),
        ...lastNameStartsWith("O")
    })
    .select(personCard)
    .value()
```

That spread operator is just JavaScript. The arrow functions are just JavaScript. The template string is just JavaScript. If you want to use a function from another module, import it. If you want to test `lastNameStartsWith`, test it like any other function.

The DSL did not become weaker by staying inside the host language. In this case it became more useful, because it can borrow the whole surrounding language without ceremony.

This is also why this approach is not only about syntax. Syntax is the visible part. The real question is where the boundary goes.

A separate parser draws a hard boundary. Inside the DSL, only the DSL exists. You may get beautiful notation, but you must pay for every bridge.

A host-language DSL draws a softer boundary. You still create a new way of saying things, but you use the host language as the material. The danger is that the boundary can become vague. If everything is allowed, the shape may dissolve into ordinary code again.

The trick is to make the new shape strong enough to be recognizable, but small enough that the surrounding language can still breathe.

## What did we invent?

Filtering and mapping were already in JavaScript.

The useful change is where the shape of the query lives.

In the plain JavaScript version, the shape is scattered through a chain of callbacks. In the parser version, the shape lives in a string and has to be recovered by machinery. In the JAQT-shaped version, the shape is an ordinary JavaScript object. Where calculation is needed, the object contains ordinary JavaScript functions.

This is a small change, but it changes the feel of the problem. The query becomes something you can compose with the language you already have.

Many useful abstractions are like this. They are not separate worlds. They are small extensions of a world you already understand.

> **Wizard rule**
>
> When you invent a language, do not cross a boundary unless the boundary helps. Sometimes the better spell is a small extension of the language you already have.
