const CACHE_NAME = 'vigitel-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add other critical assets here
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/config\//,
  /^\/api\/clients$/,
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = [
  /^\/api\/inspections/,
  /^\/api\/tiles/,
  /^\/api\/non-conformities/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this endpoint should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
                     RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));

  if (!shouldCache) {
    // Just pass through for non-cached endpoints
    return fetch(request);
  }

  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return error response for failed POST/PUT/DELETE
    return new Response(
      JSON.stringify({ 
        message: 'Offline - dados serão sincronizados quando a conexão for restaurada',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Background sync triggered');
  
  try {
    // Get pending sync data from IndexedDB
    const pendingData = await getPendingSyncData();
    
    for (const item of pendingData) {
      try {
        await syncItem(item);
      } catch (error) {
        console.error('Failed to sync item:', error);
      }
    }
    
    // Clear synced data
    await clearSyncedData();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingSyncData() {
  // In production, this would read from IndexedDB
  return [];
}

async function syncItem(item) {
  // In production, this would sync the item to the server
  console.log('Syncing item:', item);
}

async function clearSyncedData() {
  // In production, this would clear synced data from IndexedDB
  console.log('Clearing synced data');
}

// Message handling for manual sync triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'FORCE_SYNC') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notification handling (for future implementation)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação VIGITEL',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('VIGITEL', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});
