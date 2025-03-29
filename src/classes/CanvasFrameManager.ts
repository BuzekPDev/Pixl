import { Dimensions } from "../hooks/useCanvasViewportConfig";

export class CanvasFrameManager {

  private frames: Array<OffscreenCanvasRenderingContext2D> = [];
   resolution: Dimensions = {width: 0, height: 0}

  size:number = 0 

  add () {
    const context = new OffscreenCanvas(this.resolution.width, this.resolution.height).getContext("2d")
    if (context) {
      this.frames.push(context)
    }
    this.size = this.frames.length
  }

  delete (frameIndex: number) {
    this.frames.splice(frameIndex,1)
    this.size = this.frames.length
  }

  getFrame (frameIndex: number) {
    return this.frames[frameIndex]
  }

  async changeResolution ({width, height}: Dimensions) {
    // resize resets the context
    const frameData = this.frames.map(frame => frame.getImageData(0, 0, this.resolution.width, this.resolution.height))

    this.frames.forEach(frame => {
      frame.canvas.width = width
      frame.canvas.height = height
    })
    this.resolution = {width, height}

    // reapply imageData 
    frameData.forEach((frame, index) => this.frames[index].putImageData(frame, 0, 0))
  }
}