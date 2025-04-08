import { Position } from "../types/types"

export const getRectWalls = (
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number,
): Array<Position> => {
  const row = Array.from({length: x2-x1+1}, (_, i) => x1 + i)
  const column = Array.from({length: y2-y1+1}, (_, i) => y1 + i)

  const horizontalWalls: Position[] = row.flatMap((x) => [{x, y: y1}, {x, y: y2}])
  const verticalWalls: Position[] = column.flatMap((y) => [{x: x1, y}, {x: x2, y}]) 

  return [...horizontalWalls, ...verticalWalls]
}