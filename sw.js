const CACHE_VERSION = 'v3.1';
const CACHE_STATIC_NAME = 'news-app-static-' + CACHE_VERSION;
const CACHE_DYNAMIC_NAME = 'news-app-dynamic-' + CACHE_VERSION;
const CACHE_REQUEST_LIMIT = 20;
const NEWS_SOURCES_BASE_URL = "https://newsapi.org/v2/source";
const NEWS_TOP_HEADLINES_URL = "https://newsapi.org/v2/top-headlines";

const STATIC_URLS = [
    '/',
    './404.html',
    '/index.html',
    '/scripts/app.js',
    '/styles/styles.css',
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
    'manifest.json',
    './fallback/fallback.json',
    './images/error/cartoon.jpg'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function (cache) {
                return cache.addAll(STATIC_URLS);
            })
    )
})

function isOlderCache(cacheName) {
    return cacheName !== CACHE_STATIC_NAME && cacheName !== CACHE_DYNAMIC_NAME
}

function deleteCache(cacheName) {
    return caches.delete(cacheName);
}

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(cacheNames.filter(isOlderCache).map(deleteCache));
            })
    );
})

async function cacheFirst(request) {
    try {
        const cacheResponse = await caches.match(request);
        if (cacheResponse) {
            return cacheResponse;
        }
        console.log("requesting");
        const networkResponse = await fetch(request);
        console.log("requested");
        const cache = await caches.open(CACHE_STATIC_NAME);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (e) {
        return caches.match('./404.html ');
    }
}

async function removeOlderRequestIfLimit(cache) {
    const requests = await cache.keys();
    const newsRequest = requests.filter(it => {
        return STATIC_URLS.indexOf(it.url) === -1 && !it.url.includes(NEWS_SOURCES_BASE_URL);
    })
    if (newsRequest.length > CACHE_REQUEST_LIMIT) {
        const olderRequest = newsRequest.slice(0, newsRequest.length - CACHE_REQUEST_LIMIT);
        await Promise.all(
            olderRequest.map(it => {
                return cache.delete(it)
            })
        )
    }
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_DYNAMIC_NAME);
    try {
        const networkResponse = await fetch(request);
        if (request.destination !== 'image') {
            await cache.put(request, networkResponse.clone());
            await removeOlderRequestIfLimit(cache);
        }
        return networkResponse;
    } catch (e) {
    }
    const cacheResponse = await cache.match(request);
    if (cacheResponse) {
        return cacheResponse;
    }
    if(request.url.includes(NEWS_TOP_HEADLINES_URL)){
        console.log("matched fallback", request.url);
        const staticCache = await caches.open(CACHE_STATIC_NAME);
        return staticCache.match("./fallback/fallback.json");
    }
    return fetch(request);
}

self.addEventListener('fetch', function (event) {
    const request = event.request;
    const requestUrl = new URL(request.url);
    if (requestUrl.origin === location.origin) {
        console.warn("cacheFirst", request.url);
        event.respondWith(cacheFirst(request));
    } else {
        console.warn("networkFirst", request.url);
        event.respondWith(networkFirst(request));
    }
})