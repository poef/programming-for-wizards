# Content

This folder contains the source documents for the book and its product notes.

- [book.json](book.json): canonical book structure for the generated site. It defines the book title, parts, chapter order, chapter numbers, chapter titles, and source files.
- [chapters](chapters): manuscript chapter files. Filenames no longer define the generated reading order.
- [notes](notes): planning, presentation, accessibility, exhibit and publishing notes.

Generated HTML belongs in `site/`, not here.

To reorganize the static site, edit `book.json` first. You can move chapter entries between parts, change their `number`, change display `title`, or point an entry at a different Markdown `source` file.
