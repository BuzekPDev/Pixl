
// stroke-based methods like strokeRect are anti-aliased 
// and I can't get them to draw sharp 1px wide lines
export const drawRect = (
  buffer: OffscreenCanvasRenderingContext2D, 
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number,
  lineWidth: number = 1
) => {
  const width = x2 - x1
  const height = y2 - y1
  buffer.fillRect(x1, y1, width, lineWidth)
  buffer.fillRect(x1, y2, width+lineWidth, lineWidth)
  buffer.fillRect(x1, y1+1, lineWidth, height-1)
  buffer.fillRect(x2, y1, lineWidth, height)
}

export interface RectBounds {
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number,
}