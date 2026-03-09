import { test } from 'node:test'
import jsQR from 'jsqr'
import { PNGWasm as PNG } from 'pngjs'
import QRCode from '#lib/index'

function decodePngDataUrl(dataUrl) {
  const base64 = dataUrl.replace('data:image/png;base64,', '')
  const pngBuffer = Buffer.from(base64, 'base64')
  const png = PNG.sync.read(pngBuffer)
  const imageData = new Uint8ClampedArray(
    png.data.buffer,
    png.data.byteOffset,
    png.data.byteLength
  )

  const decoded = jsQR(imageData, png.width, png.height, {
    inversionAttempts: 'dontInvert'
  })

  return { base64, decoded, png }
}

test('toDataURL - image/png', async (t) => {
  await t.assert.rejects(() => QRCode.toDataURL(),
    'Should reject if no arguments are provided')

  const promisedUrl = await QRCode.toDataURL('i am a pony!', {
    errorCorrectionLevel: 'L',
    type: 'image/png'
  })
  t.assert.ok(promisedUrl.startsWith('data:image/png;base64,'),
    'url should have the PNG data URL header')

  const { base64, decoded } = decodePngDataUrl(promisedUrl)
  t.assert.strictEqual(base64.length % 4, 0,
    'base64 payload should be padded correctly')
  t.assert.ok(decoded, 'QR should be decodable')
  t.assert.strictEqual(decoded.data, 'i am a pony!',
    'Decoded text should match input text')

  await QRCode.toDataURL('i am a pony!', {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: 'H',
    type: 'image/png'
  }).catch((err) => {
    t.assert.ok(err, 'there should be an error (promise)')
  })
})

test('toDataURL - decoded text matches input', async (t) => {
  const input = 'roundtrip-check-123'
  const dataUrl = await QRCode.toDataURL(input, {
    errorCorrectionLevel: 'M',
    type: 'image/png'
  })

  const { decoded } = decodePngDataUrl(dataUrl)

  t.assert.ok(decoded, 'QR should be decodable')
  t.assert.strictEqual(decoded.data, input, 'Decoded text should match input text')
})

test('toDataURL - rounded PNG decodes to input', async (t) => {
  const input = 'rounded-png-roundtrip'
  const dataUrl = await QRCode.toDataURL(input, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    shape: 'rounded'
  })

  const { decoded } = decodePngDataUrl(dataUrl)

  t.assert.ok(decoded, 'Rounded PNG should be decodable')
  t.assert.strictEqual(decoded.data, input, 'Decoded text should match input text')
})

test('toDataURL - rounded PNG has antialiased corners', async (t) => {
  const dataUrl = await QRCode.toDataURL('rounded-antialias-check', {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    shape: 'rounded',
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })

  const { png } = decodePngDataUrl(dataUrl)
  let hasBlendedPixel = false

  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i]
    const g = png.data[i + 1]
    const b = png.data[i + 2]
    const a = png.data[i + 3]

    if (a === 255 && r === g && g === b && r > 0 && r < 255) {
      hasBlendedPixel = true
      break
    }
  }

  t.assert.ok(hasBlendedPixel, 'Rounded PNG should include blended edge pixels')
})
