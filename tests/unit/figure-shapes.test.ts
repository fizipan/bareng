import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { Figure } from "@/components/art/figure"
import { figureSvg, type StillPose, type Who } from "@/components/art/figure-shapes"

// Bentuk (path/circle/rect + atribut geometrinya, urut) dari sebuah SVG.
function shapes(svg: string) {
  const attrs = ["d", "cx", "cy", "r", "x", "y", "width", "height", "rx"]
  return [...svg.matchAll(/<(path|circle|rect)\b([^>]*)\/?>/g)]
    .filter(([, , a]) => !/width="60" height="60"/.test(a))
    .map(([, tag, a]) => {
      // cx/cy yang tidak ditulis = 0 (nilai bawaan SVG).
      const found = attrs.map((k) => a.match(new RegExp(`\\s${k}="([^"]*)"`))?.[1] ?? (tag === "circle" && (k === "cx" || k === "cy") ? "0" : ""))
      return `${tag}:${found.join("|")}`
    })
}

const POSES: StillPose[] = ["diam", "miring", "peace", "kaget", "hati", "lambai"]

describe("figure-shapes sama dengan <Figure>", () => {
  for (const who of ["kamu", "dia"] as Who[]) {
    for (const pose of POSES) {
      it(`${who} ${pose}`, () => {
        const react = renderToStaticMarkup(createElement(Figure, { who, pose }))
        expect(shapes(figureSvg(who, pose))).toEqual(shapes(react))
      })
    }
  }
})
