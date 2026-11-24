
const CACHE_NAME = "galaxy-protectors-v2";

const FILES = [
    "./",
    "./index.html",
    "./Style.css",
    "./Game.js",
    "./Background.jpg",
    "./Hero.png",
    "./Enemy1.jpg",
    "./Boss.jpg",
    "./Hero%20Bullet.png",
    "./Enemy%20bullet.png",
    "./normal-music.mp3",
    "./boss-music.mp3"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll(FILES)
        )
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request);
        })
    );
});
