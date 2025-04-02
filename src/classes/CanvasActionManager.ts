import { Position } from "../hooks/useCanvasViewportConfig";

export class CanvasActionManager {

  clicked: boolean = false;
  isHolding: boolean = false;
  isDragging: boolean = false;

  willDraw: boolean = false;

  startPosition: Position = {x: -1, y: -1}
  endPosition: Position = {x: -1, y: -1}
  
  click () {
    this.clicked = true;
  }

  hold (x: number, y: number) {
    if (!this.isHolding) {
      this.startPosition.x = x;
      this.startPosition.y = y;
      this.isHolding = true;
    }
    this.endPosition.x = x;
    this.endPosition.y = y;
  }

  reposition () {
    this.startPosition = {...this.endPosition}
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

  hasMoved () {
    return this.startPosition.x !== this.endPosition.x || this.startPosition.y !== this.endPosition.y
  }

  // returns raw coordinates 
  getCoordinates () {
    return {
      x1: this.startPosition.x,
      y1: this.startPosition.y,
      x2: this.endPosition.x,
      y2: this.endPosition.y
    }
  }
}