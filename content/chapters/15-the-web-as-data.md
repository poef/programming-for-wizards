---
tags: programming for wizards
---

# The Web as data: things should have addresses too

The previous chapter ended with applications as gatekeepers.

If you write a document in one application, the next person may need that application too, or something compatible enough to pretend. If your calendar lives inside one service, a better calendar tool cannot simply arrive and be better. It first has to get past the gate.

The Web was supposed to loosen that kind of grip. A browser should be able to talk to servers it did not know in advance. A page should be able to link to a document written by a stranger. A tool should be replaceable without rebuilding the whole world around it.

But there is a stubborn place where this still often fails: the data itself.

A contacts app knows your friends. A calendar app knows who attends your meetings. A photo app knows who appears in your pictures. A school system knows which learning goals belong to which subject. A project tool knows who works on what. Each program may know something true about the same world.

Yet to the software, these truths often live in separate little rooms.

```text id="private-records"
contacts: person-17
calendar: attendee-4
photos: face-91
```

A human can see that these records may all be talking about the same person. The software usually cannot, unless someone builds a special bridge between those exact systems. And then another bridge. And another. And another.

This is the knitted castle again, but now the threads run through the data.

The problem is not only where the data lives. The problem is how the data points.

## The private-name problem

Imagine two systems store the same simple kind of fact.

The contacts app says:

```text id="contacts-private-name"
person-17 | city | Manchester
```

The calendar app says:

```text id="calendar-private-name"
attendee-4 | city | Manchester
```

Both records have the same rough shape. Something has a property with a value.

But the names are private.

The contacts app says `person-17`. The calendar app says `attendee-4`. The photo app says `face-91`. These identifiers may all refer to Hilda, but nothing in the data tells another program that. And even if the subject names matched, the property names may not. One app says `city`. Another says `town`. Another says `addressLocality`. Another says `municipality`, because someone had a meeting.

Inside one application, private names are fine. They are cheap. They are convenient. You can keep a dictionary somewhere and know what they mean.

Across boundaries, private names become expensive.

Every bridge has to learn the private names on both sides. Every import script becomes a little translator. Every export format becomes a negotiation. And when one side changes, the bridge frays.

So the next wizard question is simple:

> What if the names in the data could cross the same boundaries as the documents?

It is the same trick again. Do not fight every private bridge one by one. Change what the pieces are allowed to be.

## Names that can travel

The Web already gave documents addresses.

```url id="document-address"
https://solid.muze.nl/example/data/people/hilda.html
```

