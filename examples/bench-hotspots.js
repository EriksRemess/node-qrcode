import QRCode from '#lib/index'
import { create as createQRCode } from '#lib/core/qrcode'
import SvgTagRenderer from '#lib/renderer/svg-tag'
import Utils from '#lib/renderer/utils'
import {
  getCliArgs,
  getRuntimeLabel,
  isMainModule,
  nowMs,
  parseIntArg
} from '#examples/bench-runtime'

function generatePayload (size) {
  const chunk = 'https://example.com/path?q=node-qrcode&feature=hotspots#'
  return chunk.repeat(Math.ceil(size / chunk.length)).slice(0, size)
}

function formatStat (name, iterations, elapsedMs, extra = '') {
  const opsPerSecond = (iterations / elapsedMs) * 1000
  const msPerOp = elapsedMs / iterations

  return {
    name,
    elapsedMs,
    line: `${name.padEnd(24)} ${String(iterations).padStart(6)} ops  ${opsPerSecond.toFixed(1).padStart(9)} ops/s  ${msPerOp.toFixed(4).padStart(9)} ms/op${extra}`
  }
}

async function runCase (label, text, iterations, warmupIterations) {
  const createOpts = { errorCorrectionLevel: 'M' }
  const svgRenderOpts = { type: 'svg', errorCorrectionLevel: 'M' }
  const imageOpts = Utils.getOptions({
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 4,
    color: {
      dark: '#000000ff',
      light: '#ffffffff'
    }
  })

  for (let i = 0; i < warmupIterations; i++) {
    const qr = createQRCode(text, createOpts)
    SvgTagRenderer.render(qr, svgRenderOpts)
    const size = Utils.getImageWidth(qr.modules.size, imageOpts)
    const imageData = new Uint8ClampedArray(size * size * 4)
    Utils.qrToImageData(imageData, qr, imageOpts)
    await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M' })
  }

  const stats = []

  let started = nowMs()
  let createChecksum = 0
  for (let i = 0; i < iterations; i++) {
    const qr = createQRCode(text, createOpts)
    createChecksum += qr.modules.size
  }
  stats.push(formatStat('createQRCode', iterations, nowMs() - started, `  checksum ${createChecksum}`))

  const baseQrForSvg = createQRCode(text, createOpts)
  started = nowMs()
  let svgLenChecksum = 0
  for (let i = 0; i < iterations; i++) {
    const svg = SvgTagRenderer.render(baseQrForSvg, svgRenderOpts)
    svgLenChecksum += svg.length
  }
  stats.push(formatStat('svgTag.render', iterations, nowMs() - started, `  checksum ${svgLenChecksum}`))

  const baseQrForImage = createQRCode(text, createOpts)
  const imageWidth = Utils.getImageWidth(baseQrForImage.modules.size, imageOpts)
  const imageData = new Uint8ClampedArray(imageWidth * imageWidth * 4)
  started = nowMs()
  let imageChecksum = 0
  for (let i = 0; i < iterations; i++) {
    Utils.qrToImageData(imageData, baseQrForImage, imageOpts)
    imageChecksum += imageData[(i * 13) % imageData.length]
  }
  stats.push(formatStat('utils.qrToImageData', iterations, nowMs() - started, `  checksum ${imageChecksum}`))

  started = nowMs()
  let toStringChecksum = 0
  for (let i = 0; i < iterations; i++) {
    const svg = await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M' })
    toStringChecksum += svg.length
  }
  stats.push(formatStat('QRCode.toString(svg)', iterations, nowMs() - started, `  checksum ${toStringChecksum}`))

  started = nowMs()
  let toDataUrlChecksum = 0
  for (let i = 0; i < iterations; i++) {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      rendererOpts: useFastPng ? { fastPng: true } : undefined
    })
    toDataUrlChecksum += dataUrl.length
  }
  stats.push(formatStat('QRCode.toDataURL', iterations, nowMs() - started, `  checksum ${toDataUrlChecksum}`))

  stats.sort((a, b) => b.elapsedMs - a.elapsedMs)

  console.log(`\n${label}`)
  for (let i = 0; i < stats.length; i++) {
    const rank = `${i + 1}.`.padEnd(3)
    console.log(rank + stats[i].line)
  }
}

let useFastPng = false

export async function runBenchmark (cliArgs = getCliArgs()) {
  const iterations = parseIntArg(cliArgs, 'iterations', 100)
  const warmupIterations = parseIntArg(cliArgs, 'warmup', 20)
  useFastPng = parseIntArg(cliArgs, 'fast-png', 0) === 1

  const payloads = [
    { label: 'small (32B)', text: generatePayload(32) },
    { label: 'medium (256B)', text: generatePayload(256) },
    { label: 'large (1KB)', text: generatePayload(1024) }
  ]

  console.log('Hotspot benchmark (ranked)')
  console.log(`Runtime ${getRuntimeLabel()}`)
  console.log(`iterations=${iterations} warmup=${warmupIterations}`)
  console.log(`fastPng=${useFastPng ? 'on' : 'off'}`)

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
