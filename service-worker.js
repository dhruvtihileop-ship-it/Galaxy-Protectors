
const CACHE_NAME = "space-shooter-level-1-v1";

const FILES = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/game.js",
    "./assets/Background.jpg",
    "./assets/Hero.png",
    "./assets/Enemy1.jpg",
    "./assets/Boss.jpg",
    "./assets/Hero%20Bullet.png",
    "./assets/Enemy%20bullet.png",
    "./assets/normal-music.mp3",
    "./assets/boss-music.mp3"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES);
        })
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
            if (cached) return cached;

            return fetch(event.request).then(response => {
                if (response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, copy);
                    });
                }

                return response;
            });
        })
    );
});
