import { ImageType } from "../types/types";
import { FrameData } from "./CanvasFrameManager";

export class AnimationManager {

  images: Array<string> = []
  frameCounter: number = 0; // PLACEHOLDER NAME
  intervalId: number | null = null  

  async blobToBase64PNG (blob: Blob): Promise<string> {
    return new Promise(res => {
      const reader = new FileReader()
      reader.onload = () => {
        if (!reader.result || typeof reader.result !== "string") {
          throw new Error("Something went wrong while loading frame")
        }
        res(reader.result)
      } 
      reader.readAsDataURL(blob)
    })
  }

  async frameToBase64image (frame: FrameData, type: ImageType) {
      const blob = await frame.buffer.canvas.convertToBlob({type: `image/${type}`})
      const png = await this.blobToBase64PNG(blob)
      return png
  }

  async batchFramesToBase64images (frames: Array<FrameData>, type: ImageType) {
    const blobs = await Promise.all(frames.map(async frame => frame.buffer.canvas.convertToBlob({type: `image/${type}`})))
    const pngs = await Promise.all(blobs.map(blob => this.blobToBase64PNG(blob))) 
    return pngs
  }

  async saveFrameAsBase64PNG (frame: FrameData) {
    // reserve the index synchronously to prevent wrong insertion order
    // due to a losing race condition
    const index = this.images.length
    this.images.push("")

    const png = await this.frameToBase64image(frame, "png")
    this.images.splice(index, 1, png)
  }

  async updateBase64PNG (newFrame: FrameData, index: number) {
    if (index>=this.images.length) {
      return null
    }

    const updatedBase64PNG = await this.frameToBase64image(newFrame, "png")
    this.images.splice(index, 1, updatedBase64PNG)
    return updatedBase64PNG
  }

  async loadFramesAsBase64PNGs (frames: Array<FrameData>) {
    this.images = await this.batchFramesToBase64images(frames, "png")
  }

  deleteBase64PNG (index: number) {
    if (index>=this.images.length || this.images.length === 1) {
      return
    }

    const deletedPNG = this.images.splice(index, 1)
    return deletedPNG
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

  getCurrentAnimationFrame () {
    return this.images[this.frameCounter]
  }

  tick () {
    const i = this.frameCounter

    this.frameCounter = i < this.images.length-1 ? i+1 : 0
  }
}