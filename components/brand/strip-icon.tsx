import type { SVGProps } from "react"

// Ikon strip 3 frame (prototipe: dipakai di "Jadikan photostrip", "Bikin punyamu").
export function StripIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden {...props}>
      <rect x="3.8" y="1.8" width="10.4" height="14.4" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6" y="4" width="6" height="2.6" fill="currentColor" />
      <rect x="6" y="7.7" width="6" height="2.6" fill="currentColor" opacity=".45" />
      <rect x="6" y="11.4" width="6" height="2.6" fill="currentColor" />
    </svg>
  )
}
