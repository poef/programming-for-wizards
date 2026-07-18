---
tags: programming for wizards
---

# The Web as data: things should have addresses too

<!-- paragraph-id: p-15-portability-is-not-interoperability -->
Portability is not interoperability.

<!-- paragraph-id: p-15-portability-means-that-data-can-leave-one-application -->
Portability means that data can leave one application. Interoperability means that another application can understand and use it without a special translator written for those exact two systems.

<!-- paragraph-id: p-15-json-is-portable-it-can-carry-almost-any -->
JSON is never just JSON. It is portable and can carry almost any kind of data, but it does not tell another program what the names inside it mean.

<!-- paragraph-id: p-15-json-is-an-interesting-piece-of-infrastructure -->
That is not an accidental omission. JSON is infrastructure, and almost aggressively small. It has objects, arrays, strings, numbers, booleans and `null`. That is nearly the whole spell.

<!-- paragraph-id: p-15-its-smallness-helped-it-spread -->
Its smallness helped it spread. It also made JSON difficult to extend. When people need identity, dates, references, types or shared vocabularies, they make another format or hide another language inside the familiar one.

<!-- paragraph-id: p-15-a-contacts-app-calendar-app-and-photo-app -->
A contacts app, calendar app and photo app may all know something about the same person. Unless their names line up, the data still lives in separate little rooms.

## The private-name problem

<!-- paragraph-id: p-15-imagine-two-systems-store-the-same-fact -->
Imagine two systems store the same fact.

<!-- paragraph-id: p-15-the-contacts-app-says -->
The contacts app says:

<!-- code-id: contacts-private-name -->
```text id="contacts-private-name"
person-17 | city | Manchester
```

<!-- paragraph-id: p-15-the-calendar-app-says -->
The calendar app says:

<!-- code-id: calendar-private-name -->
```text id="calendar-private-name"
attendee-4 | addressLocality | Manchester
```

<!-- paragraph-id: p-15-both-records-have-the-same-rough-shape-something -->
Both records have the same rough shape. Something has a property with a value.

<!-- paragraph-id: p-15-but-the-names-are-private -->
But the names are private.

<!-- paragraph-id: p-15-person-17-only-means-something-inside-the-contacts -->
`person-17` only means something inside the contacts app. `attendee-4` only means something inside the calendar app. They may both refer to Hilda, but nothing in either identifier says so.

<!-- paragraph-id: p-15-the-properties-have-the-same-problem-one-application -->
The properties have the same problem. One application says `city`. Another says `town`. Another says `addressLocality`. Another says `municipality`, because someone had a meeting.

<!-- paragraph-id: p-15-inside-one-application-private-names-are-fine-you -->
Inside one application, private names are fine. You control the dictionary.

<!-- paragraph-id: p-15-across-a-boundary-each-private-name-needs-a -->
Across a boundary, each private name needs a translator. Every import script has to learn both sides. When either side changes, the bridge changes too.

<!-- paragraph-id: p-15-instead-imagine-if-names-inside-the-data-could -->
What if names inside the data could cross the same boundaries as documents?

## Names that can travel

<!-- paragraph-id: p-15-the-web-already-gave-documents-addresses -->
The Web already gave documents addresses.

<!-- code-id: document-address -->
```url id="document-address"
https://solid.muze.nl/example/data/people/hilda.html
```

