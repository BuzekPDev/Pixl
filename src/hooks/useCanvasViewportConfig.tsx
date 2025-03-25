import { RefObject, useRef } from "react"

export interface CanvasViewportConfig {
  dimensions: CanvasDimensionsController;
}

export interface CanvasDimensionsController {
  ref: RefObject<CanvasDimensions>
  set: <K extends keyof CanvasDimensions>(value: Record<K, CanvasDimensions[K]>) => void
}

export interface CanvasDimensions {
  viewport: Dimensions;
  size: Dimensions;
  position: Position;
  resolution: Dimensions;
  aspectRatio: number;
  zoom: number
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number,
  y: number
}

export const useCanvasViewportConfig = () => {

  const dimensions = useRef<CanvasDimensions>({
    viewport: { width: 0, height: 0 },
    size: { width: 0, height: 0 },
    position: { x: 0, y: 0 },
    resolution: { width: 0, height: 0 },
    aspectRatio: 1,
    zoom: 1
  })

  return {
    dimensions: {
      ref: dimensions,
      set: <K extends keyof CanvasDimensions>(dims: Record<K, CanvasDimensions[K]>) => {
        (Object.entries(dims) as Array<[K, CanvasDimensions[K]]>)
          .forEach(([key, val]) => {
            dimensions.current[key] = val
          })
        if ((dims as CanvasDimensions)?.resolution) {
          const { width, height } = (dims as CanvasDimensions).resolution
          const aspectRatio = height / width 
          dimensions.current.aspectRatio = aspectRatio

          const scale = 4

          dimensions.current.size = {
            width: width*scale,
            height: height*scale
          }
        }
      }
    }
  }
}