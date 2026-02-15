import { runBenchmark as runSvgBenchmark } from './bench-svg-tostring.js'
import { runBenchmark as runImageDataBenchmark } from './bench-image-data.js'
import { getCliArgs, isMainModule } from './bench-runtime.js'

async function main () {
  const args = getCliArgs()

  console.log('\n=== SVG toString ===')
  await runSvgBenchmark(args)

  console.log('\n=== qrToImageData ===')
  runImageDataBenchmark(args)
}

if (isMainModule(import.meta)) {
  main().catch((err) => {
    console.error(err)
    if (typeof process !== 'undefined') {
      process.exitCode = 1
    }
  })
}
