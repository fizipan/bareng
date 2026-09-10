import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/brand"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/gabung`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privasi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/ketentuan`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]
}
