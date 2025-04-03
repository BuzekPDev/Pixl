import { Dimensions, Position } from "../types/types"

export const getHoverCoordinates = (
  clientX: number, 
  clientY: number, 
  position: Position,
  size: Dimensions,
  scale: number,
  zoom: number,
  ctx: CanvasRenderingContext2D, 
  toolSize: ToolSize
) => {
  const { left, top } = (ctx.canvas as HTMLCanvasElement).getBoundingClientRect()

  const {x: drawingAreaX, y: drawingAreaY } = position

  const localX =  (clientX - left) - (drawingAreaX)
  const localY = (clientY - top) - (drawingAreaY)

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

  const relativeClientX = Math.floor(((localX) / scale) / zoom)
  const x = Math.floor((relativeClientX)-Math.floor(toolSize/2)) 

  const relativeClientY = Math.floor(((localY) / scale) / zoom)
  const y = Math.floor((relativeClientY)-Math.floor(toolSize/2))
  
  return {
    x: x,
    y: y,
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