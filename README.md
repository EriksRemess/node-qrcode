# @eriksremess/qrcode

Node.js QR code/2D barcode generator.

- Node.js module API
- Save QR codes as PNG, SVG, UTF-8 string, or Data URL
- Supports Numeric, Alphanumeric, Kanji, and Byte modes
- Supports mixed/manual segments and multibyte text

## Installation

Node.js 26 or newer is required. The PNG renderer uses `@eriksremess/pngjs`
from GitHub Packages, so configure the scope and a classic GitHub token with
`read:packages` before installing:

```ini
@eriksremess:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```sh
npm install @eriksremess/qrcode
```

PNG output uses native acceleration when available and falls back to the
portable renderer on other platforms or when the native addon cannot load.

## Usage

```js
import QRCode from '@eriksremess/qrcode'

const url = await QRCode.toDataURL('I am a pony!')
console.log(url)
```

### Promise / async usage

```js
import QRCode from '@eriksremess/qrcode'

async function generate (text) {
  return QRCode.toDataURL(text)
}
```

## API

- `create(text, [options])`
- `toDataURL(text, [options])`
- `toBuffer(text, [options])`
- `toString(text, [options])`
- `toFile(path, text, [options])`
- `toFileStream(stream, text, [options])`

## Node.js API details

### `create(text, [options])`
Creates and returns a QRCode object.

### `toDataURL(text, [options])`
Returns a Promise resolving to a Data URI containing the QR image (PNG).

### `toBuffer(text, [options])`
Returns a Promise resolving to a PNG buffer.

### `toString(text, [options])`
Returns a Promise resolving to a string representation of the QR code.

Supported `options.type` values:
- `utf8`
- `svg`

### `toFile(path, text, [options])`
Returns a Promise that resolves after writing a QR code to a file.

### `toFileStream(stream, text, [options])`
Writes a QR code PNG to a writable stream and ends it. Returns a Promise that
resolves when writing finishes, or rejects if encoding or writing fails.

## Options

Common options include:

- `errorCorrectionLevel`: `L`, `M`, `Q`, `H` (default `M`)
- `version`: integer `1` to `40`
- `maskPattern`: integer `0` to `7`
- `margin`: quiet-zone size as a finite number
- `width` / `scale`: finite numbers; `scale` must be nonnegative (`0` uses the default scale of `4`)
- `color.dark` / `color.light` (RGBA hex)
- `shape`: `square` or `rounded` for SVG and PNG output (default `square`)
- `type`: renderer output type

## Binary data

For byte data, pass a `Uint8ClampedArray`, compatible array, or Node.js `Buffer`:

```js
import QRCode from '@eriksremess/qrcode'

await QRCode.toFile(
  'foo.png',
  [{ data: Buffer.from([253, 254, 255]), mode: 'byte' }]
)
```

## Kanji / Shift JIS support

To enable optimized Kanji mode, provide a `toSJISFunc` converter:

```js
import QRCode from '@eriksremess/qrcode'
import toSJIS from '@eriksremess/qrcode/helper/to-sjis'

const url = await QRCode.toDataURL('漢字', { toSJISFunc: toSJIS })
console.log(url)
```

The converter applies only to that call. Pass it again for each QR code that
should use Kanji mode.

## License

MIT
