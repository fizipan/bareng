import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/brand"

// Room & hasil berbasis link-sebagai-kunci: jangan diindeks mesin pencari.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/r/", "/p/", "/mulai", "/dev", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
