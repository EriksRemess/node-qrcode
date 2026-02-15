import { create as createQRCode } from '#lib/core/qrcode'
import Utils from '#lib/renderer/utils'
import {
  getCliArgs,
  getRuntimeLabel,
  isMainModule,
  nowMs,
  parseIntArg
} from '#examples/bench-runtime'

function generatePayload (size) {
  const chunk = 'https://example.com/path?q=node-qrcode&feature=image-data-bench#'
  return chunk.repeat(Math.ceil(size / chunk.length)).slice(0, size)
}

function runCase (label, text, iterations, warmupIterations) {
  const opts = Utils.getOptions({
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 4,
    color: {
      dark: '#000000ff',
      light: '#ffffffff'
    }
  })

  const qr = createQRCode(text, { errorCorrectionLevel: 'M' })
  const imageWidth = Utils.getImageWidth(qr.modules.size, opts)
  const imageData = new Uint8ClampedArray(imageWidth * imageWidth * 4)

  for (let i = 0; i < warmupIterations; i++) {
    Utils.qrToImageData(imageData, qr, opts)
  }

  const started = nowMs()
  let checksum = 0

  for (let i = 0; i < iterations; i++) {
    Utils.qrToImageData(imageData, qr, opts)
    checksum += imageData[(i * 13) % imageData.length]
  }

  const elapsedMs = nowMs() - started
  const opsPerSecond = (iterations / elapsedMs) * 1000
  const avgMs = elapsedMs / iterations

  console.log(`${label.padEnd(14)} ${String(iterations).padStart(6)} ops  ${opsPerSecond.toFixed(1).padStart(9)} ops/s  ${avgMs.toFixed(4).padStart(9)} ms/op  image ${imageWidth}x${imageWidth}  checksum ${checksum}`)
}

export function runBenchmark (cliArgs = getCliArgs()) {
  const iterations = parseIntArg(cliArgs, 'iterations', 2000)
  const warmupIterations = parseIntArg(cliArgs, 'warmup', 200)

  const payloads = [
    { label: 'small (32B)', text: generatePayload(32) },
    { label: 'medium (256B)', text: generatePayload(256) },
    { label: 'large (1KB)', text: generatePayload(1024) }
  ]

  console.log('qrToImageData benchmark')
  console.log(`Runtime ${getRuntimeLabel()}`)
  console.log(`iterations=${iterations} warmup=${warmupIterations}`)
  console.log('')

  for (const payload of payloads) {
    runCase(payload.label, payload.text, iterations, warmupIterations)
  }
}

if (isMainModule(import.meta)) {
  runBenchmark()
}
