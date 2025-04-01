import { Dimensions } from "../hooks/useCanvasViewportConfig";

export type FrameData = {
  id: number;
  buffer: OffscreenCanvasRenderingContext2D
}

export class CanvasFrameManager {

  private frames: Array<FrameData> = [];
  private frameIndex: number = -1;
  private resolution: Dimensions = {width: 0, height: 0}
  private frameCount: number = 0

  size:number = 0 

  add () {
    const context = new OffscreenCanvas(this.resolution.width, this.resolution.height).getContext("2d")
    if (context) {
      this.frameCount++
      this.frames.push({buffer: context, id: this.frameCount})
      this.frameIndex = this.size
      this.size = this.frames.length
      return this.frames[this.size-1]
    }
  }

  delete (frameIndex: number) {
    if (this.size === 1) return
    this.frames.splice(frameIndex,1)
    this.size = this.frames.length

    if (this.frameIndex >= frameIndex) {
      this.frameIndex = Math.min(this.frameIndex - 1, this.size - 1)
    }
  }

  getFrame (frameIndex: number) {
    return this.frames[frameIndex]
  }

  getAllFrames () {
    return this.frames
  }

  setCurrent (frameIndex: number) {
    this.frameIndex = frameIndex;
  }

  getCurrent () {
    if (this.frameIndex === -1) return null
    return this.frames[this.frameIndex]
  }

  getIndex () {
    return this.frameIndex
  }

  async changeResolution ({width, height}: Dimensions) {
    // resize resets the context
    const frameData = this.frames.map(frame => frame.buffer.getImageData(0, 0, this.resolution.width, this.resolution.height))

    this.frames.forEach(frame => {
      frame.buffer.canvas.width = width
      frame.buffer.canvas.height = height
    })
    this.resolution = {width, height}

    // reapply imageData 
    frameData.forEach((frame, index) => this.frames[index].buffer.putImageData(frame, 0, 0))
  }

  getResolution () {
    return this.resolution
  }
}