import { createReadStream, watch } from "node:fs"
import { readdir, stat } from "node:fs/promises"
import { createServer } from "node:http"
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)))
const phaseDir = path.join(rootDir, "phases", "01-enhanced-static-manuscript")
const siteDir = path.join(rootDir, "site")
const buildScript = path.join(phaseDir, "src", "build-site.mjs")
const port = Number(process.env.PORT ?? 4173)
const host = process.env.HOST ?? "127.0.0.1"

const watchedRoots = [
  path.join(rootDir, "content"),
  path.join(phaseDir, "assets"),
  path.join(phaseDir, "src")
]

const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"]
])

const watchers = new Map()
let buildRunning = false
let buildQueued = false
let debounceTimer = null

async function main() {
  await runBuild("initial build")
  await refreshWatchers()
  startServer()

  process.on("SIGINT", () => {
    closeWatchers()
    process.exit(0)
  })
}

function startServer() {
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
    console.error(`[dev] Could not start server at http://${host}:${port}`)
    console.error(`[dev] ${error.message}`)
    process.exitCode = 1
  })

  server.listen(port, host, () => {
    console.log(`[dev] Serving ${path.relative(rootDir, siteDir)} at http://${host}:${port}`)
  })
}

function scheduleBuild(reason) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    runBuild(reason).catch(error => {
      console.error(error)
      process.exitCode = 1
    })
  }, 120)
}

async function runBuild(reason) {
  if (buildRunning) {
    buildQueued = true
    return
  }

  buildRunning = true
  const startedAt = Date.now()

  try {
    await spawnBuild()
    await refreshWatchers()
    console.log(`[dev] ${reason} finished in ${Date.now() - startedAt}ms`)
  } catch (error) {
    console.error(`[dev] ${reason} failed`)
    console.error(error)
  } finally {
    buildRunning = false
    if (buildQueued) {
      buildQueued = false
      await runBuild("queued rebuild")
    }
  }
}

function spawnBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [buildScript], {
      cwd: rootDir,
      stdio: "inherit"
    })

    child.on("error", reject)
    child.on("exit", code => {
      if (code === 0) resolve()
      else reject(new Error(`Build exited with status ${code}`))
    })
  })
}

async function refreshWatchers() {
  const directories = new Set()

  for (const root of watchedRoots) {
    await collectDirectories(root, directories)
  }

  for (const directory of directories) {
    if (watchers.has(directory)) continue

    const watcher = watch(directory, { persistent: true }, (_event, filename) => {
      const changed = filename ? path.join(directory, filename.toString()) : directory
      scheduleBuild(path.relative(rootDir, changed) || "source change")
    })

    watcher.on("error", error => {
      console.error(`[dev] watcher error in ${path.relative(rootDir, directory)}`)
      console.error(error)
    })

    watchers.set(directory, watcher)
  }

  for (const [directory, watcher] of watchers) {
    if (directories.has(directory)) continue
    watcher.close()
    watchers.delete(directory)
  }
}

async function collectDirectories(directory, directories) {
  let info
  try {
    info = await stat(directory)
  } catch {
    return
  }

  if (!info.isDirectory()) return

  directories.add(directory)

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue
    if (!entry.isDirectory()) continue
    await collectDirectories(path.join(directory, entry.name), directories)
  }
}

function closeWatchers() {
  for (const watcher of watchers.values()) {
    watcher.close()
  }
  watchers.clear()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
