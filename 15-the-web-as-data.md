---
tags: programming for wizards
---

# The Web as data: things should have addresses too

The previous chapter ended with a problem of openness.

If innovation happens elsewhere, then software must leave room for outside invention. A browser should be able to talk to servers it did not know in advance. A page should be able to link to a document written by a stranger. A tool should be replaceable without rebuilding the whole world around it.

But there is a stubborn place where this still often fails: data.

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

> **Interactive exhibit placeholder: `linked-data-addresses`**
>
> Show three small apps: contacts, calendar and photos. Each has a private record for the same person. First show the private identifiers: `person-17`, `attendee-4`, `face-91`. Then let the reader replace them with one shared Web address for the person. Show how each app can still say its own thing, but now the statements can meet. Add a second step where the properties themselves also get addresses, so `knows`, `attends` and `appearsIn` become shared terms rather than private column names.

## Facts are older than databases

Let us start smaller.

Suppose we know this:

```text id="plain-facts"
Hilda lives in Manchester.
Stan lives in Manchester.
Kevin lives in Liverpool.
Hilda knows Stan.
```

There are many ways to write these facts down. In a spreadsheet you might make rows and columns. In a database you might create tables. In an object-oriented program you might make `Person` objects. In JSON you might write nested objects. In a notebook you might just write the sentences.

Each shape helps with some questions and makes other questions awkward.

