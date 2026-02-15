import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import QRCode from '#lib/core/qrcode'
import Utf8Renderer from '#lib/renderer/utf8'
test('Utf8Renderer interface', () => {
  assert.strictEqual(typeof Utf8Renderer.render, 'function',
    'Should have render function')
})

test('Utf8Renderer render', () => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  let str

  assert.doesNotThrow(() => { str = Utf8Renderer.render(sampleQrData) },
    'Should not throw with only qrData param')

  assert.doesNotThrow(() => {
    str = Utf8Renderer.render(sampleQrData, {
      margin: 10,
      scale: 1
    })
  }, 'Should not throw with options param')

  assert.strictEqual(typeof str, 'string',
    'Should return a string')
})

test('Utf8 renderToFile', async () => {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  const fileName = 'qrimage.txt'
  const writeCalls = []
  let fsStub = mock.method(fs, 'writeFile', (file, data, cb) => {
    writeCalls.push(file)
    cb()
  })

  await new Promise((resolve, reject) => {
    Utf8Renderer.renderToFile(fileName, sampleQrData, (err) => {
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
    Utf8Renderer.renderToFile(fileName, sampleQrData, {
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
  fsStub = mock.method(fs, 'writeFile', (file, data, cb) => {
    cb(new Error())
  })

  await new Promise((resolve, reject) => {
    Utf8Renderer.renderToFile(fileName, sampleQrData, (err) => {
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
