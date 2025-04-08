import { Position } from "../types/types";

export const drawLine = (x1: number, y1: number, x2: number, y2: number, toolSize: number) => {
  const lineCoords: Array<{ x: number; y: number }> = [];

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const xDir = x1 < x2 ? 1 : -1;
  const yDir = y1 < y2 ? 1 : -1;

  let d = dx - dy;

  while (true) {
    drawPixels(x1, y1, toolSize, lineCoords); 

    if (x1 === x2 && y1 === y2) break;

    const e2 = 2 * d;
    if (e2 > -dy) {
      d -= dy;
      x1 += xDir;
    }
    if (e2 < dx) {
      d += dx;
      y1 += yDir;
    }
  }

  return lineCoords;
};

const drawPixels = (cx: number, cy: number, toolSize: number, lineCoords: Array<Position>) => {
  for (let dx = 0; dx < toolSize; dx++) {
    for (let dy = 0; dy < toolSize; dy++) {
      lineCoords.push({ x: cx + dx, y: cy + dy });
    }
  }
};