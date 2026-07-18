---
tags: programming for wizards
---

# The Web as commons: innovation happens elsewhere

<!-- paragraph-id: p-14-there-is-an-old-open-source-book-by -->
There is an old open source book by Ron Goldman and Richard P. Gabriel called [*Innovation Happens Elsewhere*](https://dreamsongs.com/IHE/). The title is the important part. It sounds like business advice, and it is, but it is also software architecture advice.

<!-- paragraph-id: p-14-no-matter-how-clever-your-team-is-most -->
Even if you have a team of the smartest people around, many more smart people will live and work outside your team. You can invest heavily in providing the features your users need, and still find users whose wishes aren't heard.

<!-- paragraph-id: p-14-you-cannot-compete-with-the-world-you-cannot -->
You cannot compete with the world. You cannot build the world.

<!-- paragraph-id: p-14-a-closed-system-can-still-be-wonderful-sometimes -->
Closed systems have their own advantages, but many of those advantages belong to the 'owner' of that system. As a user you have little influence. You cannot advance or evolve it yourself. The future has to arrive through the front gate.

<!-- paragraph-id: p-14-if-the-owner-of-the-system-does-not -->
If the owner of the system does not build it, it doesn't exist there. An outside wizard with a better idea must convince the owner, copy the system, or build somewhere else and hope the users find it.

<!-- paragraph-id: p-14-that-is-a-dangerous-place-to-put-the -->
That's not a system built to grow, or to allow change at scale.

## The bazaar needs streets

<!-- paragraph-id: p-14-eric-s-raymond-wrote-the-cathedral-and-the -->
Eric S. Raymond wrote [*The Cathedral and the Bazaar*](http://www.catb.org/~esr/writings/cathedral-bazaar/cathedral-bazaar/), contrasting carefully planned cathedral-style development with the messy, adaptive energy of open source.

<!-- paragraph-id: p-14-the-useful-part-of-the-bazaar-is-not -->
A bazaar can be messy, but that's not the point. The point is anyone can build a stall there.

<!-- paragraph-id: p-14-a-bazaar-still-needs-streets-a-stall-needs -->
A bazaar still needs streets. A stall needs somewhere to stand. People need to know where the entrance is. Someone has to stop a new stall from blocking it.

<!-- paragraph-id: p-14-open-source-works-the-same-way-code-needs -->
Open source works the same way. Code needs names, interfaces and conventions. A patch needs somewhere to land. A bug report needs an address. Someone has to remember why the strange part is strange, and someone grumpy enough has to say no when a change would make it stranger.

<!-- paragraph-id: p-14-the-linux-kernel-is-built-by-thousands-of -->
The Linux kernel is built by thousands of people, but those people do not all edit every part at will. It has maintainers, subsystems, rules and boundaries. The bazaar works because outside work has somewhere to connect.

<!-- paragraph-id: p-14-innovation-can-come-from-elsewhere-only-when-the -->
Innovation can come from elsewhere only when the structure gives it a place to arrive.

## Standards are public boundaries

<!-- paragraph-id: p-14-a-closed-system-can-coordinate-through-ownership-one -->
A closed system can coordinate through ownership. One organization controls the pieces and can make them fit.

<!-- paragraph-id: p-14-a-commons-cannot-rely-on-that-independent-tools -->
A commons cannot rely on that. Independent tools, people and organizations need agreements.

<!-- paragraph-id: p-14-a-standard-is-a-boundary-that-does-not -->
A standard is a boundary that does not belong to one implementation. It says: this name, format or behaviour can be relied on by things that were built separately.

<!-- paragraph-id: p-14-standards-are-often-boring-that-is-part-of -->
Standards are often boring. That's not a bug, but a feature. A standard should not require everyone to admire the same library, framework or company. It gives different implementations just enough shared ground to meet.

<!-- paragraph-id: p-14-a-stable-system-does-not-keep-change-out -->
Together, those agreements form infrastructure.

<!-- paragraph-id: p-14-at-the-bottom-is-infrastructure -->
Infrastructure is not built for the next release. It is built for decades, perhaps longer. Its language must stay smaller than the languages above it, because every browser, server and application may come to depend on what its words mean.

<!-- paragraph-id: p-14-infrastructure-speaks-in-small-words -->
A URL identifies, HTTP sends messages, and HTML describes a document. None of them knows whether that document is a shop, a book or a badly maintained collection of cat pictures.

<!-- paragraph-id: p-14-on-top-sits-the-platform -->
On top of infrastructure lives the platform. Browsers and web servers turn those small agreements into places where software can run. A platform can grow more easily than the infrastructure below it, but applications still need to trust that it won't suddenly move beneath them. At the same time, it needs enough power for people to build useful things on top.

<!-- paragraph-id: p-14-then-come-the-applications -->
Then come the applications. This is where purpose enters. And diversity. A calendar knows about appointments. A shop knows about products. This book knows about chapters and margins.

<!-- paragraph-id: p-14-the-same-shape-can-appear-inside-an-application -->
The pattern repeats. An application framework is an inner platform: built on the browser or server, but providing another language to the application above it.

<!-- paragraph-id: p-14-each-step-upward-allows-more-meaning-and-change -->
Each step upward allows more meaning and more change. Each step downward makes an idea harder to remove. An application feature may disappear with the application. A piece of infrastructure may have to be understood by independent systems for the next thirty years.

<!-- paragraph-id: p-14-this-is-not-a-hierarchy-of-importance -->
A stable system does not keep change out everywhere. It gives each kind of change a place.

## The Web was built this way

<!-- paragraph-id: p-14-the-web-did-not-require-one-owner-to -->
The Web did not require one owner to finish the whole idea.

<!-- paragraph-id: p-14-a-url-let-one-document-point-to-another -->
Its infrastructure did not contain a search engine, a shop or a social network. It gave browsers, servers and documents enough shared ground for other people to build them.

<!-- paragraph-id: p-14-a-new-server-could-appear-without-asking-every -->
A new server could appear without asking every browser for permission. A new browser could read existing pages. A new page could link to an old one. A new site did not need permission from the old sites before it could exist.

<!-- paragraph-id: p-14-people-built-search-engines-blogs-shops-forums-wikis -->
People built search engines, blogs, shops, forums, wikis, maps, webmail and many things nobody had thought to include in the original design. Some of it was beautiful. Some of it was regrettable. That is what happens when the world gets involved.

<!-- paragraph-id: p-14-the-important-point-is-that-the-web-did -->
The important point is that the Web did not have to predict all of it first.

<!-- paragraph-id: p-14-it-had-reachable-boundaries-a-link-could-be -->
It had reachable boundaries. A link could be shared. A page could be inspected. A server could be replaced. Someone else could build another implementation of the same agreement.

<!-- paragraph-id: p-14-the-web-as-we-live-in-it-is -->
The Web as we live in it is not entirely open ground. Search engines, social networks, app stores, cloud platforms, ad networks and identity providers have built castles on top of it.

<!-- paragraph-id: p-14-castles-are-convenient-they-reduce-friction-they-give -->
Castles are convenient. They can be built quickly, and functionality can be added without committee meetings about the exact meaning of `sameAs`. More important, they are profitable.

<!-- paragraph-id: p-14-but-the-open-ground-still-matters-without-it -->
But the open ground still matters. Without it, the castles would be the whole world.

## The outside needs a way in

<!-- paragraph-id: p-14-this-is-how-small-reusable-software-becomes-possible -->
The open ground does more than preserve what already exists. It gives new ideas somewhere to begin.

<!-- paragraph-id: p-14-if-a-program-has-to-do-everything-itself -->
A new idea can first live in an application. It can be tried, changed, abandoned or rebuilt without touching every browser and server.

<!-- paragraph-id: p-14-if-it-has-to-own-the-data-identity -->
If many applications need it, a platform may learn to provide it. But only the smallest and most durable agreements should move into infrastructure, because everything above may have to carry them for decades.

<!-- paragraph-id: p-14-small-reusable-software-needs-the-opposite-assumption-it -->
Keep an idea as high in the stack as it can live.

<!-- paragraph-id: p-14-instead-of-designing-the-entire-world-you-design -->
Instead of designing the entire world, you design where another thing can meet it. What needs a public name? Which format must survive the current implementation? Which agreement allows an independent tool to participate?

<!-- paragraph-id: p-14-the-address-is-outside-it-the-protocol-is -->
That gives outsiders somewhere to act. People are no longer captives in your castle; they become a community. They can build their own tools and extensions without asking permission.

<!-- paragraph-id: p-14-open-source-is-one-way-to-let-the -->
Open source is one way to let the outside world in, but it is not the only one. Protocols, data formats, permissive licenses, and boring standards all admit that useful ideas may arrive from elsewhere.

<!-- paragraph-id: p-14-a-wizard-should-not-be-ashamed-of-using -->
A wizard should not be ashamed of stealing other people's magic. That is how the world improves. The shame is building a system that can only use your own.
