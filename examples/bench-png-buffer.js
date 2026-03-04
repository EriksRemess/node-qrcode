import QRCode from '#lib/index'
import {
  getCliArgs,
  getRuntimeLabel,
  isMainModule,
  nowMs,
  parseIntArg
} from '#examples/bench-runtime'

function generatePayload (size) {
  const chunk = 'https://example.com/path?q=node-qrcode&feature=png-buffer-bench#'
  return chunk.repeat(Math.ceil(size / chunk.length)).slice(0, size)
}

async function runCase (label, text, iterations, warmupIterations) {
  const options = {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 4
  }

  for (let i = 0; i < warmupIterations; i++) {
    await QRCode.toBuffer(text, options)
  }

  const started = nowMs()
  let totalBytes = 0
  let checksum = 0

  for (let i = 0; i < iterations; i++) {
    const pngBuffer = await QRCode.toBuffer(text, options)
    totalBytes += pngBuffer.length
    checksum += pngBuffer[i % pngBuffer.length]
  }

  const elapsedMs = nowMs() - started
  const opsPerSecond = (iterations / elapsedMs) * 1000
  const avgMs = elapsedMs / iterations
  const avgPngSize = Math.round(totalBytes / iterations)

  console.log(`${label.padEnd(14)} ${String(iterations).padStart(5)} ops  ${opsPerSecond.toFixed(1).padStart(8)} ops/s  ${avgMs.toFixed(3).padStart(8)} ms/op  avg png ${String(avgPngSize).padStart(5)} B  checksum ${checksum}`)
}

export async function runBenchmark (cliArgs = getCliArgs()) {
  const iterations = parseIntArg(cliArgs, 'iterations', 200)
  const warmupIterations = parseIntArg(cliArgs, 'warmup', 20)

  const payloads = [
    { label: 'small (32B)', text: generatePayload(32) },
    { label: 'medium (256B)', text: generatePayload(256) },
    { label: 'large (1KB)', text: generatePayload(1024) }
  ]

  console.log('PNG toBuffer benchmark')
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
