import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, getCacheKeyForURL } from 'workbox-precaching';
import { registerRoute, setDefaultHandler, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// --- Basic Workbox Setup ---
// This ensures the new service worker takes control immediately.
clientsClaim();
// self.skipWaiting() should be called by Workbox internally when precaching new assets,
// but can be called explicitly if needed. Workbox's precaching handles this.
// If using injectManifest, skipWaiting is often configured there.
// For a self-written SW like this, we might need it if not using a build tool to manage SW lifecycle.
self.skipWaiting();

// --- Precaching Static Assets ---
// self.__WB_MANIFEST is a placeholder that Workbox build tools (like workbox-cli or vite-plugin-pwa)
// will replace with a list of URLs to precache.
// The `|| []` fallback is for development where the manifest might not be injected.
cleanupOutdatedCaches(); // Clean up old Workbox caches
const manifest = self.__WB_MANIFEST || [];
precacheAndRoute(manifest);

// --- Runtime Caching Strategies ---

// 1. APIs (/api/)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, // Increased from 50 for more flexibility
        maxAgeSeconds: 24 * 60 * 60, // Cache API responses for 1 day (was 6 hours)
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache opaque responses and successful responses
      }),
    ],
  })
);

// 2. Images (png, gif, jpg, jpeg, svg, webp)
registerRoute(
  ({ request }) => request.destination === 'image',
  // /\.(?:png|gif|jpg|jpeg|svg|webp)$/i, // More specific regex if needed
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200, // Increased from 100
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// 3. Google Fonts (stylesheets and webfonts)
// Cache the Google Fonts stylesheets with a StaleWhileRevalidate strategy.
registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the Google Fonts webfont files with a CacheFirst strategy for 1 year.
registerRoute(
  ({url}) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
        maxEntries: 30,
      }),
    ],
  })
);

// 4. Offline Fallback Page
// Precaching the offline page is the most reliable way.
// Ensure '/offline.html' is part of your `self.__WB_MANIFEST` or add it explicitly:
// precacheAndRoute(manifest.concat([{ url: '/offline.html', revision: null }]));

// If a navigation request fails (e.g., user is offline), serve the precached offline page.
// This catch handler will respond to failed navigation requests.
const offlineFallbackPage = '/offline.html'; // Ensure this is precached

// Register a navigation route that uses NetworkOnly by default.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkOnly({
    plugins: [
      // Optional: Broadcast update when a navigation request is successfully fetched from network.
      // new BroadcastUpdatePlugin(),
    ],
  })
);

// Catch handler for all failed requests, especially navigations.
setCatchHandler(async ({ event }) => {
  // Return the precached offline page for navigation errors
  if (event.request.mode === 'navigate') {
    const precachedOfflineUrl = getCacheKeyForURL(offlineFallbackPage);
    if (precachedOfflineUrl) {
        const cache = await self.caches.open(workbox.core.cacheNames.precache);
        return await cache.match(precachedOfflineUrl) || Response.error();
    }
  }
  // For other types of failed requests, just return an error response
  return Response.error();
});


// --- Optional: Default handler for non-cached assets (if not covered by precache) ---
// This ensures that requests not matching any route will still go to the network.
// setDefaultHandler(new NetworkOnly());


// --- Logging ---
console.log('Vigitel Service Worker with Workbox installed and configured.');

// --- Existing Features to re-evaluate or remove ---
// The old manual install, activate, and fetch handlers are removed as Workbox handles these.

// Background sync and Push notifications were in the old SW.
// They are not directly part of Workbox caching strategies but can be used alongside Workbox.
// For now, commenting them out to focus on caching. They can be re-added and potentially use Workbox utilities.

/*
// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    // event.waitUntil(doBackgroundSync()); // Define doBackgroundSync
  }
});

// Message handling for manual sync triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING_MESSAGE') { // Renamed to avoid conflict if Workbox uses SKIP_WAITING
    // self.skipWaiting(); // This is handled by Workbox or called above
  }
  if (event.data && event.data.type === 'FORCE_SYNC') {
    // event.waitUntil(doBackgroundSync());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  // ... push logic ...
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  // ... notification click logic ...
});
*/

// Ensure this service worker activates quickly
// self.addEventListener('message', (event) => {
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting(); // Already called above if needed
//   }
// });
// This is a common pattern, but workbox-window can also handle this from the client side.
// With clientsClaim() and skipWaiting() at the top, this specific message listener for SKIP_WAITING might be redundant.
// Workbox's build process often injects skipWaiting and clientsClaim calls.
// Since we are writing it manually, explicit calls are good.
// If using vite-plugin-pwa, these are typically configured in the plugin options.
// Workbox also has its own message handling for skipWaiting if using workbox-window.
