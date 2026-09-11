// Geometri tokoh "kamu" & "dia" tanpa animasi, untuk gambar statis: OG situs
// (SVG, app/opengraph-image.tsx) dan kartu pratinjau hasil (Canvas,
// lib/templates/share-card.ts). Harus sama dengan <Figure> di figure.tsx —
// dijaga tests/unit/figure-shapes.test.ts.

export type Who = "kamu" | "dia"
export type StillPose = "diam" | "miring" | "peace" | "kaget" | "hati" | "lambai"

export const FIGURE_COLOR: Record<Who, string> = { kamu: "#E4462E", dia: "#FFD23F" }
const INK = "#16141D"
const HEART = "#FF7A64"
const HAIR = "#241F2E"

type Op = ["translate", number, number] | ["scale", number, number] | ["rotate", number, number, number]
type Node =
  | { t: "g"; ops?: Op[]; children: Node[] }
  | { t: "path"; d: string; fill: string; ops?: Op[]; stroke?: string; strokeWidth?: number }
  | { t: "circle"; cx: number; cy: number; r: number; fill: string }
  | { t: "rect"; x: number; y: number; w: number; h: number; rx: number; fill: string; ops?: Op[] }

export function figureTree(who: Who, pose: StillPose): Node {
  const color = FIGURE_COLOR[who]
  const lean = pose === "hati" ? 5 : 0
  const tilt = pose === "miring" ? 14 : pose === "hati" ? 8 : 0
  const tiltOp: Op = ["rotate", tilt, 30, 37]
  const eyeR = pose === "kaget" ? 2 : 1.7

  const head: Node[] = [
    { t: "circle", cx: 30, cy: 25, r: 10.5, fill: color },
    ...(who === "kamu"
      ? ([
          {
            t: "path",
            d: "M19.3 25 C18.6 17.5 23.6 13.2 30.5 13.4 C36.8 13.6 41.3 17.8 40.7 24.2 C38.9 21.4 36.6 19.9 33.6 19.6 C30.2 19.3 27.6 20.9 25.4 21.4 C23.2 21.9 21 23.2 19.3 25 Z",
            fill: HAIR,
          },
          { t: "path", d: "M24.5 15.2 C25.8 11.8 29.6 10.6 32.4 12.4 C29.8 12.6 28 13.6 26.9 15.4 Z", fill: HAIR },
        ] satisfies Node[])
      : ([
          {
            t: "path",
            d: "M19.6 24.2 C19.4 17.6 24 14 30 14 C36 14 40.6 17.6 40.4 24.2 C38.2 20.4 35.4 18.8 31.8 19.6 C29.4 20.1 27.8 21.8 25 22 C22.8 22.2 21 23 19.6 24.2 Z",
            fill: HAIR,
          },
          {
            t: "g",
            ops: [
              ["translate", 37.6, 15],
              ["rotate", 18, 0, 0],
            ],
            children: [
              { t: "path", d: "M0 0 L-4.2 -2.8 Q-5 0 -4.2 2.8 Z M0 0 L4.2 -2.8 Q5 0 4.2 2.8 Z", fill: HEART },
              { t: "circle", cx: 0, cy: 0, r: 1.4, fill: HEART },
            ],
          },
        ] satisfies Node[])),
    { t: "circle", cx: 26.3, cy: 24, r: eyeR, fill: INK },
    { t: "circle", cx: 33.7, cy: 24, r: eyeR, fill: INK },
    pose === "kaget"
      ? { t: "circle", cx: 30, cy: 30.2, r: 2.1, fill: INK }
      : { t: "path", d: "M26.8 28.8 q3.2 2.8 6.4 0", fill: "none", stroke: INK, strokeWidth: 1.5 },
  ]

  const body: Node[] = [
    ...(who === "dia"
      ? ([
          {
            t: "path",
            d: "M17.8 27 C17.2 18 22.6 12.8 30 12.8 C37.4 12.8 42.8 18 42.2 27 L42.8 41.5 C42.9 43.3 41.6 44.6 39.8 44.6 L20.2 44.6 C18.4 44.6 17.1 43.3 17.2 41.5 Z",
            fill: HAIR,
            ops: [tiltOp],
          },
        ] satisfies Node[])
      : []),
    { t: "path", d: "M13 60 V49 a12 12 0 0 1 12 -12 h10 a12 12 0 0 1 12 12 V60 Z", fill: color },
    ...(pose === "lambai"
      ? ([
          { t: "rect", x: 6.5, y: 24, w: 6.5, h: 21, rx: 3.25, fill: color },
          { t: "circle", cx: 9.75, cy: 23, r: 4, fill: color },
        ] satisfies Node[])
      : []),
    ...(pose === "peace"
      ? ([
          { t: "rect", x: 6, y: 27, w: 6.5, h: 19, rx: 3.25, fill: color },
          { t: "rect", x: 5, y: 17, w: 2.8, h: 11, rx: 1.4, fill: color, ops: [["rotate", -14, 6.4, 28]] },
          { t: "rect", x: 9.4, y: 17, w: 2.8, h: 11, rx: 1.4, fill: color, ops: [["rotate", 12, 10.8, 28]] },
        ] satisfies Node[])
      : []),
    { t: "g", ops: [tiltOp], children: head },
    ...(pose === "kaget"
      ? ([
          { t: "circle", cx: 15.5, cy: 27, r: 3.3, fill: color },
          { t: "circle", cx: 44.5, cy: 27, r: 3.3, fill: color },
        ] satisfies Node[])
      : []),
  ]

  return {
    t: "g",
    ops: who === "dia" ? [["translate", 60, 0], ["scale", -1, 1]] : [],
    children: [
      ...(pose === "hati"
        ? ([{ t: "path", d: "M60 25 C57 18.5 46.5 19 46.5 27 C46.5 33 53.5 37.5 60 43.5 Z", fill: HEART }] satisfies Node[])
        : []),
      { t: "g", ops: [["translate", lean, 0]], children: body },
    ],
  }
}

