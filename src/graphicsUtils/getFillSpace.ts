import { CanvasDrawStack } from "../classes/CanvasDrawStack"
import { ColorProcessor, RGBA } from "../classes/ColorProcessor"
import { Dimensions } from "../hooks/useCanvasViewportConfig"

export const getFillSpace = (
  x: number, 
  y: number, 
  rgba: RGBA, 
  resolution: Dimensions, 
  buffer: OffscreenCanvasRenderingContext2D,
  canvasDrawStack: CanvasDrawStack,
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
  const seen = new Set()

  const modifiedImageData = imageData.data.slice()
  const [r, g, b, a] = rgba

  const colorDifference = colorProcessor.getRGBDifference([tr,tg,tg,ta], [r,g,b,a])

  while (queue.length) {
    const index = queue.shift()

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

      canvasDrawStack.push({
        x: Math.floor((index/4)%resolution.width),
        y: Math.floor((index / 4) / resolution.width),
        rgb: colorDifference
      })

      const nextIndices = [
        (index/4) % (resolution.width) === 0 ? index : index-4,
        (index/4+1) % (resolution.width) === 0 ? index : index+4,
        index+(resolution.width*4),
        index-(resolution.width*4)
      ]
    
      nextIndices.forEach((nextIndex) => {  
        if (seen.has(nextIndex) || (nextIndex > (resolution.width * resolution.height)*4 || nextIndex < 0)) {
          return
        }
        queue.push(nextIndex)        
      })  
    }
  }

  canvasDrawStack.commit()
  const modifiedImage = new ImageData(modifiedImageData, resolution.width, resolution.height)
  buffer.putImageData(modifiedImage, 0, 0)
}

const search = (index: number, rgba: RGBA, resolution: Dimensions, pixels: Uint8ClampedArray) => {

}