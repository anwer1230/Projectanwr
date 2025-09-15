// Service Worker لنظام مراقبة التليجرام
const CACHE_NAME = 'telegram-monitor-v1';
const urlsToCache = [
    '/',
    '/static/js/app.js',
    '/static/manifest.json',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-512x512.png'
];

console.log('🛡️ تم تحميل Service Worker');

// تثبيت Service Worker
self.addEventListener('install', function(event) {
    console.log('⚙️ تثبيت Service Worker وتخزين الملفات');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', function(event) {
    console.log('✅ تم تفعيل Service Worker');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ حذف cache قديم:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// استمع للطلبات وتقديم cache عند الحاجة
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // إذا كان الملف محفوظ في cache، قدمه
                if (response) {
                    return response;
                }
                // وإلا قم بجلبه من الشبكة
                return fetch(event.request);
            }
        )
    );
});

console.log('📄 Service Worker جاهز للعمل');