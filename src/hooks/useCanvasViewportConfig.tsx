import { useState } from "react"

export interface CanvasViewportConfig {
  dimensions: CanvasDimensionsController;
}

export interface CanvasDimensions {
  width: number,
  height: number,
  scaleX: number,
  scaleY: number,
  aspectRatio: number
}

export interface CanvasDimensionsController extends CanvasDimensions {
  set: (
    width: number,
    height: number,
    canvasWidth: number,
    canvasHeight: number,
    aspectRatio: number
  ) => void;
}

export const useCanvasViewportConfig = () => {

  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    aspectRatio: 1
  })


  return {
    dimensions: {
      ...dimensions,
      set: (
        width: number,
        height: number,
        canvasWidth: number,
        canvasHeight: number,
        aspectRatio: number
      ) => {
        const scaleX = canvasWidth / width;
        const scaleY = canvasHeight / height;
        setDimensions({ width, height, scaleX, scaleY, aspectRatio })
      },

    }
  }
}