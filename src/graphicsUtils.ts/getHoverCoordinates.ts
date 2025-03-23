import { Position } from "../hooks/useCanvasViewportConfig"

export const getHoverCoordinates = (
  clientX: number, 
  clientY: number, 
  position: Position,
  aspectRatio: number,
  zoom: number,
  ctx: CanvasRenderingContext2D, 
  toolSize: ToolSize
) => {
  const { left, top } = (ctx.canvas as HTMLCanvasElement).getBoundingClientRect()

  const {x: drawingAreaX, y: drawingAreaY } = position

  const localX =  (clientX - left) - (drawingAreaX / zoom)
  const localY = (clientY - top) - (drawingAreaY / zoom)

  // terminate early if outside of drawing area
  if (localX < 0 || 
    localY < 0 || 
    localX > ((640 / aspectRatio) * zoom) || 
    localY > (640 * zoom)
  ) {
    return {
      x: null,
      y: null,
      toolSizeX: toolSize,
      toolSizeY: toolSize
    }
  }

  const relativeClientX = Math.floor(((localX) * ((64/aspectRatio) / (640/aspectRatio))) / zoom)
  const x = Math.floor((relativeClientX)-Math.floor(toolSize/2)) 

  const relativeClientY = Math.floor(((localY) * ((64/aspectRatio) / (640/aspectRatio))) / zoom)
  const y = Math.floor((relativeClientY)-Math.floor(toolSize/2))

  return {
    x: Math.floor(x),
    y: Math.floor(y),
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