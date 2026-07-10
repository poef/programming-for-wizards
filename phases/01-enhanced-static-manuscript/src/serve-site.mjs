import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)))
const siteDir = path.join(rootDir, "www")
const port = Number(process.env.PORT ?? 4173)
const host = process.env.HOST ?? "127.0.0.1"

const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".epub", "application/epub+zip"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"]
])

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`)
  const requested = decodeURIComponent(url.pathname)
  const target = path.normalize(path.join(siteDir, requested === "/" ? "index.html" : requested))

  if (!target.startsWith(siteDir)) {
    response.writeHead(403)
    response.end("Forbidden")
    return
  }

  try {
    const info = await stat(target)
    const file = info.isDirectory() ? path.join(target, "index.html") : target
    response.setHeader("content-type", types.get(path.extname(file)) ?? "application/octet-stream")
    createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404)
    response.end("Not found")
  }
})

server.on("error", error => {
  console.error(`Could not start server at http://${host}:${port}`)
  console.error(error.message)
  process.exitCode = 1
})

server.listen(port, host, () => {
  console.log(`Serving ${path.relative(rootDir, siteDir)} at http://${host}:${port}`)
})
