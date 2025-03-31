import { Position } from "../hooks/useCanvasViewportConfig";

export class CanvasActionManager {

  clicked: boolean = false;
  isHolding: boolean = false;
  isDragging: boolean = false;

  startPosition: Position = {x: 0, y: 0}
  endPosition: Position = {x: 0, y: 0}
  
  click () {
    this.clicked = true;
  }

  hold () {
    this.isHolding = true
  }

  release () {
    this.isHolding = false
  }

  startDrag (x: number, y: number) {
    this.isDragging = true
    this.startPosition = {x,y}
    this.endPosition = {x,y}
  }

  updateDrag (x: number, y: number) {
    this.endPosition = {x,y}
  }

  endDrag () {
    this.startPosition = {x: 0, y: 0}
    this.endPosition = {x: 0, y: 0}
    this.isDragging = false;
  }

  getRectBounds () {
    if (!this.isDragging) return null
    
    return {
      x1: Math.min(this.startPosition.x, this.endPosition.x),
      y1: Math.min(this.startPosition.y, this.endPosition.y),
      x2: Math.max(this.startPosition.x, this.endPosition.x),
      y2: Math.max(this.startPosition.y, this.endPosition.y),
    }
  }
}