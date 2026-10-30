# Manuscript voice review

Revised 23 September 2026 after reading two reference posts supplied by the author:

- [The web at 25](https://web.archive.org/web/20151116045252/http://poefke.nl/code/the-web-at-25/), preserved in the November 2015 snapshot.
- [We are stupid](https://web.archive.org/web/20151116045303/http://poefke.nl/code/we_are_stupid/), dated 6 May 2012 in the post, also preserved in November 2015.

The manuscript review covers all 18 chapters, all six interludes, the cover copy and author biography in the local source at `6ff682b`. Chapter order comes from `content/book.json`. No manuscript prose was changed.

**The reference posts narrow the original finding considerably.** Several things I initially treated as possible voice mismatches are established features of your writing: repeated sentence openings, emphatic fragments, rhetorical questions, sharp contrasts, long lists, qualifications and summaries. These are not reliable reasons to call a passage uncharacteristic.

The strongest remaining candidates move away from an actual technical problem into abstract commentary about what the example or the book means. Other findings are ordinary editing opportunities, especially duplication. I have separated those below. None is a claim about who wrote a particular sentence.

The older posts show a developer arguing through a problem with the reader. You make a provocative claim, explain a mechanism, anticipate an objection and qualify the claim when necessary. In *The web at 25*, browser behavior and the work it creates supply the sarcasm's targets. In *We are stupid*, the proposal develops through tensions between approaches: DSLs can help, data can be simpler, immutability can help, and enforcing it everywhere can make some work harder. The reader sees how you arrive at a position.

Your first-person uncertainty is part of that voice. So is repetition: the 2012 post deliberately repeats “I learned the value” through an account of practical experience. The book's rhetorical devices should be assessed by what they accomplish, not by how closely they resemble a list of AI-writing signals.

The references also establish continuity in the substance. Underworld, small components, Alan Kay, DSLs, shared state, encapsulation and the Internet as an example of manageable local complexity were already part of your argument in 2012. Chapters 6–7 have a similarly direct connection to the older discussion of browsers and `contenteditable`. These are substantial reasons to recognize the author's voice and interests in the manuscript.

There are limits to the comparison. Two argumentative blog posts do not define the only voice you can use. A teaching book can be calmer, more structured and more polished, and the wizard motif deliberately introduces another register. The answer is not to add anger, uncertainty or personal anecdotes everywhere. Nor should spelling and punctuation mistakes be preserved as markers of authenticity.

The revision history remains useful secondary evidence. Commits `8804c5f` and `c541d07` often join clipped sentences into flowing explanations. In `90ff819`, chapter 10 loses an introduction that explains the point before demonstrating it. In `e2d0b8d`, chapter 14 loses an explicit bridge and repeated conclusions. These show local editorial choices, not a rule against short sentences or summaries.

The twelve original findings are reassessed here so the corrections are explicit.

1. **Chapter 10: repeated composition explanation. Retain as an editing suggestion; withdraw the cadence-based voice objection.** [Source, line 499](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/10-code-exhibit-growing-queries-inside-javascript.md:499)

   > Arrow functions did not need to be added. Imports did not need to be added. Tests did not need to be added.

   The older posts establish that repeated openings are compatible with your voice. What still warrants attention is that the next paragraph explains the same benefit again. Keep whichever explanation you prefer, or retain one concrete observation about the spread operator followed by the next paragraph. This is about duplicate work, not suspicious syntax.

2. **Chapter 10: the wooden model and its shape. Retain as a stronger voice concern.** [Source, line 381](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/10-code-exhibit-growing-queries-inside-javascript.md:381)

   > This is not JAQT. It is a small wooden model of the bridge.
   >
   > The point of the model is the shape.

   The reader has just built a working query tool, but the prose moves to a bridge that has not been sufficiently established and then explains the metaphor's significance. Your older explanations tend to stay with what the mechanism does and what it costs. Say what this simplified version leaves out, then continue.

   I would no longer suggest cutting “Libraries are where edge cases go to start families” merely because it is a polished joke. Its fit is a matter of taste. The unsupported bridge is the clearer problem.

3. **Chapter 11: the second ending. Retain as an editing suggestion, not a voice diagnosis.** [Source, line 202](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/11-the-knitted-castle.md:202)

   > The knitted castle is always waiting. Every useful feature wants to add another loop.

   This final paragraph restates the previous paragraph's conclusion about studs and threads. Your reference posts do summarize and repeat, so repetition alone does not make it unlike you. I would still try ending one paragraph earlier: the reader has already understood the boundary, and the second ending explains the wizard's role again.

4. **Chapter 12: the introductory recap and OOP overview. Downgrade to a pacing suggestion.** [Source, line 8](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/12-boundaries-data-behavior-and-time.md:8)

   > In the previous chapter we looked at the knitted castle: the strange tendency of software to grow threads.

   The first review called the extended opening a strong voice mismatch. That was too confident. *We are stupid* also surveys earlier approaches to complexity before proposing another arrangement, and explains OOP's promise in that context. The opening is compatible with your reasoning habits.

   A shorter route to “Where should behavior live?” could still improve the pace. Starting from the order-cancellation problem would make it concrete sooner. That is an optional teaching decision, not a correction of authorship.

5. **Chapter 12: the weather-report joke. Withdraw as a voice flag.** [Source, line 110](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/12-boundaries-data-behavior-and-time.md:110)

   > Forget the frameworks, the annotations, and the containers with configuration files so large that they need their own weather report.

   The references show plenty of exaggeration and pointed commentary about unnecessary complexity. The joke may or may not be your favorite, but I do not have a sufficient basis for calling it unlike you. The earlier suggested bland replacement would risk removing personality.

6. **Chapter 13: reassurance and personification. Retain as a possible voice concern.** [Source, line 148](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/13-architecture-arches-and-change.md:148)

   > That is not a moral failure. It is what happens when you have to work before the future has finished introducing itself.

   Your older writing makes room for mistakes and imperfect solutions. The mismatch is therefore not the qualification itself. It is the move from an engineering trade-off into moral reassurance, followed by a personification that adds little explanation. The next sentence asks whether being wrong breaks everything; that is closer to the practical issue you tend to pursue. Trying the paragraph with only that sentence remains worthwhile.

   “You will be wrong. Try not to make it hurt” fits especially well with the 2012 argument that systems should accommodate our limitations.

7. **Chapter 13: repeated manners jokes. Retain as a small editing suggestion.** [First occurrence, line 104](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/13-architecture-arches-and-change.md:104); [second, line 136](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/13-architecture-arches-and-change.md:136)

   > Software history does not have these manners.
   >
   > Software has no such manners.

   Either joke fits. Their proximity may make the second less effective, but is not evidence of an alien narrator. My preference is to keep the first, where it answers the imagined software politely replacing its predecessor.

8. **Chapter 15: commentary about the book's construction. Retain as a stronger voice concern.** [Source, line 192](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/15-the-web-as-data-things-should-have-addresses-too.md:192)

   > This is the URL chapter returning in another costume.

   You certainly guide readers and refer back to earlier examples. This particular sentence sounds like an editor describing the manuscript's architecture. It substitutes a costume metaphor for the actual connection, which the next sentence explains directly. I would cut it.

   The contacts/calendar/photo example returns in the final section. That is a separate, ordinary opportunity to shorten the chapter while keeping its question about where data should live. [Source, line 254](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/15-the-web-as-data-things-should-have-addresses-too.md:254)

9. **Chapter 16: an abstract maxim. Retain as a possible voice concern.** [Source, line 68](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/16-the-web-as-home-who-owns-your-home-directory.md:68)

   > Sometimes moving the boundary changes the problem more than solving it ever could.

   The problem is its imprecision rather than its rhetorical shape. The diagrams demonstrate a concrete change in ownership. This sentence replaces that explanation with a comparison between changing and solving an unspecified problem. Your older abstractions generally retain an explicit technical consequence. Try removing it and moving directly to what the alternative arrangement requires.

10. **Chapter 17: the emphatic privacy explanation. Withdraw as a voice flag.** [Source, line 55](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/17-epilogue-the-margin-you-have-been-using.md:55)

    > Not the whole notebook. Not every unfinished thought in the margin. One note, deliberately chosen.

    The reference posts use theatrical emphasis and short corrective beats. Here, the emphasis also serves a concrete purpose: specifying what is shared. It may repeat the preceding sentence, but it is compatible with your voice. I would not change it just to make it sound more human.

11. **Chapter 17: the final thematic recap. Retain as an editing concern; narrow the voice claim.** [Source, line 90](/home/auke/git/muze-labs/programming-for-wizards/content/chapters/17-epilogue-the-margin-you-have-been-using.md:90)

    > This book has tried to show why notation matters, why programs grow languages, why assumptions become threads, and why boundaries decide how software can change.

    The reference posts have conclusions, summaries and general claims, so my earlier description of this as resembling a generated conclusion was too broad. The specific concern is that it becomes a synopsis of the book after the working margin has demonstrated the argument. Your older endings continue the reasoning toward a consequence, proposal or unresolved question.

    Try removing this recap paragraph and reading the ending again. Preserve the concrete margin example, the “You were using it” reveal and the joke about an artificial imitation working under supervision.

12. **Author biography: promotional abstractions. Retain as a register concern, with a genre qualification.** [Source, line 11](/home/auke/git/muze-labs/programming-for-wizards/content/backmatter/about-the-author.md:11)

    > experiments that lower the distance between reading a page and changing it
    >
    > the Web as something people should be able to inhabit rather than merely consume

    This is noticeably less concrete than your accounts of your work. However, a third-person biography can intentionally sound different from an argumentative post. The worthwhile change is to name actual work and what it enables, particularly in place of the awkward “lower the distance.” This is not evidence about authorship.

The complete chapter pass has also been recalibrated. “No strong flag” refers to voice, not to technical or historical accuracy.

| Chapter | Revised assessment |
| --- | --- |
| 1 — This is not a programming book | Withdraw the concern about the tools/framework reassurance. The 2012 post itself asks how to improve systems while keeping existing tools. A concession to readers is characteristic, not inherently generic. |
| 2 — Numbers | No strong flag. The conversational detours and mechanisms fit. Keep the brief recap unless you want to shorten it for pacing. |
| 3 — Logic | No strong flag. A general lesson after a concrete demonstration is compatible with both references. |
| 4 — Language | Withdraw the minor concern about the naming/decoration contrast. Your older prose uses explicit contrasts and conclusions. The mind-control opening is distinctive within the book's chosen register. |
| 5 — Web addresses | No strong flag. “A simpler name world” is awkward wording, not a different voice. |
| 6 — HTML | Strong continuity with the older browser post, including practical concern with editing markup. The vague source introduction at line 14 is a wording issue only. |
| 7 — JavaScript | Strong continuity with the older post's specific complaints, sarcasm and implementation-level consequences. Preserve its opinions and personality. |
| 8 — Programming languages | Withdraw the form-based concern about the Lisp paragraph. The 2012 post also considers competing approaches and explains why each helps only so far. |
| 9 — Separated by a Common Language | The Underworld material is directly corroborated by the 2012 post. Withdraw the suggestion to delete emphatic signposts simply because they are emphatic. Read them for local redundancy only. |
| 10 — JAQT | Main voice concern: the unexplained bridge/model passage. Repeated composition explanations are an editing issue. Polished jokes alone do not establish a mismatch. |
| 11 — The knitted castle | Strong thematic continuity with the 2012 complexity argument. Consider one ending rather than two. The extra signpost at line 152 is optional, not suspect. |
| 12 — Boundaries | Downgrade the opening concern to pacing; withdraw the joke concern. The discussion of competing mechanisms and abstraction levels fits the older reasoning. |
| 13 — Architecture | The practical account of being wrong fits. Review the moral reassurance as a possible tonal departure, and the second manners joke as repetition. |
| 14 — Commons | Mostly fits. “The messy, adaptive energy of open source” is less direct than your usual description of how something works. The abstract “purpose enters” passage is optional tightening. No broad mismatch. |
| 15 — Linked data | The examples and questions fit. The explicit costume/chapter callback sounds more editorial. Its repeated final example can be shortened independently of voice. |
| 16 — Home directory | The trade-offs and acceptance that a proposed system may fail fit especially well. The vague boundary maxim remains a candidate. “Those problems are the point” could be more specific, but that is not an authorship signal. |
| 17 — Epilogue | Withdraw the privacy-emphasis concern. Retain the suggestion to trim the synopsis after the demonstration, while recognizing that a book ending may reasonably recap more than a post. |
| 18 — Acknowledgements | No strong flag. The direct acceptance of responsibility fits the author's willingness to include himself in criticism. |

The interludes have a deliberately different register. The older posts support the use of blunt reversals and playful exchanges. The concerns about interludes 2 and 4 are therefore semantic: it is not clear why meaning escaping, or a spell doing what it says, is bad. Their short, balanced dialogue is not a voice problem by itself. Interludes 1, 3 and 5 have clearer setups and payoffs; interlude 6 connects its abstraction to the final rule.

The cover's aspirational language and the biography's third-person register may be intentional. I would judge them as cover and biography copy, rather than requiring them to sound like a first-person blog argument.

The first changes I would try remain small: clarify or remove the bridge/model language in chapter 10, remove the costume callback in chapter 15, and test shorter endings in chapters 11 and 17. Consider the chapter 12 opening for pace. Do not remove repetition, rhetorical questions, explicit lessons, strong opinions or jokes wholesale: the reference posts show that these belong to your voice.
