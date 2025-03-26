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
  zoom: number;
  scale: number;
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
    zoom: 1,
    scale: 1,
  })

  const rescale = () => {
    const { resolution, scale } = dimensions.current
    const dpr = window.devicePixelRatio
    const width = Math.max(resolution.width * scale, resolution.width / dpr)
    const height = Math.max(resolution.height * scale, resolution.height / dpr)

    dimensions.current.size = {
      width: width,//dimensions.current.resolution.width*dimensions.current.scale,
      height: height//dimensions.current.resolution.height*dimensions.current.scale
    }
  }

  const recenter = () => {
    const { resolution, scale, viewport } = dimensions.current
    const dpr = window.devicePixelRatio
    const width = Math.max(resolution.width * scale, resolution.width / dpr)
    const height = Math.max(resolution.height * scale, resolution.height / dpr)

    if (viewport.width > viewport.height) {
      dimensions.current.position = {
        x: (viewport.width - width) / 2,
        y: 0
      }
    } else {
      dimensions.current.position = {
        x: 0,
        y: (viewport.height - height) / 2 
      }
    }
  }

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
          const viewportAspectRatio = dimensions.current.viewport.height / dimensions.current.viewport.width

          dimensions.current.aspectRatio = viewportAspectRatio
          const { resolution, scale } = dimensions.current

          const scaleX = Math.round((dimensions.current.viewport.width / width) * 100) / 100// / ar
          const scaleY = Math.round((dimensions.current.viewport.height / height) * 100) / 100

          dimensions.current.scale = Math.max(Math.min(scaleX, scaleY), 1)

          // const dpr = window.devicePixelRatio

          // dimensions.current.size = {
          //   width: Math.max(resolution.width * scale, resolution.width / dpr), 
          //   height: Math.max(resolution.height * scale, resolution.height / dpr)//height//dimensions.current.resolution.height*dimensions.current.scale
          // }
        }

        rescale()
      },
      rescale,
      recenter
    }
  }
}