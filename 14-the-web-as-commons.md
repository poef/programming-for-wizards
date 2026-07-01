---
tags: programming for wizards
---

# The Web as commons: innovation happens elsewhere

The previous chapter ended with change.

Software changes the world, and then the changed world comes back for the software. That is annoying, but it is also the thing that makes software interesting. A bridge, once built, can mostly go on being a bridge. A program lives in a world full of people, habits, other programs, new devices, strange edge cases, regulations, fashions, accidents and other wizards.

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

> **Interactive exhibit placeholder: `innovation-happens-elsewhere`**
>
> Show a closed app platform and an open commons side by side. In the closed model, new ideas have to be built by the platform owner before users can benefit. In the commons model, outsiders can add tools, formats, viewers or workflows through stable boundaries. Let the reader add an unexpected new use case and show which model can absorb it without asking one central owner to predict it first.

## The castle and the bazaar again

The last chapter mentioned the cathedral and the bazaar. The image is useful, but it can also mislead.

The bazaar is not magic because it is messy. Mess by itself is just mess. Anyone who has tried to use an undocumented pile of clever open source code knows this. There is nothing holy about confusion with a license file attached.

The bazaar works when there is enough shared ground for strangers to contribute without first becoming subjects of the same king.

That shared ground can be source code. It can be a protocol. It can be a file format. It can be a package system. It can be a test suite, a license, a convention, a small set of names that mean the same thing to enough people.

The important part is that the boundary is visible. Outsiders can see where to attach their work. They can replace one piece without replacing the whole world. They can build a tool the original authors did not imagine.

This is why openness is not the opposite of architecture. It is a different demand on architecture.

A closed architecture asks: how do we make all the parts work together under our control?

An open architecture asks: what must stay stable so that people outside our control can still make useful things?

The second question is harder in a less glamorous way. It means saying no to private shortcuts. It means documenting things you would rather leave implicit. It means accepting that other people will use your work wrong, or at least differently than you expected. It means the boundary has to survive contact with people who were not in the meeting.

That is the cost of letting the outside world in.

## The Web was built this way

The Web won partly because it did not require one owner to finish the whole idea.

A URL let one document point at another thing somewhere else. HTML gave documents a rough shared shape. HTTP gave browsers and servers a way to talk. Later JavaScript made the page programmable. None of these pieces had to contain the whole future.

People built browsers. People built servers. People wrote pages. People invented terrible layout tricks. People created search engines, blogs, shops, forums, wikis, maps, social networks, documentation sites, video players, webmail, package registries, and a large number of forms asking you to create an account before you can read anything.

Some of this was beautiful. Some of it was regrettable. That is what happens when the world gets involved.

The important point is that the Web did not have to predict all of it first.

This is also why the Web keeps absorbing other ideas. It is not because the Web is the best possible form for every kind of software. It plainly is not. It is because the Web has boundaries that many different people can reach. A link can be shared. A page can be inspected. A server can be replaced. A browser can be written by someone else, at least in principle. A new site does not need permission from the old sites before it can exist.

That last phrase, "at least in principle", is doing some work.

The Web as actually lived has many castles. Search engines, social networks, app stores, cloud platforms, ad networks and identity providers have all built walls on top of the open ground. This is not surprising. Castles are convenient. They are profitable. They reduce friction. They give users one button to press instead of a small lecture about standards.

Still, the open ground matters. Without it, the castles would be the whole world.

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

There is one place where the Web still very often gets this wrong.

Applications can point to each other. Servers can talk to each other. Code can depend on code written by strangers. But the user's identity and data are still usually captured by the application that happened to collect them first.

That is strange, once you notice it.

If innovation happens elsewhere, then the user should be able to benefit from tools that were invented elsewhere. But that is much harder when each app owns its own little copy of the user's life. A better calendar app cannot simply be a better calendar app if the calendar belongs to the old one. A better contacts tool cannot simply be a better contacts tool if the contacts are trapped behind another account. A small notes viewer cannot simply read the notes if the notes live inside a private platform.

The next chapter picks up this problem directly.

If the network becomes the place where software happens, then the user's home cannot belong to one application. Otherwise the castle has merely moved into the cloud.

> **Wizard rule**
>
> A closed system must solve every problem itself. An open system needs boundaries clear enough for the world to bring the next answer.
