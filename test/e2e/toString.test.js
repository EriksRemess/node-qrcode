import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jsQR from 'jsqr'
import { createCanvas, loadImage } from 'canvas'
import QRCode from '#lib/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('toString', async (t) => {
  await t.assert.rejects(() => QRCode.toString(), 'Should reject if text is not provided')

  const str = await QRCode.toString('some text')
  t.assert.strictEqual(typeof str, 'string', 'Should return a string')

  const strWithOptions = await QRCode.toString('some text', { errorCorrectionLevel: 'L' })
  t.assert.strictEqual(typeof strWithOptions, 'string', 'Should return a string with options')
  t.assert.strictEqual(typeof QRCode.toString('some text').then, 'function', 'Should return a promise')
})

test('toString input matches output deterministically', async (t) => {
  const first = await QRCode.toString('input-a', { type: 'svg', errorCorrectionLevel: 'M' })
  const firstAgain = await QRCode.toString('input-a', { type: 'svg', errorCorrectionLevel: 'M' })
  const second = await QRCode.toString('input-b', { type: 'svg', errorCorrectionLevel: 'M' })

  t.assert.strictEqual(first, firstAgain, 'Same input should generate the same output')
  t.assert.notStrictEqual(first, second, 'Different input should generate different output')
})

test('toString svg', async (t) => {
  const file = path.join(__dirname, '/svgtag.expected.out')
  const expectedSvg = await fs.promises.readFile(file, 'utf8')

  await QRCode.toString('http://www.google.com', {
    version: 1,
    errorCorrectionLevel: 'H',
    type: 'svg'
  }).then(
    () => t.assert.fail('Expected version error'),
    (err) => t.assert.ok(err, 'there should be an error')
  )

  const svg = await QRCode.toString('http://www.google.com', {
    errorCorrectionLevel: 'H',
    type: 'svg'
  })
  t.assert.strictEqual(svg, expectedSvg, 'should output a valid svg')
})

async function decodeSvg(svg) {
  const image = await loadImage(Buffer.from(svg))
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data,
    canvas.width, canvas.height, { inversionAttempts: 'dontInvert' })
}

for (const shape of ['square', 'rounded']) {
  test('toString svg ' + shape + ' decodes with nearly opaque modules', async (t) => {
    const input = 'svg-' + shape + '-roundtrip'
    const svg = await QRCode.toString(input, {
      errorCorrectionLevel: 'H', type: 'svg', shape, width: 320,
      color: { dark: '#000000fe' }
    })
    const decoded = await decodeSvg(svg)
    t.assert.ok(decoded, 'Rendered SVG should be decodable')
    t.assert.strictEqual(decoded.data, input)
  })
}

test('toString svg with centered image decodes to input', async (t) => {
  const input = 'svg-roundtrip-with-center-image'
  const svg = await QRCode.toString(input, { errorCorrectionLevel: 'H', type: 'svg', margin: 2, width: 320 })
  const width = Number(svg.match(/viewBox="0 0 (\d+)/)[1])
  const imageSize = Math.floor(width * 0.16)
  const offset = Math.floor((width - imageSize) / 2)
  const overlay = createCanvas(1, 1)
  const ctx = overlay.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 1, 1)
  const imageTag = `<image x="${offset}" y="${offset}" width="${imageSize}" height="${imageSize}" href="${overlay.toDataURL()}" preserveAspectRatio="none"/>`
  const decoded = await decodeSvg(svg.replace('</svg>', imageTag + '</svg>'))
  t.assert.ok(decoded, 'SVG with centered image should be decodable')
  t.assert.strictEqual(decoded.data, input)
})

test('toString utf8', async (t) => {
  const expectedUtf8 = [
    '                                 ',
    '                                 ',
    '    █▀▀▀▀▀█ █ ▄█  ▀ █ █▀▀▀▀▀█    ',
    '    █ ███ █ ▀█▄▀▄█ ▀▄ █ ███ █    ',
    '    █ ▀▀▀ █ ▀▄ ▄ ▄▀ █ █ ▀▀▀ █    ',
    '    ▀▀▀▀▀▀▀ ▀ ▀ █▄▀ █ ▀▀▀▀▀▀▀    ',
    '    ▀▄ ▀▀▀▀█▀▀█▄ ▄█▄▀█ ▄█▄██▀    ',
    '    █▄ ▄▀▀▀▄▄█ █▀▀▄█▀ ▀█ █▄▄█    ',
    '    █▄ ▄█▄▀█▄▄  ▀ ▄██▀▀ ▄  ▄▀    ',
    '    █▀▄▄▄▄▀▀█▀▀█▀▀▀█ ▀ ▄█▀█▀█    ',
    '    ▀ ▀▀▀▀▀▀███▄▄▄▀ █▀▀▀█ ▀█     ',
    '    █▀▀▀▀▀█ █▀█▀▄ ▄▄█ ▀ █▀ ▄█    ',
    '    █ ███ █ █ █ ▀▀██▀███▀█ ██    ',
    '    █ ▀▀▀ █  █▀ ▀ █ ▀▀▄██ ███    ',
    '    ▀▀▀▀▀▀▀ ▀▀▀  ▀▀ ▀    ▀  ▀    ',
    '                                 ',
    '                                 '
  ].join('\n')

  await QRCode.toString('http://www.google.com', {
    version: 1,
    errorCorrectionLevel: 'H',
    type: 'utf8'
  }).then(
    () => t.assert.fail('Expected version error'),
    (err) => t.assert.ok(err, 'there should be an error')
  )

  const utf8 = await QRCode.toString('http://www.google.com', {
    errorCorrectionLevel: 'M',
    type: 'utf8'
  })
  t.assert.strictEqual(utf8, expectedUtf8, 'should output a valid symbol')

  const utf8Default = await QRCode.toString('http://www.google.com')
  t.assert.strictEqual(utf8Default, expectedUtf8, 'Should output a valid symbol with default options')
})

test('toString byte-input', async (t) => {
  const expectedOutput = [
    '                             ',
    '                             ',
    '    █▀▀▀▀▀█  █▄█▀ █▀▀▀▀▀█    ',
    '    █ ███ █ ▀█ █▀ █ ███ █    ',
    '    █ ▀▀▀ █   ▀ █ █ ▀▀▀ █    ',
    '    ▀▀▀▀▀▀▀ █▄▀▄█ ▀▀▀▀▀▀▀    ',
    '    ▀██▄██▀▀▀█▀▀ ▀█  ▄▀▄     ',
    '    ▀█▀▄█▄▀▄ ██ ▀ ▄ ▀▄  ▀    ',
    '    ▀ ▀ ▀▀▀▀█▄ ▄▀▄▀▄▀▄▀▄▀    ',
    '    █▀▀▀▀▀█ █  █▄█▀█▄█  ▀    ',
    '    █ ███ █ ▀█▀▀ ▀██  ▀█▀    ',
    '    █ ▀▀▀ █ ██▀ ▀ ▄ ▀▄▀▄▀    ',
    '    ▀▀▀▀▀▀▀ ▀▀▀ ▀ ▀▀▀ ▀▀▀    ',
    '                             ',
    '                             '
  ].join('\n')
  const byteInput = new Uint8ClampedArray([1, 2, 3, 4, 5])

  const code = await QRCode.toString([{ data: byteInput, mode: 'byte' }], { errorCorrectionLevel: 'L' })
  t.assert.strictEqual(code, expectedOutput, 'should output the correct code')
})
