import { test, mock } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import QRCode from '#lib/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('toFile', async (t) => {
  const fileName = path.join(os.tmpdir(), 'qrimage.png')

  await t.assert.rejects(() => QRCode.toFile('some text'), 'Should reject if path is not provided')
  await t.assert.rejects(() => QRCode.toFile(fileName), 'Should reject if text is not provided')
  t.assert.strictEqual(typeof QRCode.toFile(fileName, 'some text').then, 'function', 'Should return a promise')
})

test('toFile png', async (t) => {
  const fileName = path.join(os.tmpdir(), 'qrimage-png-' + process.pid + '.png')
  const expectedDataUrl = await QRCode.toDataURL('i am a pony!', {
    errorCorrectionLevel: 'L',
    type: 'image/png'
  })
  const expectedBase64Output = expectedDataUrl.replace('data:image/png;base64,', '')

  await QRCode.toFile(fileName, 'i am a pony!', { errorCorrectionLevel: 'L' })
  await fs.promises.stat(fileName)
  const buffer = await fs.promises.readFile(fileName)
  t.assert.strictEqual(buffer.toString('base64'), expectedBase64Output, 'Should write correct content')

  await QRCode.toFile(fileName, 'i am a pony!', {
    errorCorrectionLevel: 'L',
    type: 'png'
  })

  const fsStub = mock.method(fs, 'writeFile', (dest, buffer, cb) => {
    process.nextTick(cb, new Error('Fake error'))
  })

  await QRCode.toFile(fileName, 'i am a pony!', {
    errorCorrectionLevel: 'L'
  }).then(
    () => t.assert.fail('Should fail on stream write error'),
    (err) => t.assert.ok(err, 'There should be an error')
  )

  fsStub.mock.restore()
})

test('toFile svg', async (t) => {
  const fileName = path.join(os.tmpdir(), 'qrimage-svg-' + process.pid + '.svg')
  const expectedOutput = fs.readFileSync(path.join(__dirname, '/svg.expected.out'), 'utf8')

  await QRCode.toFile(fileName, 'http://www.google.com', {
    errorCorrectionLevel: 'H'
  })

  await fs.promises.stat(fileName)
  const content = await fs.promises.readFile(fileName, 'utf8')
  t.assert.strictEqual(content, expectedOutput, 'Should write correct content')

  await QRCode.toFile(fileName, 'http://www.google.com', {
    errorCorrectionLevel: 'H',
    type: 'svg'
  })
})

test('toFile utf8', async (t) => {
  const fileName = path.join(os.tmpdir(), 'qrimage-utf8-' + process.pid + '.txt')
  const expectedOutput = [
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

  await QRCode.toFile(fileName, 'http://www.google.com')
  await fs.promises.stat(fileName)
  const content = await fs.promises.readFile(fileName, 'utf8')
  t.assert.strictEqual(content, expectedOutput, 'Should write correct content')

  await QRCode.toFile(fileName, 'http://www.google.com', {
    errorCorrectionLevel: 'M',
    type: 'utf8'
  })
})

test('toFile manual segments', async (t) => {
  const fileName = path.join(os.tmpdir(), 'qrimage-manual-' + process.pid + '.txt')
  const segs = [
    { data: 'ABCDEFG', mode: 'alphanumeric' },
    { data: '0123456', mode: 'numeric' }
  ]
  const expectedOutput = [
    '                             ',
    '                             ',
    '    █▀▀▀▀▀█ ██▀██ █▀▀▀▀▀█    ',
    '    █ ███ █  █▀█▄ █ ███ █    ',
    '    █ ▀▀▀ █ █ ▄ ▀ █ ▀▀▀ █    ',
    '    ▀▀▀▀▀▀▀ █▄█▄▀ ▀▀▀▀▀▀▀    ',
    '    ▀██ ▄▀▀▄█▀▀▀▀██▀▀▄ █▀    ',
    '     ▀█▀▀█▀█▄ ▄ ▄█▀▀▀█▀      ',
    '    ▀ ▀▀▀ ▀ ▄▀ ▄ ▄▀▄  ▀▄     ',
    '    █▀▀▀▀▀█ ▄  █▀█ ▀▀▀▄█▄    ',
    '    █ ███ █  █▀▀▀ ██▀▀ ▀▀    ',
    '    █ ▀▀▀ █ ██  ▄▀▀▀▀▄▀▀█    ',
    '    ▀▀▀▀▀▀▀ ▀    ▀▀▀▀ ▀▀▀    ',
    '                             ',
    '                             '
  ].join('\n')

  await QRCode.toFile(fileName, segs, { errorCorrectionLevel: 'L' })
  await fs.promises.stat(fileName)
  const content = await fs.promises.readFile(fileName, 'utf8')
  t.assert.strictEqual(content, expectedOutput, 'Should write correct content')
})
