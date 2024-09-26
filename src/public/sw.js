import {del, entries} from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm";

const filesToCache = [
    "/",
    "/manifest.json",
    "index.html",
    "offline.html"
]

const staticCacheName = "static-cache";

self.addEventListener('install', event => {
    console.log('Service worker installing…');
    event.waitUntil(
        caches.open(staticCacheName).then((cache) => {
            return cache.addAll(filesToCache)
        })
    )    
});

self.addEventListener('activate', event => {
    console.log('Service worker activating...');
    const cacheWhitelist = [staticCacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches
            .match(event.request)
            .then(() => {
                return fetch(event.request).then((response) => {
                    return caches.open(staticCacheName).then((cache) => {
                        cache.put(event.request.url, response.clone());
                        return response;
                    })
            })
    }).catch((error) => {
        console.log("Error", event.request.url, error);
        return caches.match("offline.html");
    }))
});

self.addEventListener('sync', function (event) {
    console.log('Background sync!', event);
    if (event.tag === 'sync-pictures') {
        event.waitUntil(
            syncPictures()
        );
    }
});

let syncPictures = async function () {
    entries()
        .then((entries) => {
            entries.forEach((entry) => {
                let picture = entry[1];
                let formData = new FormData();
                formData.append('id', picture.id);
                formData.append('ts', picture.ts);
                formData.append('title', picture.title);
                formData.append('image', picture.image, picture.id);
                fetch('/saveUpload', {
                        method: 'POST',
                        body: formData
                    })
                    .then(function (res) {
                        if (res.ok) {
                            res.json()
                                .then(function (data) {
                                    console.log("Deleting from idb:", data.id);
                                    del(data.id);
                                });
                        } else {
                            console.log(res);
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            })
        });
}