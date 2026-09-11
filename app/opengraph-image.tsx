import { ImageResponse } from "next/og"
import { figureSvg, type StillPose } from "@/components/art/figure-shapes"
import { BRAND } from "@/lib/brand"

// Gambar pratinjau link (WhatsApp, Twitter/X, dsb.). Dibuat saat build.
export const alt = `${BRAND} — foto bareng, walau jauh`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const HEADLINE = "Foto bareng, walau jauh."
const SUB = "Photobooth online untuk kamu dan dia. Gratis, tanpa akun."
// Latar & pose tiap frame, sama dengan strip contoh di landing (FigureFill).
const LOOKS = [
  ["#40384A", "#372F41"],
  ["#463C33", "#3D342C"],
  ["#33443F", "#2C3B37"],
  ["#4A3A3E", "#413135"],
]
const POSES: StillPose[] = ["diam", "miring", "peace", "hati"]

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`

// Ambil subset font dari Google Fonts (TTF). Gagal → pakai font bawaan.
async function googleFont(family: string, weight: number, text: string) {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(url)).text()
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    return src ? await (await fetch(src)).arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function OpenGraphImage() {
  const [display, body] = await Promise.all([
    googleFont("Bricolage+Grotesque", 800, `${HEADLINE}${BRAND}${BRAND.toLowerCase()}.14.0227`),
    googleFont("Inter", 500, `${SUB}Satu link, dua orang, 90 detik.`),
  ])
  const fonts = [
    display && { name: "Bricolage", data: display, weight: 800 as const, style: "normal" as const },
    body && { name: "Inter", data: body, weight: 500 as const, style: "normal" as const },
  ].filter((f) => !!f)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: "0 80px",
          background: "#F4F3EF",
          backgroundImage: "radial-gradient(#DCD9D1 2px, transparent 2px)",
          backgroundSize: "22px 22px",
          fontFamily: "Inter",
          color: "#16141D",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 19,
                background: "#E4462E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 45,
                  borderRadius: 4,
                  background: "#F4F3EF",
                  padding: 5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ flex: 1, borderRadius: 2, background: "#16141D" }} />
                <div style={{ flex: 1, borderRadius: 2, background: "#FFD23F" }} />
                <div style={{ flex: 1, borderRadius: 2, background: "#16141D" }} />
              </div>
            </div>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 42, fontWeight: 800 }}>
              {BRAND}
              <span style={{ color: "#E4462E" }}>.</span>
            </div>
          </div>
          <div style={{ fontFamily: "Bricolage", fontSize: 78, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1 }}>
            {HEADLINE}
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: "#3B3944" }}>{SUB}</div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: 12,
              padding: "12px 22px",
              borderRadius: 999,
              background: "#E9E7E1",
              fontSize: 24,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#E4462E" }} />
            Satu link, dua orang, 90 detik.
          </div>
        </div>

        {/* Kamu & dia mengintip dari balik strip, sambil melambai. */}
        <img
          alt=""
          src={svgUri(figureSvg("kamu", "lambai"))}
          width={190}
          height={190}
          style={{ position: "absolute", left: 668, bottom: -6 }}
        />
        <img
          alt=""
          src={svgUri(figureSvg("dia", "peace"))}
          width={190}
          height={190}
          style={{ position: "absolute", left: 1000, bottom: -6 }}
        />
        <div
          style={{
            position: "absolute",
            left: 790,
            top: 44,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: 250,
            padding: "16px 22px 58px",
            background: "#FFFFFF",
            borderRadius: 3,
            transform: "rotate(4deg)",
            boxShadow: "0 24px 48px rgba(22,20,29,0.18)",
          }}
        >
          {LOOKS.map(([a, b], i) => (
            <div key={i} style={{ display: "flex", gap: 3, height: 101 }}>
              <img alt="" src={svgUri(figureSvg("kamu", POSES[i], a))} width={101} height={101} />
              <img alt="" src={svgUri(figureSvg("dia", POSES[i], b))} width={101} height={101} />
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: 22,
              bottom: 16,
              display: "flex",
              flexDirection: "column",
              fontFamily: "Bricolage",
              fontWeight: 800,
            }}
          >
            <span style={{ fontSize: 22 }}>14.02.27</span>
            <span style={{ fontSize: 14 }}>
              {BRAND.toLowerCase()}
              <span style={{ color: "#E4462E" }}>.</span>
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
