import { CanvasDimensions } from "../hooks/useCanvasViewportConfig"

export const getHoverCoordinates = (clientX: number, clientY: number, dimensions: CanvasDimensions, ctx: CanvasRenderingContext2D, toolSize: ToolSize) => {
  const {scaleX, scaleY} = dimensions;
  const { left, top, width, height } = (ctx.canvas as HTMLCanvasElement).getBoundingClientRect()

  const relativeClientX = Math.floor((clientX - left) * (dimensions.width / width))
  const relativeClientY = Math.floor((clientY - top) * (dimensions.height / height))

  const x = Math.floor(relativeClientX-Math.floor(toolSize/2)) * scaleX;
  const y = Math.floor(relativeClientY-Math.floor(toolSize/2)) * scaleY;

  const toolSizeX = toolSize * scaleX
  const toolSizeY = toolSize * scaleY;

  return {
    x,
    y,
    toolSizeX,
    toolSizeY
  }
}

export interface HoverCoordinates {
  x: number,
  y: number,
  toolSizeX: ToolSize;
  toolSizeY: ToolSize;
}

export type ToolSize = number