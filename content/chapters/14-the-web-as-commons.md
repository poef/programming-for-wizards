---
tags: programming for wizards
---

# The Web as commons: innovation happens elsewhere

The previous chapter ended with change.

Software changes the world, and then the changed world comes back for the software. That is annoying, but it is also the thing that makes software interesting. A bridge, once built, can mostly go on being a bridge. A program lives in a world full of people, habits, other programs, new devices, strange edge cases, regulations, fashions, accidents and other wizards.

The Web is one of the best examples we have of software built for that kind of pressure. Not perfectly. Not innocently. But deeply. It was made from small agreements that let strangers connect things across distance, ownership, and time.

That helped with some kinds of reuse. A page can link to another page. A browser can visit a server it has never seen before. A site can load an image, a script, a stylesheet, an API, a payment form, a map.

But the Web as we actually use it has not made software as replaceable as documents. A web service usually arrives as one bundle: application, account, data, identity, permissions, interface, business model. You can use the bundle. You can sometimes export from the bundle. But replacing one piece without accepting the whole little world is still harder than it ought to be.

So the next question is where the answers are supposed to come from.

The tempting answer is: from inside the system. Hire the right people. Build the complete platform. Design the perfect extension mechanism. Add every feature the users might need. Make the castle large enough that nobody has to leave.

This is a very natural dream for programmers. We like complete worlds. We like systems where the parts fit together because one mind, or at least one organization, decided how they should fit. It feels safer. It feels cleaner. It makes the diagrams look better.

But the world is larger than your diagram.

There is an old open source book by Ron Goldman and Richard P. Gabriel called [*Innovation Happens Elsewhere*](https://dreamsongs.com/IHE/). The title is the important part. It sounds like business advice, and it is, but it is also software architecture advice.

No matter how clever your team is, most of the clever people are somewhere else. No matter how carefully you study your users, most of their lives happen outside your product. No matter how broad your platform becomes, most of the next good ideas will be born beyond its walls.

A closed system can still be wonderful. Sometimes the closed system is exactly why the experience feels polished. Everything can be tuned together. The defaults can be chosen. The buttons can be in the right place. The rough edges can be hidden.

But the price is that the future has to arrive through the front gate.

If the owner of the system does not build the thing, the thing does not exist there. If an outside wizard has a better idea, that idea must either be accepted by the castle, copied by the castle, or live outside the castle where the users may never find it.

That is a dangerous place to put the future.

For our purposes, that is the useful part of the bazaar image: enough shared ground for strangers to contribute without first becoming subjects of the same king.

## The Web was built this way

The Web won partly because it did not require one owner to finish the whole idea.

A URL let one document point at another thing somewhere else. HTML gave documents a rough shared shape. HTTP gave browsers and servers a way to talk. Later JavaScript made the page programmable. None of these pieces had to contain the whole future.

People built browsers and servers. They wrote pages, abused tables for layout, made search engines, blogs, shops, forums, wikis, maps, webmail, package registries, and then a great many ways of asking you to create an account before you can read anything.

Some of this was beautiful. Some of it was regrettable. That is what happens when the world gets involved.

The important point is that the Web did not have to predict all of it first.

This is also why the Web keeps absorbing other ideas. It is not because the Web is the best possible form for every kind of software. It plainly is not. It is because the Web has boundaries that many different people can reach. A link can be shared. A page can be inspected. A server can be replaced. A browser can be written by someone else, at least in principle. A new site does not need permission from the old sites before it can exist.

That last phrase, "at least in principle", is doing some work.

The Web as actually lived has many castles. Search engines, social networks, app stores, cloud platforms, ad networks and identity providers have all built walls on top of the open ground. This is not surprising. Castles are convenient. They are profitable. They reduce friction. They give users one button to press instead of a small lecture about standards.

Still, the open ground matters. Without it, the castles would be the whole world.

So perhaps the question is not only whether the Web can stay open.

Perhaps the question is whether we can use the Web's own architecture to add more boundaries in the places where services usually bundle things together: the application, the user's data, and the user's identity.

Could those pieces become smaller, more independent, and easier to replace, so people can extend the system without becoming subjects of the same kingdom?

## Small software needs a large outside

This brings us back to the knitted castle.

If a program has to do everything itself, it will grow. If it has to own the data, the identity, the editor, the storage, the sharing model, the plugin system, the export format, the user interface and the business model, then it will become a world. Perhaps a good world. But still a world.

Small replaceable software needs the opposite assumption. It needs to assume that important things live outside it.

The address is outside it. The data may be outside it. The identity may be outside it. The next tool may be written by someone else. The user may prefer another interface. The useful extension may be a weekend project by a person you have never met.

This does not remove design work. It changes the design work.

Instead of designing the entire kingdom, you design the border crossings. You decide what needs a shared name, what needs a stable format, what needs permission, what needs to be private, what needs to be replaceable. You do not make the system powerful by making it contain everything. You make it powerful by letting it cooperate with things that are not itself.

This is one of the reasons open source matters, but it is not only about source code. Source code is one way to let the outside world participate. Protocols, data formats, public APIs, documentation, permissive licenses, view-source culture and boring standards are also ways to admit that useful ideas may arrive from elsewhere.

A wizard should not be ashamed of using other people's magic. That is how the craft advances. The shame is building a system that can only use your own.

## The next boundary

So this is the first piece: applications should be able to stay small.

A tool should not have to become a kingdom before it can be useful. It should be able to arrive from the outside, do its work, and leave the user's world behind when it goes.

But for that to happen, the boundary cannot only sit between one website and another. It has to move inside the web service itself.

The application is one thing. The data it works on is another. The identity that grants access is another again.

This chapter has mostly been about the first piece: tools that can be replaced, extended, ignored, or improved by people outside the original design.

The next piece is data.

Applications have often been gatekeepers for people's data. Write a document in Word, send it to someone, and you may also be sending a quiet requirement: use Word too, or at least something compatible enough to pretend. That is not only a technical shape. It is a business shape. It keeps the user close to the application, the ecosystem, the account.

The Web was supposed to be different. A page did not require the editor that wrote it. A link did not belong to the tool that made the link. But web applications have often rebuilt the old gate in a new place.

If the network becomes the place where software happens, then the facts inside our software cannot remain trapped behind private names forever. Otherwise the castle has merely learned to export a few files through a gate.
