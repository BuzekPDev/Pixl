import { CanvasDimensions } from "../hooks/useCanvasViewportConfig"

export const getHoverCoordinates = (clientX: number, clientY: number, dimensions: CanvasDimensions, ctx: CanvasRenderingContext2D, toolSize: ToolSize) => {
  const { aspectRatio } = dimensions;
  const { left, top, width, height } = (ctx.canvas as HTMLCanvasElement).getBoundingClientRect()

  const relativeClientX = Math.floor((clientX - left) * (dimensions.width / width))
  const relativeClientY = Math.floor((clientY - top) * ((dimensions.height) / height))

  const x = Math.floor((relativeClientX)-Math.floor(toolSize/2)) 
  const y = Math.floor((relativeClientY)-Math.floor(toolSize/2))
  
  return {
    x,
    y,
    toolSizeX: toolSize,
    toolSizeY: toolSize
  }
}

export interface HoverCoordinates {
  x: number,
  y: number,
  toolSizeX: ToolSize;
  toolSizeY: ToolSize;
}

export type ToolSize = number