import { runBenchmark as runSvgBenchmark } from '#examples/bench-svg-tostring'
import { runBenchmark as runImageDataBenchmark } from '#examples/bench-image-data'
import { getCliArgs, isMainModule } from '#examples/bench-runtime'

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