// ── SVG ─────────────────────────────────────────────────────────────────────
const svgOps = (ops?: Op[]) =>
  ops?.length
    ? ` transform="${ops
        .map((o) => (o[0] === "rotate" ? `rotate(${o[1]} ${o[2]} ${o[3]})` : `${o[0]}(${o[1]} ${o[2]})`))
        .join(" ")}"`
    : ""

function nodeSvg(n: Node): string {
  switch (n.t) {
    case "g":
      return `<g${svgOps(n.ops)}>${n.children.map(nodeSvg).join("")}</g>`
    case "path":
      return n.stroke
        ? `<path d="${n.d}" fill="none" stroke="${n.stroke}" stroke-width="${n.strokeWidth}" stroke-linecap="round"${svgOps(n.ops)}/>`
        : `<path d="${n.d}" fill="${n.fill}"${svgOps(n.ops)}/>`
    case "circle":
      return `<circle cx="${n.cx}" cy="${n.cy}" r="${n.r}" fill="${n.fill}"/>`
    case "rect":
      return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.rx}" fill="${n.fill}"${svgOps(n.ops)}/>`
  }
}

// SVG 60×60 lengkap (latar opsional, misalnya warna setengah foto strip).
export function figureSvg(who: Who, pose: StillPose, background?: string) {
  const bg = background ? `<rect width="60" height="60" fill="${background}"/>` : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">${bg}${nodeSvg(figureTree(who, pose))}</svg>`
}

// ── Canvas ──────────────────────────────────────────────────────────────────
function applyOps(ctx: CanvasRenderingContext2D, ops?: Op[]) {
  for (const o of ops ?? []) {
    if (o[0] === "translate") ctx.translate(o[1], o[2])
    else if (o[0] === "scale") ctx.scale(o[1], o[2])
    else {
      ctx.translate(o[2], o[3])
      ctx.rotate((o[1] * Math.PI) / 180)
      ctx.translate(-o[2], -o[3])
    }
  }
}

function drawNode(ctx: CanvasRenderingContext2D, n: Node) {
  ctx.save()
  if (n.t === "g") {
    applyOps(ctx, n.ops)
    n.children.forEach((c) => drawNode(ctx, c))
  } else if (n.t === "path") {
    applyOps(ctx, n.ops)
    const p = new Path2D(n.d)
    if (n.stroke) {
      ctx.strokeStyle = n.stroke
      ctx.lineWidth = n.strokeWidth ?? 1
      ctx.lineCap = "round"
      ctx.stroke(p)
    } else {
      ctx.fillStyle = n.fill
      ctx.fill(p)
    }
  } else if (n.t === "circle") {
    ctx.fillStyle = n.fill
    ctx.beginPath()
    ctx.arc(n.cx, n.cy, n.r, 0, Math.PI * 2)
    ctx.fill()
  } else {
    applyOps(ctx, n.ops)
    ctx.fillStyle = n.fill
    const { x, y, w, h, rx } = n
    ctx.beginPath()
    ctx.moveTo(x + rx, y)
    ctx.arcTo(x + w, y, x + w, y + h, rx)
    ctx.arcTo(x + w, y + h, x, y + h, rx)
    ctx.arcTo(x, y + h, x, y, rx)
    ctx.arcTo(x, y, x + w, y, rx)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

// Gambar tokoh di kotak (x, y, size×size), dalam satuan kanvas.
export function drawFigure(ctx: CanvasRenderingContext2D, who: Who, pose: StillPose, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 60, size / 60)
  drawNode(ctx, figureTree(who, pose))
  ctx.restore()
}
