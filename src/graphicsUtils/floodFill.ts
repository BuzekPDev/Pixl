import { ColorProcessor, RGBA } from "../classes/ColorProcessor"
import { FrameManagerApi } from "../hooks/useCanvasFrameManager"
import { Dimensions } from "../types/types"

export const floodFill = (
  x: number, 
  y: number, 
  rgba: RGBA, 
  resolution: Dimensions, 
  buffer: OffscreenCanvasRenderingContext2D,
  frameManager: FrameManagerApi,
  colorProcessor: ColorProcessor
) => {

  const imageData = buffer.getImageData(0, 0, resolution.width, resolution.height)
  const indexFromCoordinates = (y * resolution.width + x) * 4

  // target prefix
  const [tr, tg, tb, ta] = [
    imageData.data[indexFromCoordinates],
    imageData.data[indexFromCoordinates + 1],
    imageData.data[indexFromCoordinates + 2],
    imageData.data[indexFromCoordinates + 3]
  ]

  const queue = [indexFromCoordinates]
  let start = 0

  const seen = new Set()

  const modifiedImageData = imageData.data.slice()
  const [r, g, b, a] = rgba

  if (tr === r && tg === g && tb === b && ta === a) return

  const colorDifference = colorProcessor.getRGBDifference([tr,tg,tb,ta], [r,g,b,a])
  const step = []

  while (queue.length) {
    const index = queue[start++]

    if (index === undefined) break;

    if (seen.has(index)) continue

    seen.add(index)

    // pixel prefix
    const [pr, pg, pb, pa] = [
      modifiedImageData[index],
      modifiedImageData[index + 1],
      modifiedImageData[index + 2],
      modifiedImageData[index + 3]
    ]

    if (pr === tr && pg === tg && pb === tb && pa === ta) {
      modifiedImageData[index] = r
      modifiedImageData[index + 1] = g
      modifiedImageData[index + 2] = b
      modifiedImageData[index + 3] = a

      const trueIndex = index / 4
      const pixelX = trueIndex % resolution.width
      const pixelY = Math.floor(trueIndex / resolution.width)

      step.push({
        x: Math.floor((index/4)%resolution.width),
        y: Math.floor((index / 4) / resolution.width),
        rgb: colorDifference
      })

      const nextIndices = [
        pixelX > 0 ? index - 4 : null,
        pixelX < resolution.width - 1 ? index + 4 : null,
        pixelY > 0 ? index - resolution.width * 4 : null,
        pixelY < resolution.height - 1 ? index + resolution.width * 4 : null
      ]
    
      nextIndices.forEach((nextIndex) => {  
        if (nextIndex === null || seen.has(nextIndex)) {
          return
        }
        queue.push(nextIndex)        
      })  
    }
  }
  frameManager.updateStep(step)
  frameManager.finishStep()
  
  const modifiedImage = new ImageData(modifiedImageData, resolution.width, resolution.height)
  buffer.putImageData(modifiedImage, 0, 0)
}
