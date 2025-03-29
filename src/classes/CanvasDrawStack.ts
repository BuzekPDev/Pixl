import { RGBA } from "./ColorProcessor";

export type PixelData = {
  x: number;
  y: number;
  rgb: RGBA;
} 

export type Step = Array<PixelData>

export type Stack = Array<Step>

export type MetaStack = Array<{
  stack: Stack;
  index: number
}>

export class CanvasDrawStack {

  private metaStack: MetaStack = [];
  private metaStackIndex: number = -1;
  private step: Step = [];

  push (stepData: Step) {
    this.step = this.step.concat(stepData)
  }

  commit () {
    if (!this.step.length || this.metaStackIndex === -1) return

    const frame = this.metaStack[this.metaStackIndex]

    // overwrite future steps if commiting after undo 
    frame.stack = frame.stack.slice(0, frame.index+1) 

    frame.stack.push(this.step)
    frame.index = frame.stack.length-1
    this.step = []
  }

  setCurrentStack (metaStackIndex: number) {
    this.metaStackIndex = metaStackIndex
  } 

  getCurrentStep () {
    if (this.metaStackIndex === -1) return null
    const frame = this.metaStack[this.metaStackIndex]

    if (frame.index !== -1) {
      return frame.stack[frame.index]
    }
    return null
  }

  deleteStack (metaStackIndex: number) {
    this.metaStack.splice(metaStackIndex, 1)

    if (this.metaStackIndex >= metaStackIndex) {
      this.metaStackIndex = Math.min(this.metaStackIndex-1, this.metaStack.length-1)
    }
  }

  addStack () {
    this.metaStack.push({
      stack: [],
      index: 0
    })
    this.metaStackIndex = this.metaStack.length-1
  }

  undo () {
    if (this.metaStackIndex === -1) return null
    const frame = this.metaStack[this.metaStackIndex]

    if (frame.index >= 0) {
      // return the CURRENT frame to revert the frame delta
      return frame.stack[frame.index--]
    }
    return null
  }

  redo () {
    if (this.metaStackIndex === -1) return null
    const frame = this.metaStack[this.metaStackIndex]

    if (frame.index < frame.stack.length - 1) { 
      // return the NEXT frame to apply the frame delta
      return frame.stack[++frame.index]
    }
    return null
  }

  debug () {
    return {
      metaStack: this.metaStack,
      stroke: this.step,
      currentStack: this.metaStack[this.metaStackIndex]
    }
  }
} 