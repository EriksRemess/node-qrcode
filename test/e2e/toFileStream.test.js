import { test, mock } from 'node:test'
import QRCode from '#lib/index'
import StreamMock from '#test/mocks/writable-stream'
test('toFileStream png', async (t) => {
  await t.assert.rejects(() => QRCode.toFileStream('some text'),
    'Should reject if stream is not provided')

  await t.assert.rejects(() => QRCode.toFileStream(new StreamMock()),
    'Should reject if text is not provided')

  const fstream = new StreamMock()
  const spy = mock.method(fstream, 'emit', function (...args) {
    return StreamMock.prototype.emit.apply(this, args)
  })

  await QRCode.toFileStream(fstream, 'i am a pony!')

  await QRCode.toFileStream(new StreamMock(), 'i am a pony!', {
    type: 'image/png'
  })

  t.assert.ok(spy.mock.calls.every((call) => { return call.arguments[0] !== 'error' }),
    'There should be no error')

  spy.mock.restore()
})

test('toFileStream png with write error', async (t) => {
  await t.assert.rejects(
    QRCode.toFileStream(new StreamMock().forceErrorOnWrite(), 'i am a pony!'),
    /Fake error/
  )
})

test('toFileStream png with qrcode error', async (t) => {
  const fstreamErr = new StreamMock()
  const bigString = 'i am a pony!'.repeat(199)

  await QRCode.toFileStream(fstreamErr, bigString).then(
    () => t.assert.fail('Expected qrcode overflow error'),
    (e) => t.assert.ok(e, 'Should return an error')
  )

  await QRCode.toFileStream(fstreamErr, 'i am a pony!', {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: 'H'
  }).then(
    () => t.assert.fail('Expected invalid version/data error'),
    (e) => t.assert.ok(e, 'Should return an error')
  )
})
