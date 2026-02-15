import QRCode from '#lib/index'
import {
  getCliArgs,
  getRuntimeLabel,
  isMainModule,
  nowMs,
  parseIntArg
} from '#examples/bench-runtime'

function generatePayload (size) {
  const chunk = 'https://example.com/path?q=node-qrcode&feature=svg-bench#'
  return chunk.repeat(Math.ceil(size / chunk.length)).slice(0, size)
}

async function runCase (label, text, iterations, warmupIterations) {
  for (let i = 0; i < warmupIterations; i++) {
    await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M' })
  }

  const started = nowMs()
  let totalChars = 0

  for (let i = 0; i < iterations; i++) {
    const svg = await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M' })
    totalChars += svg.length
  }

  const elapsedMs = nowMs() - started
  const opsPerSecond = (iterations / elapsedMs) * 1000
  const avgMs = elapsedMs / iterations
  const avgSvgSize = Math.round(totalChars / iterations)

  console.log(`${label.padEnd(14)} ${String(iterations).padStart(5)} ops  ${opsPerSecond.toFixed(1).padStart(8)} ops/s  ${avgMs.toFixed(3).padStart(8)} ms/op  avg svg ${avgSvgSize} chars`)
}

export async function runBenchmark (cliArgs = getCliArgs()) {
  const iterations = parseIntArg(cliArgs, 'iterations', 500)
  const warmupIterations = parseIntArg(cliArgs, 'warmup', 50)

  const payloads = [
    { label: 'small (32B)', text: generatePayload(32) },
    { label: 'medium (256B)', text: generatePayload(256) },
    { label: 'large (1KB)', text: generatePayload(1024) }
  ]

  console.log('SVG toString benchmark')
  console.log(`Runtime ${getRuntimeLabel()}`)
  console.log(`iterations=${iterations} warmup=${warmupIterations}`)
  console.log('')

  for (const payload of payloads) {
    await runCase(payload.label, payload.text, iterations, warmupIterations)
  }
}

if (isMainModule(import.meta)) {
  runBenchmark().catch((err) => {
    console.error(err)
    if (typeof process !== 'undefined') {
      process.exitCode = 1
    }
  })
}