[Linked data](https://www.w3.org/DesignIssues/LinkedData.html) asks for a small but important change in ambition:

> not only documents should have addresses; things should have addresses too.

The person Hilda can have an address-like identifier:

```url id="hilda-uri"
https://solid.muze.nl/example/data/hilda-ogden
```

The idea of a city can have one:

```url id="manchester-uri"
https://solid.muze.nl/example/data/manchester
```

The relationship `lives in` can have one:

```url id="lives-in-uri"
https://solid.muze.nl/example/ns/livesIn
```

Now a fact can be written as three pieces:

```text id="triple-shape"
subject    predicate    object
Hilda      lives in     Manchester
```

Or, with Web names:

```text id="linked-triple"
https://solid.muze.nl/example/data/hilda-ogden
https://solid.muze.nl/example/ns/livesIn
https://solid.muze.nl/example/data/manchester
```

This is not pretty yet. It is not meant to be pretty. It is meant to cross boundaries.

The [Resource Description Framework](https://www.w3.org/TR/rdf11-concepts/), RDF, gives this idea a formal shape. An RDF graph is made of subject-predicate-object triples. Subjects and objects are nodes. Predicates are the arcs between them. In less specification-shaped language: RDF lets you write small facts that join into a graph.

Here is a friendlier syntax, [Turtle](https://www.w3.org/TR/turtle/):

```turtle id="turtle-example"
@prefix data: <https://solid.muze.nl/example/data/> .
@prefix ns: <https://solid.muze.nl/example/ns/> .

data:hilda-ogden
    ns:firstName "Hilda" ;
    ns:lastName "Ogden" ;
    ns:livesIn data:manchester ;
    ns:knows data:stan-ogden .
```

The idea of breaking knowledge into small statements is not new. Databases, logic programming, file formats and ordinary notes have all found versions of it.

The Web contribution is different: the names inside those statements can be Web names.

That is the small change.

And it is not small.

## A graph without a center

A table has a home. It lives in a database. The database belongs to an application, or at least to an organization. The table has a schema. The schema says what the columns mean.

A graph can be more slippery.

I can say something about Hilda in my address book. You can say something about Hilda in a calendar invitation. A school can say something about Hilda in a class list. A photo archive can say something about Hilda in an annotation. None of us has to own the complete record.

We can each write a few statements.

```turtle id="distributed-facts"
# In a contacts document
data:hilda-ogden ns:phoneNumber "+44 ..." .

# In a calendar document
data:meeting-123 ns:attendee data:hilda-ogden .

# In a photo document
data:photo-7 ns:depicts data:hilda-ogden .
```

If the names line up, software can follow them.

This is where linked data gets its name. The data is not just structured. It points. A fact can point to a thing, and that thing can point to more facts, and those facts can point outward again.

Tim Berners-Lee described linked data with a few deliberately simple rules: use URIs as names for things, use HTTP URIs so people can look them up, provide useful information when they are looked up, and include links to other URIs so people and machines can discover more.

This is the URL chapter coming back in another costume.

A URL let one document point outside itself. Linked data lets one fact point outside itself.

## Meaning needs names too

There is a catch, of course. There is always a catch.

It is not enough to give Hilda a Web identifier. The properties need meaning as well.

If I write:

```turtle id="unclear-term"
data:hilda-ogden ns:knows data:stan-ogden .
```

what does `knows` mean?

Met once? Friends with? Can recognize in a police lineup? Has a phone number for? Follows on a social network? Once shared a tram in Manchester?

A word that looks obvious to a human may be too vague for software. Or worse, it may be obvious in two different ways to two different humans.

So linked data also needs vocabularies: shared sets of terms with addresses and definitions. This is where the dream becomes powerful and irritating at the same time. Powerful, because a shared vocabulary lets different software talk about the same kind of thing. Irritating, because shared meaning is social work pretending to be technical work.

The machine can follow the link. People still have to agree, enough, about what the link means.

This is why linked data is not fairy dust. You cannot sprinkle RDF on a pile of confusion and get wisdom. You can still make a knitted castle out of triples. You can still use private terms no one else understands. You can still create vocabularies so large that every simple statement has to pass through a maze of definitions first.

The wizardly part is not the format by itself.

The wizardly part is the boundary it makes possible.

## Data that can travel

Think again about small replaceable software.

A small calendar app can be small only if it does not have to own the whole identity system, contact list and notification universe. A small photo app can be small only if it can talk about people, albums, permissions and locations without inventing a private universe for each one. A small learning tool can be small only if learning goals, subjects, exercises and progress can be understood outside the one tool that first wrote them.

For that to work, the data needs to travel farther than the program.

Not all of it. Not always publicly. Not without permission. Not without care. But conceptually, the data must be able to survive outside the private memory of one application.

This is where linked data belongs in the story of the Web.

The URL made documents reachable.

HTML made documents understandable enough for browsers to render and programs to inspect.

JavaScript made documents programmable.

Linked data asks whether the things described by those documents can become reachable and understandable too.

If they can, software gets a different shape. Applications do not have to be kingdoms that contain all meaning. They can become visitors, editors, viewers, filters, assistants, translators, little tools with opinions. They can arrive, do useful work, and leave without taking the user's world with them.

That is the bridge to the next chapter.

If data can have addresses, if facts can link to other facts, and if meanings can be shared across boundaries, then the next question becomes unavoidable:

where should a person's own data live?
