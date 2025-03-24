import { Dimensions, Position } from "../hooks/useCanvasViewportConfig"

export const getHoverCoordinates = (
  clientX: number, 
  clientY: number, 
  position: Position,
  size: Dimensions,
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
    localX > (size.width * zoom) || 
    localY > (size.height * zoom)
  ) {
    console.debug("OOB")
    return {
      x: null,
      y: null,
      toolSizeX: toolSize,
      toolSizeY: toolSize
    }
  }

  const relativeClientX = Math.floor(((localX) / 4) / zoom)
  const x = Math.floor((relativeClientX)-Math.floor(toolSize/2)) 

  const relativeClientY = Math.floor(((localY) / 4) / zoom)
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