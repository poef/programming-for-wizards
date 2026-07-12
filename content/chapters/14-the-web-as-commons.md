---
tags: programming for wizards
---

# The Web as commons: innovation happens elsewhere

The previous chapter ended with an admission: you will be wrong.

That creates another problem. If every useful answer has to be predicted inside the original system, then every wrong decision becomes part of the walls. A system designed by one person or one organization can only contain the ideas that reached that room in time.

Most ideas are somewhere else.

There is an old open source book by Ron Goldman and Richard P. Gabriel called [*Innovation Happens Elsewhere*](https://dreamsongs.com/IHE/). The title is the important part. It sounds like business advice, and it is, but it is also software architecture advice.

No matter how clever your team is, most clever people do not work there. No matter how carefully you study your users, most of their lives happen outside your product. The next useful tool may be written by someone you have never met, for a reason you did not predict.

A closed system can still be wonderful. Sometimes the closed system is exactly why an experience feels polished. Everything can be tuned together. The defaults can be chosen. The rough edges can be hidden.

But the future has to arrive through the front gate.

If the owner of the system does not build the thing, the thing does not exist there. An outside wizard with a better idea must convince the owner, copy the system, or build somewhere else and hope the users find it.

That is a dangerous place to put the future.

## The bazaar needs streets

Eric S. Raymond wrote [*The Cathedral and the Bazaar*](http://www.catb.org/~esr/writings/cathedral-bazaar/cathedral-bazaar/), contrasting carefully planned cathedral-style development with the messy, adaptive energy of open source.

The useful part of the bazaar is not the mess. Mess by itself is just mess.

A bazaar still needs streets. A stall needs somewhere to stand. People need to know where the entrance is. Someone has to stop a new stall from blocking it.

Open source works the same way. Code needs names, interfaces and conventions. A patch needs somewhere to land. A bug report needs an address. Someone has to remember why the strange part is strange, and someone grumpy enough has to say no when a change would make it stranger.

The Linux kernel is built by thousands of people, but those people do not all edit every part at will. It has maintainers, subsystems, rules and boundaries. The bazaar works because outside work has somewhere to connect.

That is the architectural lesson.

Innovation can come from elsewhere only when the structure gives it a place to arrive.

## Standards are public boundaries

A closed system can coordinate through ownership. One organization controls the pieces and can make them fit.

A commons cannot rely on that. Independent tools, people and organizations need agreements.

A standard is a boundary that does not belong to one implementation. It says: this name, format or behaviour can be relied on by things that were built separately.

Standards are often boring. That is part of their value. A standard should not require everyone to admire the same library, framework or company. It gives different implementations just enough shared ground to meet.

This is how small, reusable software becomes possible.

A small tool does not need to implement the whole world if it can rely on addresses, protocols and formats outside itself. It can use a URL instead of inventing its own addressing system. It can speak HTTP instead of arranging a private conversation with every server. It can produce HTML instead of shipping its own browser.

The application stays small because the outside is large and stable enough.

## The Web was built this way

The Web did not require one owner to finish the whole idea.

A URL let one document point to another thing somewhere else. HTTP gave browsers and servers a way to talk. HTML gave documents a shared shape. None of these required one program to own both ends.

A new server could appear without asking every browser for permission. A new browser could read existing pages. A new page could link to an old one. A new site did not need permission from the old sites before it could exist.

People built search engines, blogs, shops, forums, wikis, maps, webmail and many things nobody had thought to include in the original design. Some of it was beautiful. Some of it was regrettable. That is what happens when the world gets involved.

The important point is that the Web did not have to predict all of it first.

It had reachable boundaries. A link could be shared. A page could be inspected. A server could be replaced. Someone else could build another implementation of the same agreement.

The Web as we live in it is not entirely open ground. Search engines, social networks, app stores, cloud platforms, ad networks and identity providers have built castles on top of it.

Castles are convenient. They reduce friction. They give users one button to press instead of a lecture about standards. They are also profitable.

But the open ground still matters. Without it, the castles would be the whole world.

## Small software needs a large outside

If a program has to do everything itself, it will grow.

If it has to own the data, identity, storage, sharing, editor, export format, interface and extension system, it will become a world. Perhaps a good world. But still a world.

Small, reusable software needs the opposite assumption. It has to assume that important things live outside it.

The address is outside it. The protocol is outside it. The next tool may be written by someone else. The useful extension may be a weekend project by a person the original authors have never met.

This does not remove design work. It changes the design work.

Instead of designing the entire world, you design where another thing can meet it. What needs a public name? Which format must survive the current implementation? Which agreement allows an independent tool to participate?

Open source is one way to let the outside world in, but it is not the only one. Protocols, data formats, documentation, public APIs, permissive licenses, view-source culture and boring standards all admit that useful ideas may arrive from elsewhere.

A wizard should not be ashamed of using other people's magic. That is how the craft advances. The shame is building a system that can only use your own.

## Moving data is not enough

Standards let independent tools meet, but not every shared format creates understanding.

Two applications can both export JSON:

```json id="portable-not-interoperable-a"
{
    "author": "person-17",
    "city": "Manchester"
}
```

```json id="portable-not-interoperable-b"
{
    "creator": "user-882",
    "addressLocality": "Manchester"
}
```

The files are portable. They can be copied, downloaded and opened.

But are `person-17` and `user-882` the same person? Do `author` and `creator` mean the same thing? Is `city` the same property as `addressLocality`?

The format cannot tell us.

The Web gave documents names that can cross boundaries. The next question is whether the names and meanings inside the data can travel as well.
