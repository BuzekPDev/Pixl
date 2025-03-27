import { Position } from "../hooks/useCanvasViewportConfig";

export class SelectionTracker {
  private startPosition: Position | null = null;
  private endPosition: Position | null = null;
  isTracking: boolean = false;
  shouldCommit: boolean = false;

  track (x: number, y: number) {
    this.isTracking = true;
    this.startPosition = {x,y};
    this.endPosition = {x,y};
  }

  update (x: number, y: number) {
    this.endPosition = {x,y};
  }

  finish () {
    this.shouldCommit = true;
  }

  untrack () {
    this.isTracking = false;
    this.startPosition = null;
    this.endPosition = null;
    this.shouldCommit = false;
  }

  getRectBounds () {
    if (!this.isTracking || 
      !this.startPosition || 
      !this.endPosition
    ) { 
      return null
    }
    
    return {
      x1: Math.min(this.startPosition.x, this.endPosition.x),
      y1: Math.min(this.startPosition.y, this.endPosition.y),
      x2: Math.max(this.startPosition.x, this.endPosition.x),
      y2: Math.max(this.startPosition.y, this.endPosition.y),
    }
  }
}