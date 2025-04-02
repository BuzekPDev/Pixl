import { FrameData } from "./CanvasFrameManager";

export class AnimationManager {

  images: Array<string> = []
  frameCounter: number = 0; // PLACEHOLDER NAME
  intervalId: number | null = null  

  async frameToObjectURL (frame: FrameData) {
    const blob = await frame.buffer.canvas.convertToBlob()
    const objectURL = URL.createObjectURL(blob) 
    return objectURL
  }

  async batchFramesToObjectURLs (frames: Array<FrameData>) {
    const blobs = await Promise.all(frames.map(async frame => frame.buffer.canvas.convertToBlob()))
    const objectURLs = blobs.map(blob => URL.createObjectURL(blob)) 
    return objectURLs
  }

  async saveFrameAsObjectURL (frame: FrameData) {
    // reserve the index synchronously to prevent wrong insertion order
    // due to a losing race condition
    const index = this.images.length
    this.images.push("")

    const objectURL = await this.frameToObjectURL(frame)
    this.images.splice(index, 1, objectURL)
  }

  async updateObjectURL (newFrame: FrameData, index: number) {
    if (index>=this.images.length) {
      return null
    }

    const updatedObjectURL = await this.frameToObjectURL(newFrame)
    const oldObjectURL = this.images.splice(index, 1, updatedObjectURL)
    
    URL.revokeObjectURL(oldObjectURL[0])
    return updatedObjectURL
  }

  async loadFramesAsObjectURLs (frames: Array<FrameData>) {
    // revoke previous if any exist
    this.images.forEach(objURL => URL.revokeObjectURL(objURL))
    
    const objectURLs = await this.batchFramesToObjectURLs(frames)
    this.images = objectURLs
    return objectURLs
  }

  deleteObjectURL (index: number) {
    if (index>=this.images.length || this.images.length === 1) {
      return
    }

    const deletedObjectURL = this.images.splice(index, 1)
    URL.revokeObjectURL(deletedObjectURL[0])
  }

  setIntervalId (id: number) {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
    }
    this.intervalId = id
  }

  pauseAnimation () {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
    }
  }


  // PLACEHOLDER NAMES

  getCurrentAnimationFrame () {
    return this.images[this.frameCounter]
  }

  tick () {
    const i = this.frameCounter

    this.frameCounter = i < this.images.length-1 ? i+1 : 0
  }
}