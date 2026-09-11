// Service worker Bareng, disajikan dari route supaya versinya ikut berganti tiap
// deploy. Browser membandingkan isi sw.js; versi baru → dipasang, lalu
// menunggu sampai user menekan "Muat ulang" di toast (lihat pwa-provider).
export const dynamic = "force-static"

const VERSION =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? `local-${Date.now()}`

// Halaman cadangan saat offline: berdiri sendiri (tanpa aset Next), jadi
// selalu tampil walau CSS/JS aplikasi belum sempat tersimpan.
const OFFLINE_HTML = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#F4F3EF">
<title>Offline · Bareng</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;
background:#F4F3EF;color:#16141D;font-family:Inter,system-ui,-apple-system,sans-serif;padding:24px}
main{width:100%;max-width:360px;display:flex;flex-direction:column;gap:18px}
h1{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.01em}p{margin:0;font-size:16px;line-height:1.5;color:#3B3944}
button{height:48px;border:0;border-radius:14px;background:#E4462E;color:#F4F3EF;font:600 16px Inter,system-ui,sans-serif;cursor:pointer}
small{font-size:13px;color:#5F5D69}
.art{width:100%;max-width:240px;align-self:center}.d{animation:s 1.6s ease-in-out infinite}
@keyframes s{0%,100%{opacity:.2}40%{opacity:1}}.b{transform-box:fill-box;transform-origin:center;animation:k 4.8s infinite}
@keyframes k{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}
@media (prefers-reduced-motion:reduce){.d,.b{animation:none}}</style></head><body><main>
<svg width="44" height="44" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#E4462E"/>
<rect x="10" y="5" width="14" height="24" rx="2" fill="#F4F3EF"/><rect x="12.5" y="7.5" width="9" height="5" rx="1" fill="#16141D"/>
<rect x="12.5" y="14.5" width="9" height="5" rx="1" fill="#FFD23F"/><rect x="12.5" y="21.5" width="9" height="5" rx="1" fill="#16141D"/></svg>
<svg class="art" viewBox="0 0 200 72" aria-hidden="true">
<g transform="translate(4 6) scale(1.1)">
<path d="M13 60 V49 a12 12 0 0 1 12 -12 h10 a12 12 0 0 1 12 12 V60 Z" fill="#E4462E"/><circle cx="30" cy="25" r="10.5" fill="#E4462E"/>
<path d="M19.3 25 C18.6 17.5 23.6 13.2 30.5 13.4 C36.8 13.6 41.3 17.8 40.7 24.2 C38.9 21.4 36.6 19.9 33.6 19.6 C30.2 19.3 27.6 20.9 25.4 21.4 C23.2 21.9 21 23.2 19.3 25 Z" fill="#241F2E"/>
<g class="b"><circle cx="26.3" cy="24" r="2" fill="#16141D"/><circle cx="33.7" cy="24" r="2" fill="#16141D"/></g><circle cx="30" cy="30.2" r="2.1" fill="#16141D"/></g>
<g transform="translate(196 6) scale(-1.1 1.1)">
<path d="M17.8 27 C17.2 18 22.6 12.8 30 12.8 C37.4 12.8 42.8 18 42.2 27 L42.8 41.5 C42.9 43.3 41.6 44.6 39.8 44.6 L20.2 44.6 C18.4 44.6 17.1 43.3 17.2 41.5 Z" fill="#241F2E"/>
<path d="M13 60 V49 a12 12 0 0 1 12 -12 h10 a12 12 0 0 1 12 12 V60 Z" fill="#FFD23F"/><circle cx="30" cy="25" r="10.5" fill="#FFD23F"/>
<path d="M19.6 24.2 C19.4 17.6 24 14 30 14 C36 14 40.6 17.6 40.4 24.2 C38.2 20.4 35.4 18.8 31.8 19.6 C29.4 20.1 27.8 21.8 25 22 C22.8 22.2 21 23 19.6 24.2 Z" fill="#241F2E"/>
<g transform="translate(37.6 15) rotate(18)" fill="#FF7A64"><path d="M0 0 L-4.2 -2.8 Q-5 0 -4.2 2.8 Z M0 0 L4.2 -2.8 Q5 0 4.2 2.8 Z"/><circle r="1.4"/></g>
<g class="b" style="animation-delay:.5s"><circle cx="26.3" cy="24" r="2" fill="#16141D"/><circle cx="33.7" cy="24" r="2" fill="#16141D"/></g><circle cx="30" cy="30.2" r="2.1" fill="#16141D"/></g>
<g><circle class="d" cx="84" cy="40" r="3" fill="#8A8894"/><circle class="d" cx="93" cy="40" r="3" fill="#8A8894" style="animation-delay:.16s"/>
<circle class="d" cx="102" cy="40" r="3.4" fill="#E4462E" style="animation-delay:.32s"/><circle class="d" cx="111" cy="40" r="3" fill="#8A8894" style="animation-delay:.48s"/>
<circle class="d" cx="120" cy="40" r="3" fill="#8A8894" style="animation-delay:.64s"/></g></svg>
<h1>Kamu lagi offline</h1>
<p>Foto bareng butuh internet buat nyambung ke dia. Sambungkan lagi, lalu coba muat ulang.</p>
<button onclick="location.reload()">Coba lagi</button>
<small>Foto yang sudah diambil di sesi tadi tetap aman.</small>
</main></body></html>`

const SW = `
const VERSION = ${JSON.stringify(VERSION)};
const STATIC_CACHE = "bareng-static-" + VERSION;
const PAGE_CACHE = "bareng-pages-" + VERSION;
// Halaman publik yang boleh dibuka dari cache saat offline.
const CACHEABLE_PAGES = new Set(["/", "/gabung", "/privasi", "/ketentuan"]);
const PRECACHE = ["/", "/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];
const OFFLINE_HTML = ${JSON.stringify(OFFLINE_HTML)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => undefined)
  );
  // Sengaja tidak skipWaiting: versi baru menunggu persetujuan user.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith("bareng-") && !k.endsWith(VERSION)).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "GET_VERSION" && event.ports[0]) event.ports[0].postMessage(VERSION);
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Supabase, TURN, Google, dsb. tidak disentuh.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
  // Payload RSC (navigasi client Next) selalu dari jaringan, supaya data tidak basi.
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/") || /\\.(?:png|svg|ico|webp|jpg|jpeg|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (req.mode === "navigate") event.respondWith(navigate(req, url));
});

// Aset Next ber-hash (tidak pernah berubah isinya): ambil dari cache dulu.
async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === "basic") cache.put(req, res.clone());
  return res;
}

// Halaman: jaringan dulu (sesi selalu butuh data terbaru), cache/offline kalau gagal.
async function navigate(req, url) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok && CACHEABLE_PAGES.has(url.pathname)) cache.put(url.pathname, res.clone());
    return res;
  } catch (err) {
    const cached = CACHEABLE_PAGES.has(url.pathname) ? await cache.match(url.pathname) : undefined;
    return cached || new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
`

export function GET() {
  return new Response(SW, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  })
}
