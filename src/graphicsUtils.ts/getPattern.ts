export const getPattern = (startX: number, startY: number, gridSize: number, ctx: CanvasRenderingContext2D) => {
  
  const patternCanvas: HTMLCanvasElement = document.createElement('canvas');
  patternCanvas.width = gridSize * 2; // 2x2 grid of squares
  patternCanvas.height = gridSize * 2;

  const patternCtx = patternCanvas.getContext('2d') as CanvasRenderingContext2D;

  const remX = startX%8
  const remY = startY%8
  
  const getCoords = (n: number, mod: number) => {
    const coords = []
    while (n < gridSize) {
      const blockStart = n;
      let blockEnd;

      if (n === 0 && mod > 0) {
        blockEnd = mod;
      } else if (n === mod) {
        blockEnd = n + gridSize;
      } else {
        blockEnd = gridSize;
      }
    
      coords.push([blockStart, blockEnd]);
      n = blockEnd;
    }
    // if (mod !== 0) {
      coords.push([n, 16])
    // }
    return coords
  }

  const rows = getCoords(0, remX)
  const cols = getCoords(0, remY)

  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < cols.length; col++) {
      const x1 = cols[col][0]
      const x2 = cols[col][1]
      
      const y1 = rows[row][0]
      const y2 = rows[row][1]
      patternCtx.fillStyle = (col+row)%2 === 0 ? "red" : "blue"
      patternCtx.fillRect(x1,y1, Math.abs(x1-x2), Math.abs(y1-y2))
    }
  }

  return patternCanvas//ctx.createPattern(patternCanvas, "no-repeat")
}