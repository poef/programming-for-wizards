---
tags: programming for wizards
---

# The Web as home: who owns your home directory?

<!-- paragraph-id: p-16-earlier-we-saw-the-network-becoming-the-operating -->
Earlier we saw the network becoming the operating system.

<!-- paragraph-id: p-16-but-where-is-the-users-home-directory-and -->
But where is the user's home directory, and who controls it?

<!-- paragraph-id: p-16-linked-data-gave-us-names-and-meanings-that -->
Linked data gave us names and meanings that can cross application boundaries, but it did not give that data a home.

<!-- paragraph-id: p-16-on-a-normal-computer-the-home-directory-question -->
On a normal computer, the home-directory question has an obvious answer, at least in theory. Your documents, photos, music, projects, notes, saved games, half-written novels and badly named folders live somewhere that is more yours than the applications are.

<!-- paragraph-id: p-16-you-can-install-another-text-editor-without-rewriting -->
You can install another text editor without rewriting every document. You can open an image in a different program. You can remove an application and, if the world is not too cursed, your files remain.

<!-- paragraph-id: p-16-the-web-grew-up-differently -->
The Web did not follow that example.

<!-- paragraph-id: p-16-your-mail-lives-in-the-mail-application-your -->
Your mail lives in the mail application. Your photos live in the photo application. Your calendar lives in the calendar application. Each service brings its own account, storage, permissions, interface, business model and export button if you are lucky.

<!-- paragraph-id: p-16-when-an-application-owns-the-interface-account-data -->
That is convenient for the maker of the application. Everything can be designed as one system. It is often convenient for the user too, until they want to replace one part of it.

<!-- paragraph-id: p-16-software-moved-into-the-network-the-users-home -->
Software moved into the network. The user's home did not come with it.

## A sideways look

<!-- paragraph-id: p-16-one-way-to-describe-the-modern-web-is -->
One way to describe the modern Web is:

<!-- code-id: app-owned-world -->
```text id="app-owned-world"
application -> account -> data
```

<!-- paragraph-id: p-16-the-application-is-the-starting-point-you-choose -->
The application is the starting point. You choose an application, create an account inside it, and your data begins to accumulate there.

<!-- paragraph-id: p-16-there-is-another-possible-shape -->
There is another way to organize the same elements:

<!-- code-id: user-owned-world -->
```text id="user-owned-world"
identity -> data -> applications
```

<!-- paragraph-id: p-16-the-person-is-the-starting-point-the-data -->
The person is the starting point. The data lives near that person. Applications receive permission to read or change parts of it.

<!-- paragraph-id: p-16-the-elements-have-not-changed-only-their-order -->
The elements have not changed. Only their order has.

<!-- paragraph-id: p-16-in-the-first-shape-replacing-an-application-means -->
In the first version, replacing an application means moving your life from one system to another.

<!-- paragraph-id: p-16-in-the-second-replacing-an-application-can-be -->
In the second, replacing an application can be closer to changing tools on a workbench.

<!-- paragraph-id: p-16-sometimes-moving-the-boundary-changes-the-problem-more -->
Sometimes moving the boundary changes the problem more than solving it ever could.

<!-- paragraph-id: p-16-for-this-second-shape-to-work -->
For this second shape to work, the important things cannot all be owned by the application.

<!-- paragraph-id: p-16-linked-data-helps-different-tools-understand-the-same -->
Linked data helps different tools understand the same things. But by itself, it does not organize the world differently. Identity, storage and permission must also exist independently of the application.

## Connecting to Solid