A language called [Prolog](https://dl.acm.org/doi/10.1145/234286.1057820) made a very different choice. Prolog came out of logic programming work in the early 1970s. Instead of giving the computer a list of steps, you describe facts and rules, then ask questions. A tiny Prolog-ish world might look like this:

```prolog id="prolog-facts"
lives_in(hilda, manchester).
lives_in(stan, manchester).
lives_in(kevin, liverpool).

knows(hilda, stan).
knows(stan, kevin).
```

Then you can ask:

```prolog id="prolog-query"
?- lives_in(Person, manchester).
```

And Prolog tries to find values for `Person` that make the question true.

This is a strange experience if you are used to ordinary programming. You do not say: loop over the people, check the city field, push matching people into a result array. You say something closer to: here are some things that are true; now find me the things that make this other statement true.

The important part for this chapter is not Prolog itself. The important part is the shape:

```text id="relation-shape"
relation(subject, object)
```

Or sometimes:

```text id="rule-shape"
new_fact(X) is true if other_fact(X) is true
```

A fact becomes a small piece of the world. A query becomes a pattern with holes in it. The machine tries to fill the holes.

That idea will keep coming back.

## Long skinny tables

Databases found another version of the same trick.

A normal table has columns:

```text id="wide-table"
id | first_name | last_name | city
---|------------|-----------|-----------
17 | Hilda      | Ogden     | Manchester
18 | Stan       | Ogden     | Manchester
19 | Kevin      | Webster   | Liverpool
```

This works beautifully when you know the shape of the data. Every person has a first name, a last name and a city. The columns are the promise. The rows are the examples.

But what if the shape keeps changing?

Medical records are a classic example. One patient may have a blood pressure reading, another a glucose value, another a note from a neurologist, another a measurement that did not even exist when the database was first designed. Products in a shop have the same problem. A shoe, a camera and a refrigerator do not want the same columns.

One answer is [Entity-Attribute-Value](https://pmc.ncbi.nlm.nih.gov/articles/PMC2110957/), usually shortened to EAV.

Instead of making one column for every possible attribute, you write each fact as a row:

```text id="eav-table"
entity | attribute  | value
-------|------------|-----------
hilda  | firstName  | Hilda
hilda  | lastName   | Ogden
hilda  | city       | Manchester
stan   | firstName  | Stan
stan   | city       | Manchester
```

This table is long and skinny. It can accept new attributes without changing the physical table. If tomorrow you need to store `favoriteBiscuit`, you add a row:

```text id="eav-new-row"
hilda | favoriteBiscuit | custard cream
```

No new column. No database migration. No ceremony.

This is powerful, and also dangerous. A normal table shows its shape immediately. EAV hides the shape inside the data. To understand what a `Person` is supposed to look like, you now need metadata, conventions, validation rules and patience.

You escaped one rigidity and invited another kind of confusion.

Still, EAV matters here because it makes a useful move visible:

```text id="eav-shape"
thing | property | value
```

A record has been broken into small statements.

That is close to the shape we need, but not quite enough for the Web.

## The private-name problem

Imagine two systems both use EAV.

The contacts app says:

```text id="contacts-eav"
person-17 | city | Manchester
```

The calendar app says:

```text id="calendar-eav"
attendee-4 | city | Manchester
```

Both have flexible data. Both can add new attributes. Both can represent facts in the same general shape.

But the names are still private.

The contacts app says `person-17`. The calendar app says `attendee-4`. The photo app says `face-91`. These identifiers may all refer to Hilda, but nothing in the data tells another program that. And even if the subject names matched, the property names may not. One app says `city`. Another says `town`. Another says `addressLocality`. Another says `municipality`, because someone had a meeting.

Inside one application, private names are fine. They are cheap. They are convenient. You can keep a dictionary somewhere and know what they mean.

Across boundaries, private names become expensive.

Every bridge has to learn the private names on both sides. Every import script becomes a little translator. Every export format becomes a negotiation. And when one side changes, the bridge frays.

So the next wizard question is simple:

> What if the names in the data could cross the same boundaries as the documents?

## Things can have addresses

The Web already gave documents addresses.

```url id="document-address"
https://example.org/people/hilda.html
```

Linked data asks for a small but important change in ambition:

> not only documents should have addresses; things should have addresses too.

The person Hilda can have an address-like identifier:

```url id="hilda-uri"
https://example.org/id/hilda-ogden
```

The idea of a city can have one:

```url id="manchester-uri"
https://example.org/id/manchester
```

The relationship `lives in` can have one:

```url id="lives-in-uri"
https://example.org/vocab/livesIn
```

Now a fact can be written as three pieces:

```text id="triple-shape"
subject    predicate    object
Hilda      lives in     Manchester
```

Or, with Web names:

```text id="linked-triple"
https://example.org/id/hilda-ogden
https://example.org/vocab/livesIn
https://example.org/id/manchester
```

This is not pretty yet. It is not meant to be pretty. It is meant to cross boundaries.

The [Resource Description Framework](https://www.w3.org/TR/rdf11-concepts/), RDF, gives this idea a formal shape. An RDF graph is made of subject-predicate-object triples. Subjects and objects are nodes. Predicates are the arcs between them. In less specification-shaped language: RDF lets you write small facts that join into a graph.

Here is a friendlier syntax, Turtle:

```turtle id="turtle-example"
@prefix ex: <https://example.org/id/> .
@prefix vocab: <https://example.org/vocab/> .

ex:hilda-ogden
    vocab:firstName "Hilda" ;
    vocab:lastName "Ogden" ;
    vocab:livesIn ex:manchester ;
    vocab:knows ex:stan-ogden .
```

This is the Prolog-ish idea again: little statements about the world. It is the EAV-ish idea again: entity, attribute, value. But now the names can be Web names.

That is the small change.

And it is not small.

## A graph without a center

A table has a home. It lives in a database. The database belongs to an application, or at least to an organization. The table has a schema. The schema says what the columns mean.

A graph can be more slippery.

I can say something about Hilda in my address book. You can say something about Hilda in a calendar invitation. A school can say something about Hilda in a class list. A photo archive can say something about Hilda in an annotation. None of us has to own the complete record.

We can each write a few statements.

```turtle id="distributed-facts"
# In a contacts document
ex:hilda-ogden vocab:phoneNumber "+44 ..." .

# In a calendar document
ex:meeting-123 vocab:attendee ex:hilda-ogden .

# In a photo document
ex:photo-7 vocab:depicts ex:hilda-ogden .
```

If the names line up, software can follow them.

This is where linked data gets its name. The data is not just structured. It points. A fact can point to a thing, and that thing can point to more facts, and those facts can point outward again.

Tim Berners-Lee described [linked data](https://www.w3.org/DesignIssues/LinkedData.html) with a few deliberately simple rules: use URIs as names for things, use HTTP URIs so people can look them up, provide useful information when they are looked up, and include links to other URIs so people and machines can discover more.

This is the URL chapter coming back in another costume.

A URL let one document point outside itself. Linked data lets one fact point outside itself.

## Meaning needs names too

There is a catch, of course. There is always a catch.

It is not enough to give Hilda a Web identifier. The properties need meaning as well.

If I write:

```turtle id="unclear-term"
ex:hilda-ogden ex:knows ex:stan-ogden .
```

what does `knows` mean?

Met once? Friends with? Can recognize in a police lineup? Has a phone number for? Follows on a social network? Once shared a tram in Manchester?

A word that looks obvious to a human may be too vague for software. Or worse, it may be obvious in two different ways to two different humans.

So linked data also needs vocabularies: shared sets of terms with addresses and definitions. This is where the dream becomes powerful and irritating at the same time. Powerful, because a shared vocabulary lets different software talk about the same kind of thing. Irritating, because shared meaning is social work pretending to be technical work.

The machine can follow the link. People still have to agree, enough, about what the link means.

This is why linked data is not fairy dust. You cannot sprinkle RDF on a pile of confusion and get wisdom. You can still make a knitted castle out of triples. You can still use private terms no one else understands. You can still create vocabularies so large that using them feels like filling in a tax return for an ontology committee.

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

> **Wizard rule**
>
> Data becomes more useful when its meanings can travel farther than the program that first wrote it.
