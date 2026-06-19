import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const opt = {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_PATH: './' + path.delimiter + './lib'
  },
  stdio: [process.stdin, process.stdout, process.stderr]
}

const child = spawn('node', [
  '--test',
  process.argv[2] || 'test/**/*.test.js'
], opt)

child.on('error', (err) => {
  throw err
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exitCode = code ?? 1
})
