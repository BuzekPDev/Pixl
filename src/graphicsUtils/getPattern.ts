export const getPattern = (gridSize: number) => {

  const patternCanvas: HTMLCanvasElement = document.createElement('canvas');
  patternCanvas.width = gridSize * 2;
  patternCanvas.height = gridSize * 2;

  const patternCtx = patternCanvas.getContext('2d') as CanvasRenderingContext2D;
  patternCtx.fillStyle = '#CCCCCC80';
  patternCtx.fillRect(0, 0, gridSize, gridSize);
  patternCtx.fillStyle = '#80808080';
  patternCtx.fillRect(gridSize, 0, gridSize, gridSize);
  patternCtx.fillStyle = '#80808080';
  patternCtx.fillRect(0, gridSize, gridSize, gridSize);
  patternCtx.fillStyle = '#CCCCCC80';
  patternCtx.fillRect(gridSize, gridSize, gridSize, gridSize);

  return patternCanvas
}