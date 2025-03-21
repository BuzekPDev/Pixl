import { RGBA } from "./ColorProcessor";

export type PixelData = {
  x: number;
  y: number;
  rgb: RGBA;
} 

export class CanvasDrawStack {

  stack: Array<Array<PixelData>> = [];
  index: number = -1;
  currentStroke: Array<PixelData> = [];

  push (pixel: PixelData) {
    const [r, g, b, a] = pixel.rgb
    // prevent overdraw
    // rgba is 0 0 0 0 if no color or opacity change
    if (r + g + b + a === 0) return 

    this.currentStroke.push(pixel)
  }

  commit () {
    if (!this.currentStroke.length) return

    this.stack = this.stack.slice(0, this.index+1)

    this.stack.push(this.currentStroke)
    this.currentStroke = []
    this.index = this.stack.length-1
  }

  getCurrent () {
    if (this.index !== -1) {
      return this.stack[this.index]
    }
  }

  undo () {
    if (this.index >= 0) {
      this.index--
      return this.stack[this.index+1]
    }
    return null
  }

  redo () {
    if (this.index < this.stack.length - 1) { 
      this.index++
      return this.stack[this.index]
    }
    return null
  }

  debug () {
    return {
      stack: this.stack,
      stroke: this.currentStroke
    }
  }
} 