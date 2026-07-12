---
tags: programming for wizards
---

# The Web as data: things should have addresses too

Portability is not interoperability.

Portability means that data can leave one application. Interoperability means that another application can understand and use it without a special translator written for those exact two systems.

JSON is portable. It can carry almost any shape of data. But JSON does not tell another program what the names inside it mean.

A contacts app, calendar app and photo app may all know something about the same person. Unless their names line up, the data still lives in separate little rooms.

## The private-name problem

Imagine two systems store the same fact.

The contacts app says:

```text id="contacts-private-name"
person-17 | city | Manchester
```

The calendar app says:

```text id="calendar-private-name"
attendee-4 | addressLocality | Manchester
```

Both records have the same rough shape. Something has a property with a value.

But the names are private.

`person-17` only means something inside the contacts app. `attendee-4` only means something inside the calendar app. They may both refer to Hilda, but nothing in either identifier says so.

The properties have the same problem. One application says `city`. Another says `town`. Another says `addressLocality`. Another says `municipality`, because someone had a meeting.

Inside one application, private names are fine. You control the dictionary.

Across a boundary, each private name needs a translator. Every import script has to learn both sides. When either side changes, the bridge changes too.

So the next wizard question is simple:

> What if names inside the data could cross the same boundaries as documents?

## Names that can travel

The Web already gave documents addresses.

```url id="document-address"
https://solid.muze.nl/example/data/people/hilda.html
```

[Linked data](https://www.w3.org/DesignIssues/LinkedData.html) extends that trick:

> Things can have Web addresses too.

Hilda can have an identifier:

```url id="hilda-uri"
https://solid.muze.nl/example/data/hilda-ogden
```

Manchester can have one:

```url id="manchester-uri"
https://solid.muze.nl/example/data/manchester
```

The relationship `lives in` can have one:

```url id="lives-in-uri"
https://solid.muze.nl/example/ns/livesIn
```

Now the fact can be written as three pieces:

```text id="triple-shape"
subject    predicate    object
Hilda      lives in     Manchester
```

Or with Web names:

```text id="linked-triple"
https://solid.muze.nl/example/data/hilda-ogden
https://solid.muze.nl/example/ns/livesIn
https://solid.muze.nl/example/data/manchester
```

This is not pretty. It is meant to be unambiguous and able to cross boundaries.

The [Resource Description Framework](https://www.w3.org/TR/rdf11-concepts/), RDF, gives this shape a formal name: a subject-predicate-object triple. Many triples together form a graph.

In less specification-shaped language: RDF lets you write small facts that can join other small facts.

Here is the same data in a friendlier syntax, [Turtle](https://www.w3.org/TR/turtle/):

```turtle id="turtle-example"
@prefix data: <https://solid.muze.nl/example/data/> .
@prefix ns: <https://solid.muze.nl/example/ns/> .

data:hilda-ogden
    ns:firstName "Hilda" ;
    ns:lastName "Ogden" ;
    ns:livesIn data:manchester ;
    ns:knows data:stan-ogden .
```

Breaking knowledge into small statements is not new. Databases and logic languages have done versions of it for a long time.

The Web contribution is that the names inside those statements can be Web names.

That is a small change with large consequences.

## A graph without a centre

A table usually has a home. It lives in a database, under one schema, inside one system.

A graph can be assembled from facts written in different places.

I can say something about Hilda in an address book. You can say something about Hilda in a calendar invitation. A photo archive can say that Hilda appears in a picture.

None of us has to own the complete record.

```turtle id="distributed-facts"
# In a contacts document
data:hilda-ogden ns:phoneNumber "+44 ..." .

# In a calendar document
data:meeting-123 ns:attendee data:hilda-ogden .

# In a photo document
data:photo-7 ns:depicts data:hilda-ogden .
```

If the names line up, software can follow them.

This is where linked data gets its name. The data is not only structured. It points. A fact can point to a thing, which can lead to more facts somewhere else.

Tim Berners-Lee described linked data with deliberately simple rules: use URIs as names for things, use HTTP URIs so they can be looked up, provide useful information when they are looked up, and include links to other URIs.

This is the URL chapter returning in another costume.

A URL lets one document point outside itself. Linked data lets one fact point outside itself.

## Meaning needs names too

Giving Hilda an identifier is not enough. The properties need identities too.

If I write:

```turtle id="unclear-term"
data:hilda-ogden ns:knows data:stan-ogden .
```

what does `knows` mean?

Met once? Friends with? Can recognise in a police lineup? Has a phone number for? Once shared a tram in Manchester?

A word that looks obvious to a human may be vague to software. It may even be obvious in two different ways to two different humans.

Linked data therefore uses vocabularies: shared sets of terms with public identifiers and definitions. Different applications can use the same property name because that property does not belong to either application.

This is powerful and irritating.

Powerful, because independent tools can recognise the same kind of fact.

Irritating, because shared meaning is social work pretending to be technical work. The machine can follow the link. People still have to agree, enough, about what the link means.

Linked data is not fairy dust. You can make a knitted castle out of triples. You can invent private vocabularies nobody else understands. You can create a vocabulary so elaborate that a simple fact needs an expedition.

The format is not the point by itself.

The boundary is the point. Names and meanings can survive the application that first used them.

## What linked data does not solve

Linked data does not decide where data lives.

It does not decide who owns the storage, who may read a fact, who may change it, or which copy is authoritative. A company can keep RDF in a private database. A locked service can offer a Turtle export button.

The data may be interoperable and still be trapped.

Linked data solves a different part of the problem. It gives independently written tools a way to identify the same things and understand the same properties.

That distinction matters.

A shared storage system without shared meaning becomes a folder full of files that only their original applications understand.

Shared meaning without control over storage leaves the application holding the only useful copy.

We need both boundaries, but they are not the same boundary.

## Data that outlives the application

Think again about small, reusable software.

A small calendar tool can stay small if it can refer to people and events without inventing a private universe for them. A photo tool can talk about the same people and places. A learning tool can use goals and subjects written by another tool.

The application does not need to own all meaning.

It can become an editor, viewer, filter, search tool or translator. It can arrive, do useful work, and leave without taking the vocabulary of the user's world with it.

Linked data makes that shape possible. It does not guarantee that anyone will choose the same names, or that the resulting software will be simple. It gives names somewhere to meet.

But one question remains.

If the application's meanings can live outside it, why should the application own the only copy of the data?

Where should a person's data live?
