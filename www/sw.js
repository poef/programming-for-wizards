const CACHE_NAME = "programming-for-wizards-de4f55a780"
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
  "./chapters/01-this-is-not-a-programming-book.html",
  "./chapters/02-numbers-hiding-calculations-in-symbols.html",
  "./chapters/03-logic-turning-truth-into-machinery.html",
  "./chapters/04-language-the-tool-that-changes-the-thinker.html",
  "./chapters/05-the-web-as-address.html",
  "./chapters/06-the-web-as-document.html",
  "./chapters/07-the-web-as-platform.html",
  "./chapters/08-programming-languages-are-for-humans.html",
  "./chapters/09-every-program-contains-a-language.html",
  "./chapters/10-code-exhibit-extending-javascript-with-jaqt.html",
  "./chapters/11-the-knitted-castle.html",
  "./chapters/12-objects-binding-data-behavior-and-time.html",
  "./chapters/13-architecture-arches-pyramids-and-change.html",
  "./chapters/14-the-web-as-commons.html",
  "./chapters/15-the-web-as-data.html",
  "./chapters/16-the-web-as-home.html",
  "./chapters/17-rule-zero-there-are-no-rules.html",
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
