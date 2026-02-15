export function getRuntimeInfo () {
  if (typeof Bun !== 'undefined' && typeof Bun.version === 'string') {
    return { name: 'bun', version: Bun.version }
  }

  if (typeof Deno !== 'undefined' && Deno.version && typeof Deno.version.deno === 'string') {
    return { name: 'deno', version: Deno.version.deno }
  }

  if (typeof process !== 'undefined' && process.versions && typeof process.versions.node === 'string') {
    return { name: 'node', version: process.versions.node }
  }

  return { name: 'unknown', version: 'unknown' }
}

export function getRuntimeLabel () {
  const runtime = getRuntimeInfo()
  return `${runtime.name} v${runtime.version}`
}

export function getCliArgs () {
  if (typeof Deno !== 'undefined' && Array.isArray(Deno.args)) {
    return Deno.args
  }

  if (typeof process !== 'undefined' && Array.isArray(process.argv)) {
    return process.argv.slice(2)
  }

  return []
}

export function parseIntArg (args, name, defaultValue) {
  const prefix = `--${name}=`
  const arg = args.find((value) => value.startsWith(prefix))
  if (!arg) return defaultValue

  const parsed = Number.parseInt(arg.slice(prefix.length), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue
}

export function nowMs () {
  return performance.now()
}

function toPath (value) {
  if (typeof value !== 'string' || value.length === 0) return ''

  if (value.startsWith('file://')) {
    return decodeURIComponent(new URL(value).pathname)
  }

  return value
}

export function isMainModule (importMeta) {
  if (importMeta && typeof importMeta.main === 'boolean') {
    return importMeta.main
  }

  const metaUrl = importMeta && typeof importMeta.url === 'string' ? importMeta.url : ''
  const metaPath = toPath(metaUrl)

  if (typeof Deno !== 'undefined' && typeof Deno.mainModule === 'string') {
    return toPath(Deno.mainModule) === metaPath
  }

  if (typeof Bun !== 'undefined' && typeof Bun.main === 'string') {
    return toPath(Bun.main) === metaPath
  }

  if (typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1]) {
    const argvPath = process.argv[1]
    if (argvPath === metaPath) return true
    return metaPath.endsWith('/' + argvPath.replace(/\\/g, '/'))
  }

  return false
}
