// Proxy tes untuk alur update PWA: meneruskan semua request ke server production
// lokal, tapi `GET /__bump` membuat /sw.js berikutnya berversi baru — meniru deploy.
// node tests/support/sw-bump-proxy.mjs  (UPSTREAM=http://localhost:3100, PORT=3200)
import http from "node:http"

const UPSTREAM = process.env.UPSTREAM ?? "http://localhost:3100"
const PORT = Number(process.env.PORT ?? 3200)
let bump = 0

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => resolve(Buffer.concat(chunks)))
  })

http
  .createServer(async (req, res) => {
    if (req.url === "/__bump") {
      bump += 1
      res.end(String(bump))
      return
    }
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req)
    const upstream = await fetch(UPSTREAM + req.url, {
      method: req.method,
      headers: { ...req.headers, host: new URL(UPSTREAM).host },
      body,
      redirect: "manual",
    })
    const headers = Object.fromEntries(upstream.headers)
    for (const h of ["content-encoding", "content-length", "transfer-encoding"]) delete headers[h]
    let buf = Buffer.from(await upstream.arrayBuffer())
    if (req.url.startsWith("/sw.js") && bump > 0) {
      buf = Buffer.from(buf.toString().replace(/const VERSION = "([^"]+)"/, `const VERSION = "$1-v${bump}"`))
    }
    res.writeHead(upstream.status, headers)
    res.end(buf)
  })
  .listen(PORT, () => console.log(`sw-bump-proxy :${PORT} → ${UPSTREAM}`))
