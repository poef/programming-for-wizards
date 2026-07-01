---
tags: programming for wizards
---

# Programming for Wizards: the Web, part 1

In 1989 a wizard called Tim invented the World-Wide Web and changed the world forever. In fact there was [quite](https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall) a [bit](https://history.state.gov/milestones/1989-1992/apartheid) of [world-changing](https://en.wikipedia.org/wiki/History_of_Poland_(1945%E2%80%931989)#Final_decade_of_the_Polish_People's_Republic_(1980%E2%80%931989)) going on in 1989. So this particalur change didn't look all that world-shaking at the time. Now, in 2021, it seems that in fact it was much more impactful than all the other changes of that year.

Here is an example of a webpage:

```htmlembedded=
<header>
<title>http://info.cern.ch</title>
</header>

<h1>http://info.cern.ch - home of the first website</h1>
<p>From here you can:</p>
<ul>
<li><a href="http://info.cern.ch/hypertext/WWW/TheProject.html">Browse the 
    first website</a></li>
<li><a href="http://line-mode.cern.ch/www/hypertext/WWW/TheProject.html">
    Browse the first website using the line-mode browser simulator</a></li>
<li><a href="http://home.web.cern.ch/topics/birth-web">Learn about the birth
    of the web</a></li>
<li><a href="http://home.web.cern.ch/about">Learn about CERN, the 
    physics laboratory where the web was born</a></li>
</ul>
</body>
```

It doesn't look very revolutionary today. And in fact most of the ideas and solutions of the Web weren't revolutionary at all. But there is one thing here that truly is. Notice the simple `<a href="...">` tags here. Such a small thing, a tag with just one letter. But this is what made the Web a revolution:

```htmlembedded=
<a href="http://info.cern.ch/hypertext/WWW/TheProject.html">Browse the first 
website</a>
```
Almost hidden inside that `<A>` tag is another, probably even more important invention: the URL, or Uniform Resource Locator. To understand why, let's go back to 1989 again.

In 1989 the internet, as we know it, was a few years old. And the idea of something called Hypertext was older still. In fact, you could trace this idea back, through Ted Nelson, who [coined the term in 1965](https://www.historyofinformation.com/detail.php?id=830), to Vannevar Bush, who thought up the [whole web idea in 1945](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/). 

But while Hypertext as a concept had been around, nobody had truly made it work. At least not on a global scale. Ted Nelson started the [Xanadu project](https://en.wikipedia.org/wiki/Project_Xanadu) in the 1960's, but as of 1989 there was no working version. In fact there never would be. Apple made something called [Hypercard](https://historyofinformation.com/detail.php?id=4783) and released it in 1987. But Hypercard, while it did have links, had no ability to link to a card on another computer, so today almost nobody has heard of it.

Xanadu never got released, because the problem they tried to solve was just too big. Hypercard never got as big as the Web, because it couldn't cross the gap between computers.

Sir Tim found a simple solution. The internet, as we know it, was around for a few years already. The internet pioneers had solved the problem of connecting computers together ([tcp/ip](https://nl.wikipedia.org/wiki/TCP/IP)), and the problem of finding specific computers to connect to ([dns](https://nl.wikipedia.org/wiki/Domain_Name_System)). So sir Tim decided correctly to [steal](https://hackmd.io/@Poef/Skdy13ecK#Wizards-first-rule-steal) this work and re-use it in his URL solution:

```url
http://info.cern.ch/hypertext/WWW/TheProject.html
```

The first part specifies the protocol to use--we'll get back to that later. The second part is `info.cern.ch` or the hostname, the name with which to find a specific server on the internet. The last part is the path to a file on that specific computer. So the URL combines these three pieces of information together in a single, human-readable string: 

- The protocol
- The hostname
- The file path

And just like that, we could now refer to any file on any computer anywhere in the world. As long as it was published on the internet anyway.

If you are interested in more history of the `<A>` tag, you should read the article [`<A>` by Jeremy Keith](https://adactio.com/articles/10887), or [watch his talk](https://vimeo.com/172794545).

## Disecting the URL: the path

As mentioned above, an important part of the URL is the path. This is a string like:

```
/folder/subfolder/file.html
```

You can split a path by the `/` seperator, and you get the folder and file names. In this case:

```
folder
subfolder
file.html
```

If a path ends with a `/`, the last name is a folder name. If not, it is a file name.

So what happens if a folder or file name contains a `/`? The simple answer is to not do that, but life is never that easy. One solution is to encode that `/` in a different way. You could encode it using an escape character, eg. `\`:

```
/folder\/with_a_slash/
```

The meaning of `\` is 'the next character is special'. For example, `\n` would mean a new line, `\r` a return character, etc. Unfortunately this hits a problem: DOS (and Windows) already use the `\` character as the path seperator, instead of the `/` character. Because of the expected confusion, sir Tim chose a different encoding format, now called URL encoding:

```
/folder%2Fwith_a_slash/
```

The escape character, that signifies the start of an encoded sequence, is the `%` character. And it is always followed by two hexadecimal digits. So `%2F` is decimal 47, and in the [ASCII encoding](https://en.wikipedia.org/wiki/ASCII) means `/`.

This solution has a nice benefit: Any character can be encoded this way. So if you need any other ASCII character in there, just find its hexadecimal number and put it in there. The `%` itself is encoded as `%25`. And even if the character itself isn't printable, the hexadecimal encoding is. This is important if you want URL's to appear in other media, like e-mail or even books.

The Web was developed on a Unix machine, the Next Cube, designed by Steve Jobs. So it is no surprise that the URL follows Unix's path format. As mentioned DOS and Windows use a different structure. The most important difference is not the path seperator. DOS and Windows do not have the concept of a root folder. Instead there are device letters, e.g. `A:`, `B:`, `C:`, etc. Most operating systems of the era had a similar system. Here is an example file path in VMS:

```
NODE"accountname password"::device:[directory.subdirectory]filename.type;ver
```

Unix was designed and built in the 1970's. Its name is a play on another early operating system, called Multics, which in the Unix designers mind was much too complex. However it did inherit the hierarchical filesystem design from Multics. If you compare it to the VMS syntax, you may understand why.

But how do you use multiple devices, if the device name is not in the file path? This is the real beauty of the Unix system. In its design it was decided that the physical device name is not relevant to the user, only to system administrators. Instead only the filenames are relevant. So a physical device name is still present in any Unix system, but it is cleverly hidden by 'mounting' a device as a filename on another filesystem. And there is always a single root device and filesystem, which is defined when booting.

So there you have it, the design of the URL is based for a large part on the design of the Unix filesystem, which itself was based on Multics.

## Disecting the URL: the hostname

Back to the the original example URL:

```url
http://info.cern.ch/hypertext/WWW/TheProject.html
```

The interesting part here is
```url
//info.cern.ch/
```

Not everyone knows that this in itself is a perfectly valid URL. There is no requirement to add a protocol at all. In fact, the shortest valid URL you can type is `/`. This is a 'relative' URL, in that it assumes the hostname is the same as the origin URL of the document it is part of. This is also the reason for the double slash `//`. This indicates that the next part is the hostname, not just a filename.

This is not an invention by sir Tim, however. He [stole](https://www.w3.org/People/Berners-Lee/FAQ.html#etc) this from the wizards of [Apollo](https://en.wikipedia.org/wiki/Apollo/Domain), not the spacecraft but the relatively unknown workstations from the 1980's. Their system was designed to be networked, the operating system distributed by nature, so there was a need to be able to refer to files across multiple computers and devices. However this design predates the design of the other, much more important part: the Domain Name System, or DNS for short.

Today the DNS system is almost synonymous with the Internet. However, the internet is much older. The first ARPAnet connections were made in 1969, internetworking came after 1974 and between 1984 and 1988 CERN got connected.

Initially the number of computers connected was low enough for system administrators to manually edit so-called hosts files. You computer most likely still has a host file laying around somewhere. A host file is just a list of hostnames with their IP address. This allows you to type `ping examplehost` and if the host file contains the address for `examplehost`, it will fill in the IP address automatically.

It was soon clear that this solution did not scale. There was a need for a solution that could be implemented in a decentralized way. A wizard called Paul Mockapetris was tasked with designing a suitable solution. He did so in 1983, and in 1986 it became an internet standard. And for its day it was admirably decentralized.

To recap, in 1988 when sir Tim started his work on the web, the internet was tiny and new, the DNS system only two years old, but already standard. So the simplest solution for the URL was to steal this idea and embed it.

## Disecting the URL: the protocol

The final part of the URL--that I'll discuss in this chapter--is the protocol. It may seem a small almost insignificant part. But if you compare it to other systems of the time, it is a sign of the almost megalomaniac ambitions of sir Tim.

Let's take a look at another world-wide information system, called Gopher. The first gopher information servers were released 1991 and for a brief time they reigned supreme. But there is one key difference I want to point out here. Take a look at a single line of the information a Gopher server sends to a client:

```
1CIA World Factbook     /Archives/politics/CIA    gopher.quux.org 70
```

There is a type, the first character, a title, a file path, a hostname and finally a port number. But there is no protocol indication here. The assumption is that a gopher server will always point to information on another gopher server. Sir Tim did not make the same mistake and embraced all other existing protocols in one swoop, by adding the protocol name to the URL at te start. How this protocol was to be handled was left to the WWW client, the web browser. Two wizards called Marc Andreessen and Eric Bina released a graphical web browser in 1993. Marc Andreessen went on to found Netscape. The Netscape browser grew to incorporate e-mail and news clients, using the powers granted by the URL. Today their work still lives on in Mozilla's Firefox.

Firefox supports HTTP, HTTPS and FILE protocols directly. It used to support FTP as well, but that is deemed to insecure today. But the protocol system has been expanded wildly for many more usecases, like the `data:` scheme. Not somuch a protocol but an indicator telling the browser how to interpret the rest of the URL string. 

For the curious here is a list of [all officially listed schemes](https://en.wikipedia.org/wiki/List_of_URI_schemes). If you read through them, you will notice that a lot of those schemes were never intended to be used in a web-browser. Instead the URL has such a great design that wizards everywhere steal it and extend it for their own purposes.


