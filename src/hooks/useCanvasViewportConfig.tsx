import { useState } from "react"

export interface CanvasDimensions {
  width: number,
  height: number,
  scaleX: number,
  scaleY: number
}

export const useCanvasViewportConfig = () => {

  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1
  })


  return {
    dimensions: {
      width: dimensions.width,
      height: dimensions.height,
      scaleX: dimensions.scaleX,
      scaleY: dimensions.scaleY,
      set: (width: number, height: number, canvasWidth: number, canvasHeight: number) => {
        const scaleX = canvasWidth / width;
        const scaleY = canvasHeight / height;
        setDimensions({ width, height, scaleX, scaleY })
      }
    }
  }
}