<!-- paragraph-id: p-15-linked-data-extends-that-trick -->
[Linked data](https://www.w3.org/DesignIssues/LinkedData.html) extends that trick:

<!-- aside-id: aside-15-things-can-have-web-addresses-too -->
> Things can have Web addresses too.

<!-- paragraph-id: p-15-hilda-can-have-an-identifier -->
Hilda can have an identifier:

<!-- code-id: hilda-uri -->
```url id="hilda-uri"
https://solid.muze.nl/example/data/hilda-ogden
```

<!-- paragraph-id: p-15-manchester-can-have-one -->
Manchester can have one:

<!-- code-id: manchester-uri -->
```url id="manchester-uri"
https://solid.muze.nl/example/data/manchester
```

<!-- paragraph-id: p-15-the-relationship-lives-in-can-have-one -->
The relationship `lives in` can have one:

<!-- code-id: lives-in-uri -->
```url id="lives-in-uri"
https://solid.muze.nl/example/ns/livesIn
```

<!-- paragraph-id: p-15-now-the-fact-can-be-written-as-three -->
Now the fact can be written as three pieces:

<!-- code-id: triple-shape -->
```text id="triple-shape"
subject    predicate    object
Hilda      lives in     Manchester
```

<!-- paragraph-id: p-15-or-with-web-names -->
Or with Web names:

<!-- code-id: linked-triple -->
```text id="linked-triple"
https://solid.muze.nl/example/data/hilda-ogden
https://solid.muze.nl/example/ns/livesIn
https://solid.muze.nl/example/data/manchester
```

<!-- paragraph-id: p-15-this-is-not-pretty-it-is-meant-to -->
This is not pretty. It is meant to be unambiguous and able to cross boundaries.

<!-- paragraph-id: p-15-the-resource-description-framework-rdf-gives-this-shape -->
The [Resource Description Framework](https://www.w3.org/TR/rdf11-concepts/), RDF, gives this shape a formal name: a subject-predicate-object triple. Many triples together form a graph.

<!-- paragraph-id: p-15-in-less-specification-shaped-language-rdf-lets-you -->
In less specification-shaped language: RDF lets you write small facts that can join other small facts.

<!-- paragraph-id: p-15-here-is-the-same-data-in-a-friendlier -->
Here is the same data in a friendlier syntax, [Turtle](https://www.w3.org/TR/turtle/):

<!-- code-id: turtle-example -->
```turtle id="turtle-example"
@prefix data: <https://solid.muze.nl/example/data/> .
@prefix ns: <https://solid.muze.nl/example/ns/> .

data:hilda-ogden
    ns:firstName "Hilda" ;
    ns:lastName "Ogden" ;
    ns:livesIn data:manchester ;
    ns:knows data:stan-ogden .
```

<!-- paragraph-id: p-15-json-ld-is-another-spelling -->
RDF is a model for the data, not one particular spelling. Turtle is one spelling. [JSON-LD](https://www.w3.org/TR/json-ld11/) is another.

<!-- paragraph-id: p-15-some-people-make-another-format -->
JSON-LD takes a slightly strange route. It keeps the familiar JSON shape, then gives names such as `@id` and `@context` an extra job. They say which values identify things and where the meanings of other names come from. JSON remains unchanged underneath. A more expressive language stands on top of it.

<!-- paragraph-id: p-15-breaking-knowledge-into-small-statements-is-not-new -->
Breaking knowledge into small statements is not new. Databases and logic languages have done versions of it for a long time.

<!-- paragraph-id: p-15-the-web-contribution-is-that-the-names-inside -->
The Web contribution is that the names inside those statements can be Web names. 

## A graph without a centre

<!-- paragraph-id: p-15-a-table-usually-has-a-home-it-lives -->
A table usually has a home. It lives in a database, under one schema, inside one system.

<!-- paragraph-id: p-15-a-graph-can-be-assembled-from-facts-written -->
Together, triples form a different shape: a graph. A graph can be assembled from facts written in different places.

<!-- paragraph-id: p-15-i-can-say-something-about-hilda-in-an -->
I can say something about Hilda in an address book. You can say something about Hilda in a calendar invitation. A photo archive can say that Hilda appears in a picture.

<!-- paragraph-id: p-15-none-of-us-has-to-own-the-complete -->
None of us has to own the complete record.

<!-- code-id: distributed-facts -->
```turtle id="distributed-facts"
# In a contacts document
data:hilda-ogden ns:phoneNumber "+44 ..." .

# In a calendar document
data:meeting-123 ns:attendee data:hilda-ogden .

# In a photo document
data:photo-7 ns:depicts data:hilda-ogden .
```

<!-- paragraph-id: p-15-if-the-names-line-up-software-can-follow -->
If the names line up, software can follow them.

<!-- paragraph-id: p-15-this-is-where-linked-data-gets-its-name -->
This is where linked data gets its name. The data is not only structured. It points. A fact can point to a thing, which can lead to more facts somewhere else.

<!-- paragraph-id: p-15-tim-berners-lee-described-linked-data-with-deliberately -->
Tim Berners-Lee described linked data with deliberately simple rules: use URIs as names for things, use HTTP URIs so they can be looked up, provide useful information when they are looked up, and include links to other URIs.

<!-- paragraph-id: p-15-this-is-the-url-chapter-returning-in-another -->
This is the URL chapter returning in another costume.

<!-- paragraph-id: p-15-a-url-lets-one-document-point-outside-itself -->
A URL lets one document point outside itself. Linked data lets one fact point outside itself.

## Meaning needs names too

<!-- paragraph-id: p-15-giving-hilda-an-identifier-is-not-enough-the -->
Giving Hilda an identifier is not enough. The properties need identities too.

<!-- paragraph-id: p-15-if-i-write -->
If I write:

<!-- code-id: unclear-term -->
```turtle id="unclear-term"
data:hilda-ogden ns:knows data:stan-ogden .
```

<!-- paragraph-id: p-15-what-does-knows-mean -->
what does `knows` mean?

<!-- paragraph-id: p-15-met-once-friends-with-can-recognise-in-a -->
Met once? Friends with? Can recognise in a police lineup? Has a phone number for? Once shared a tram in Manchester?

<!-- paragraph-id: p-15-a-word-that-looks-obvious-to-a-human -->
A word that looks obvious to a human may be vague to software. It may even be obvious in two different ways to two different humans.

<!-- paragraph-id: p-15-linked-data-therefore-uses-vocabularies-shared-sets-of -->
Linked data therefore uses vocabularies: shared sets of terms with public identifiers and definitions. Different applications can use the same property name because that property does not belong to either application.

<!-- paragraph-id: p-15-this-is-where-your-eyes-may-start-to -->
This is where your eyes may start to gloss over. Vocabularies, ontologies, IRIs. This all sounds abstract and academic, and it is. It's also necessary and powerful.

<!-- paragraph-id: p-15-when-independent-tools-can-recognise-the-same-names -->
When independent tools recognise the same names for the same kinds of facts, they can work on those facts independently. But the only way to get there is for people to agree, enough, about what each name means. The problem is that shared meaning is social work pretending to be technical work. 

<!-- paragraph-id: p-15-linked-data-is-not-fairy-dust-you-can -->
Linked data is not fairy dust. You can make a knitted castle out of triples. You can invent private vocabularies nobody else understands. You can create a vocabulary so elaborate that a simple fact needs an expedition.

<!-- paragraph-id: p-15-the-boundary-is-the-point-names-and-meanings -->
A format will not solve all these problems. What matters is that names and meanings can survive the application that first used them.

## What linked data does not solve

<!-- paragraph-id: p-15-linked-data-lets-applications-work-with-the-same -->
Linked data lets applications work with the same meanings, but the data can still be trapped behind a locked gate. It does not decide where data lives, who owns the storage, or who may read or change it.

<!-- paragraph-id: p-15-a-company-can-keep-rdf-in-a-private -->
A company can keep RDF in a private database. A locked service can offer a Turtle export button.

<!-- paragraph-id: p-15-a-shared-storage-system-without-shared-meaning-becomes -->
A shared storage system without shared meaning becomes a folder full of files that only their original applications understand.

<!-- paragraph-id: p-15-shared-meaning-without-control-over-storage-leaves-the -->
Shared meaning without control over storage leaves the application holding the only useful copy.

<!-- paragraph-id: p-15-we-need-both-boundaries-but-they-are-not -->
We need both boundaries, but they are not the same.

## The boundary moves again

<!-- paragraph-id: p-15-think-again-about-small-reusable-software -->
Back in the knitted castle, the useful question was not whether something could be reused, but in what direction. A file format can be reused by programs that do not share code. A protocol lets different systems meet and then go their separate ways again.

<!-- paragraph-id: p-15-a-small-calendar-tool-can-stay-small-if -->
Linked data moves that boundary further.

<!-- paragraph-id: p-15-the-application-does-not-need-to-own-all -->
Two applications do not need to share code if they can recognise the same things, use the same names and work with the same data. A contacts application can describe a person. A calendar can invite that person. A photo tool can say that the person appears in a picture.

<!-- paragraph-id: p-15-it-can-become-an-editor-viewer-filter-search -->
The shared part is not hidden inside either program. It is in the names and data they agree to use.

<!-- paragraph-id: p-15-linked-data-makes-that-shape-possible-it-does -->
Linked data gives names somewhere to meet. It lets work done by one application become useful to another that was written independently.

<!-- paragraph-id: p-15-if-the-meaning-can-live-outside-the-application -->
If the meaning can live outside the application, why should the application own the only copy of the data?

<!-- paragraph-id: p-15-where-should-a-persons-data-live -->
Where should a person’s data live?