import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
