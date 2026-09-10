import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Kamera & mikrofon hanya untuk domain sendiri; sisanya dimatikan.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" }],
      },
    ]
  },
}

export default nextConfig
