import type { MetadataRoute } from "next"
import { BRAND } from "@/lib/brand"
import { PWA_SCREENSHOTS } from "@/lib/pwa"

// Web app manifest: bisa dipasang di Android, desktop, dan iOS (lewat Safari).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${BRAND} — photobooth online berdua`,
    short_name: BRAND,
    description: "Photobooth online untuk kamu dan dia. Buka link, hitung mundur bareng, jadi satu photostrip. Tanpa akun.",
    lang: "id",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#F4F3EF",
    theme_color: "#F4F3EF",
    categories: ["photo", "entertainment", "social", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    screenshots: PWA_SCREENSHOTS.map((s) => ({
      src: `/screenshots/${s.file}.webp`,
      sizes: s.form === "narrow" ? "780x1688" : "1280x800",
      type: "image/webp",
      form_factor: s.form,
      label: s.label,
    })),
    shortcuts: [
      {
        name: "Mulai foto bareng",
        short_name: "Mulai",
        description: "Langsung bikin room baru",
        url: "/mulai?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Gabung pakai kode",
        short_name: "Gabung",
        description: "Masukin kode 6 huruf dari dia",
        url: "/gabung?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  }
}
