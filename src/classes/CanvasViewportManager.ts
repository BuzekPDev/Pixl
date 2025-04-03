import { Dimensions, Position } from "../types/types";

export class CanvasViewportManager {

  initialized: boolean = true

  trueSize: Dimensions = { width: 0, height: 0 };
  viewport: Dimensions = { width: 0, height: 0 };
  // position from the top left of the canvas 
  viewportPosition: Position = { x: 0, y: 0 };
  aspectRatio: number = 1;
  resolution: Dimensions = { width: 32, height: 32 };
  scale: number = 1;
  zoom: number = 1;

  getDimensions () {
    return {
      trueSize: this.trueSize,
      viewport: this.viewport,
      viewportPosition: this.viewportPosition,
      aspectRatio: this.aspectRatio,
      resolution: this.resolution,
      scale: this.scale,
      zoom: this.zoom
    }
  }

  rescale () {
    const scaleX = this.trueSize.width / this.resolution.width
    const scaleY = this.trueSize.height / this.resolution.height

    this.scale = Math.max(Math.min(scaleX, scaleY), 1)

    this.viewport = {
      width: this.resolution.width * this.scale,
      height: this.resolution.height * this.scale
    }

  }

  center () {
    
    let newPos: Position;

    if (this.trueSize.width > this.trueSize.height) {
      newPos = {
        x: (this.trueSize.width - this.viewport.width) / 2,
        y: 0
      }
    } else {
      newPos = {
        x: 0,
        y: (this.trueSize.height - this.viewport.height) / 2 
      }
    }

    this.viewportPosition = newPos
  }

  changeResolution (res: Dimensions) {
    this.resolution = {
      width: res.width,
      height: res.height
    }
    this.viewport = {
      width: res.width * this.scale,
      height: res.height * this.scale
    }
  }

  reposition (pos: Position) {
    this.viewportPosition = pos
  }

  changeTrueSize (trueSize: Dimensions) {
    this.trueSize = trueSize

    // LOW PRIORITY
    // add something to adjust pos on true change in case of window
    // resize or window zoom  
    this.rescale()
    this.center()

    console.debug(this.getDimensions())
  }
}
