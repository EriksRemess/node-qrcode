import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PNG } from 'pngjs'
import QRCode from '#lib/core/qrcode'
import PngRenderer from '#lib/renderer/png'
import StreamMock from '#test/mocks/writable-stream'
test('PNG renderer interface', () => {
  assert.strictEqual(typeof PngRenderer.render, 'function',
    'Should have render function')

  assert.strictEqual(typeof PngRenderer.renderToDataURL, 'function',
    'Should have renderToDataURL function')

  assert.strictEqual(typeof PngRenderer.renderToFile, 'function',
    'Should have renderToFile function')

  assert.strictEqual(typeof PngRenderer.renderToFileStream, 'function',
    'Should have renderToFileStream function')
})

test('PNG render', (t) => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  let png

  assert.doesNotThrow(() => { png = PngRenderer.render(sampleQrData) },
    'Should not throw with only qrData param')

  assert.ok(png instanceof PNG,
    'Should return an instance of PNG')

  assert.strictEqual(png.width, png.height,
    'Should be a square image')

  // modules: 25, margins: 4 * 2, scale: 4
  assert.strictEqual(png.width, (25 + 4 * 2) * 4,
    'Should have correct size')

  assert.doesNotThrow(() => {
    png = PngRenderer.render(sampleQrData, {
      margin: 10,
      scale: 1
    })
  }, 'Should not throw with options param')

  assert.strictEqual(png.width, png.height,
    'Should be a square image')

  // modules: 25, margins: 10 * 2, scale: 1
  assert.strictEqual(png.width, 25 + 10 * 2,
    'Should have correct size')
})

test('PNG renderToDataURL', async () => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })

  await new Promise((resolve, reject) => {
    PngRenderer.renderToDataURL(sampleQrData, (err, url) => {
      try {
        assert.ok(!err,
          'Should not generate errors with only qrData param')

        assert.strictEqual(typeof url, 'string',
          'Should return a string')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  await new Promise((resolve, reject) => {
    PngRenderer.renderToDataURL(sampleQrData, { margin: 10, scale: 1 }, (err, url) => {
      try {
        assert.ok(!err, 'Should not generate errors with options param')

        assert.strictEqual(typeof url, 'string',
          'Should return a string')

        assert.strictEqual(url.split(',')[0], 'data:image/png;base64',
          'Should have correct header')

        const b64png = url.split(',')[1]
        assert.strictEqual(b64png.length % 4, 0,
          'Should have a correct length')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  await new Promise((resolve, reject) => {
    PngRenderer.renderToDataURL(sampleQrData, {
      margin: 10,
      scale: 1,
      rendererOpts: {
        fastPng: true
      }
    }, (err, url) => {
      try {
        assert.ok(!err, 'Should not generate errors with fastPng mode')

        assert.strictEqual(typeof url, 'string',
          'Should return a string with fastPng mode')

        assert.strictEqual(url.split(',')[0], 'data:image/png;base64',
          'Should have correct header with fastPng mode')

        const b64png = url.split(',')[1]
        assert.strictEqual(b64png.length % 4, 0,
          'Should have a correct length with fastPng mode')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
})

test('PNG renderToFile', async () => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  const fileName = 'qrimage.png'
  const writeCalls = []
  let fsStub = mock.method(fs, 'createWriteStream', (dest) => {
    writeCalls.push(dest)
    return new StreamMock()
  })

  await new Promise((resolve, reject) => {
    PngRenderer.renderToFile(fileName, sampleQrData, (err) => {
      try {
        assert.ok(!err,
          'Should not generate errors with only qrData param')

        assert.strictEqual(writeCalls[0], fileName,
          'Should save file with correct file name')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  await new Promise((resolve, reject) => {
    PngRenderer.renderToFile(fileName, sampleQrData, {
      margin: 10,
      scale: 1
    }, (err) => {
      try {
        assert.ok(!err,
          'Should not generate errors with options param')

        assert.strictEqual(writeCalls[1], fileName,
          'Should save file with correct file name')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  fsStub.mock.restore()
  fsStub = mock.method(fs, 'createWriteStream', () => {
    return new StreamMock().forceErrorOnWrite()
  })

  await new Promise((resolve, reject) => {
    PngRenderer.renderToFile(fileName, sampleQrData, (err) => {
      try {
        assert.ok(err,
          'Should fail if error occurs during save')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })

  fsStub.mock.restore()
})

test('PNG renderToFileStream', (t) => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })

  assert.doesNotThrow(() => {
    PngRenderer.renderToFileStream(new StreamMock(), sampleQrData)
  }, 'Should not throw with only qrData param')

  assert.doesNotThrow(() => {
    PngRenderer.renderToFileStream(new StreamMock(), sampleQrData, {
      margin: 10,
      scale: 1
    })
  }, 'Should not throw with options param')
})
