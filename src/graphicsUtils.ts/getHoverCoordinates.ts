export const getHoverCoordinates = (clientX: number, clientY: number, ctx: CanvasRenderingContext2D, canvasViewportConfig: any, toolSize: ToolSize) => {
  const { dimensions } = canvasViewportConfig
  const { left, top, width, height } = (ctx.canvas as HTMLCanvasElement).getBoundingClientRect()

  const scaleX = width / dimensions.width
  const scaleY = height / dimensions.height

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