<!-- paragraph-id: p-16-there-is-a-project-called-solid-that-explores -->
There is a project called [Solid](https://solidproject.org/) that explores this kind of world. 

<!-- paragraph-id: p-16-solid-separates-identity-and-data-from-applications-a -->
Solid separates identity and data from applications. A person has an identity on the Web. Their data can live in storage they choose, usually called a pod. Applications ask for permission to read or change parts of it.

<!-- paragraph-id: p-16-the-solid-protocols-are-an-attempt-to-put -->
The Solid protocols add shared infrastructure for identity, storage and permissions to the Web. They do not prescribe a calendar, notebook, shop or social network. Those belong higher up.

<!-- paragraph-id: p-16-solid-servers-and-libraries-can-form-platforms -->
Solid servers and libraries provide a platform on top of those agreements. A notes application can write a note without also becoming an identity provider, storage service and permission system.

<!-- paragraph-id: p-16-linked-data-describes-what-the-data-means-and -->
Linked data describes what the data means and how it relates to other things. Solid decides where that data lives, who controls it, and which applications may use it.

<!-- paragraph-id: p-16-solid-does-not-replace-the-web-it-enhances -->
Solid adds to the Web rather than replacing it. It can be useful without becoming the answer to everything.

## Applications as visitors

<!-- paragraph-id: p-16-once-data-and-identity-live-outside -->
Once data and identity live outside the application, the application no longer has to become a kingdom before it can be useful.

<!-- paragraph-id: p-16-a-calendar-can-concentrate-on-appointments -->
A calendar can concentrate on appointments. A contacts tool can concentrate on people. A notes editor can concentrate on writing notes. They can work with the same people, places and events without sharing a codebase, framework or owner.

<!-- paragraph-id: p-16-an-application-can-arrive-do-useful-work -->
An application can arrive, do useful work, and leave without taking the user's world with it.

<!-- paragraph-id: p-16-a-library-lets-another-program-reuse-code -->
A library lets another program reuse code. Shared data lets another application reuse what a person has already made. The first saves the programmer work. The second keeps the user's world from being trapped in the first application.

<!-- paragraph-id: p-16-reusable-software-is-not-only-software-that-can -->
Reusable software is not only software that can be imported into another program. It can be software that can be replaced by another program without taking the user's world with it.

<!-- paragraph-id: p-16-a-better-tool-does-not-first-have -->
A better tool does not first have to persuade you to abandon everything you made with the old one. It can ask for access and try to be better.

<!-- paragraph-id: p-16-innovation-can-arrive-from-elsewhere-because-your-world -->
Innovation can arrive from elsewhere because your world is not sealed inside the original application.

## Where the complexity goes

<!-- paragraph-id: p-16-none-of-this-removes-complexity -->
None of this removes complexity.

<!-- paragraph-id: p-16-permissions-can-be-confusing -->
Permissions can be confusing. Applications may disagree about data. Vocabularies can drift. Two tools may change the same thing at the same time. Storage providers can fail, disappear or become less friendly than they were when you chose them.

<!-- paragraph-id: p-16-centralised-services-hide-many-of-these-problems -->
Centralised services hide many of these problems by making one organization responsible for the whole system. That can be a good bargain. One account and one button are easier to explain than identity providers, storage providers and access rules.

<!-- paragraph-id: p-16-moving-the-boundary-does-not-make-the-problems -->
Moving the boundary does not make the problems disappear. It makes them shared problems instead of private details hidden inside each application.

<!-- paragraph-id: p-16-that-is-harder-in-some-ways -->
Those problems are the point. They show where the real work needs to be done. They are the price of giving independent tools room to exist.

<!-- paragraph-id: p-16-solid-may-fail-for-social-reasons -->
Solid may fail for social reasons, business reasons, usability reasons, or because another system finds a better shape. Standards do not win merely by being sensible.

<!-- paragraph-id: p-16-final-forms-have-not-done-well -->
Final forms have not done very well in this book.

## Small tools, not kingdoms

<!-- paragraph-id: p-16-back-in-the-knitted-castle -->
Back in the knitted castle, the reusable thing turned out not to be only the code. It was the boundary around the code.

<!-- paragraph-id: p-16-solid-moves-that-boundary-around-the-whole -->
Solid moves that boundary around the whole application. The application itself can become one of the replaceable parts.

<!-- paragraph-id: p-16-a-private-application-asks -->
A private application asks:

<!-- aside-id: aside-16-how-can-we-keep-the-user-inside -->
> How can we keep the user inside?

<!-- paragraph-id: p-16-a-personal-web-asks -->
A personal Web asks:

<!-- aside-id: aside-16-how-can-this-tool-remain-useful-after-the -->
> How can this tool remain useful after the user replaces it?

<!-- paragraph-id: p-16-the-second-question-does-not-require-solid -->
The second question does not require Solid as its only answer. But Solid is a serious attempt to build the answer into the Web itself.

<!-- paragraph-id: p-16-the-web-has-become-an-operating-system -->
The Web has become an operating system.

<!-- paragraph-id: p-16-the-user-still-needs-a-home-directory -->
The user still needs a home directory.
