const CACHE_NAME = "programming-for-wizards-454154ee28"
const PRECACHE_URLS = [
  "./assets/book.css",
  "./assets/book.js",
  "./assets/exhibits/exhibit-kit.js",
  "./assets/exhibits/exhibits.css",
  "./assets/exhibits/exhibits.js",
  "./assets/exhibits/exhibits/html-tree.js",
  "./assets/exhibits/exhibits/jaqt.js",
  "./assets/exhibits/exhibits/knitted-castle.js",
  "./assets/exhibits/exhibits/numbers.js",
  "./assets/exhibits/exhibits/same-problem.js",
  "./assets/exhibits/exhibits/shared.js",
  "./assets/images/epub/abacus-6.png",
  "./assets/images/epub/metal-movable-type-small.jpg",
  "./assets/images/epub/metal-movable-type.jpg",
  "./assets/images/epub/roth-calculating-machine-detail-small.png",
  "./assets/images/epub/roth-calculating-machine-detail.png",
  "./assets/images/epub/tally-marks-five-bar-gate.png",
  "./assets/images/epub/tally-marks-five-bar-gate.svg",
  "./assets/images/flammarion-engraving.jpg",
  "./assets/images/icons/programming-for-wizards-icon-192.png",
  "./assets/images/icons/programming-for-wizards-icon-512.png",
  "./assets/images/icons/programming-for-wizards-icon-source.png",
  "./assets/images/interludes/interlude-01-useful-tricks.png",
  "./assets/images/interludes/interlude-02-meaning-escapes.png",
  "./assets/images/interludes/interlude-03-poor-protocol.png",
  "./assets/images/interludes/interlude-04-worse-spell.png",
  "./assets/images/interludes/interlude-05-knitted-castle.png",
  "./assets/images/interludes/interlude-06-final-rule.png",
  "./assets/images/knitted-castle.png",
  "./assets/images/programming-for-wizards-cover-sideways.png",
  "./assets/margin-notes-demo.css",
  "./assets/margin-notes-demo.js",
  "./assets/margin-notes-oauth-callback.html",
  "./assets/margin-notes/index.js",
  "./assets/margin-notes/index.js.map",
  "./chapters/01-this-is-not-a-programming-book.html",
  "./chapters/02-numbers-bigger-than-you-think.html",
  "./chapters/03-logic-the-truth-is-out-there.html",
  "./chapters/04-language-the-oldest-trick.html",
  "./chapters/05-the-web-one-string-to-rule-them-all.html",
  "./chapters/06-the-web-the-shape-of-words.html",
  "./chapters/07-the-web-waking-up-the-words.html",
  "./chapters/08-teaching-machines-our-words.html",
  "./chapters/09-separated-by-a-common-language.html",
  "./chapters/10-code-exhibit-growing-queries-inside-javascript.html",
  "./chapters/11-the-knitted-castle.html",
  "./chapters/12-boundaries-data-behavior-and-time.html",
  "./chapters/13-architecture-arches-and-change.html",
  "./chapters/14-the-web-as-commons-innovation-happens-elsewhere.html",
  "./chapters/15-the-web-as-data-things-should-have-addresses-too.html",
  "./chapters/16-the-web-as-home-who-owns-your-home-directory.html",
  "./chapters/17-epilogue-the-margin-you-have-been-using.html",
  "./chapters/18-acknowledgements.html",
  "./chapters/about-the-author.html",
  "./chapters/interlude-01-useful-tricks.html",
  "./chapters/interlude-02-meaning-escapes.html",
  "./chapters/interlude-03-poor-protocol.html",
  "./chapters/interlude-04-worse-spell.html",
  "./chapters/interlude-05-knitted-castle.html",
  "./chapters/interlude-06-final-rule.html",
  "./data/manifest.json",
  "./index.html",
  "./manifest.webmanifest",
  "./programming-for-wizards.epub"
]

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith("programming-for-wizards-") && key !== CACHE_NAME)
        .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", event => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then(response => response || caches.match("./index.html")))
    )
    return
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
        return response
      }))
  )
})
