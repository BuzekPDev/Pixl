import { Position } from "../types/types";

export class MovementTracker {
  lastPosition: Position | null = null;

  hasMoved (x: number, y: number) {
    if (x !== this.lastPosition?.x || y !== this.lastPosition?.y) {
      this.lastPosition = {x,y}
      return true
    }
    return false
  }
}