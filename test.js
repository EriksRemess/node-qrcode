import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const opt = {
  cwd: __dirname,
  env: (function () {
    process.env.NODE_PATH = './' + path.delimiter + './lib'
    return process.env
  }()),
  stdio: [process.stdin, process.stdout, process.stderr]
}

spawn('node', [
  '--test',
  process.argv[2] || 'test/**/*.test.js'
], opt)
