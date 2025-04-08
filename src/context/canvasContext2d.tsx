import { createContext, PropsWithChildren, RefObject, useContext, useMemo, useRef, useState } from "react";
import { CanvasToolsConfig, SelectedTool, useCanvasToolsConfig } from "../hooks/useCanvasToolsConfig";
import { getHoverCoordinates, HoverCoordinates } from "../graphicsUtils/getHoverCoordinates";
import { ColorProcessor, RGBA } from "../classes/ColorProcessor";
import { useOffscreenBuffer } from "../hooks/useOffscreenBuffer";
import { floodFill } from "../graphicsUtils/floodFill";
import { getRectWalls } from "../graphicsUtils/getRectWalls";
import { FrameManagerApi, useCanvasFrameManager } from "../hooks/useCanvasFrameManager";
import { CanvasActionManager } from "../classes/CanvasActionManager";
import { Step } from "../classes/CanvasDrawStack";
import { getPattern } from "../graphicsUtils/getPattern";
import { drawLine } from "../graphicsUtils/drawLine";
import { CanvasViewportManager } from "../classes/CanvasViewportManager";
import { Dimensions, Position } from "../types/types";


export interface CanvasContext {
  setup: (args: CanvasSetup) => void,
  toolsController: ToolsController;
  canvasController: CanvasController;
  fileController: FileController;

  frameManager: FrameManagerApi;
  viewportManager: CanvasViewportManager;
  canvasToolsConfig: CanvasToolsConfig;
}

export interface ToolsController {
  clickAction: (clientX: number, clientY: number) => void;
  holdAction: (clientX: number, clientY: number) => void;
  startDragAction: (clientX: number, clientY: number) => void;
  updateDragAction: (clientX: number, clientY: number) => void;
  endHoldAction: (clientX: number, clientY: number) => void;
  endDragAction: (clientX: number, clientY: number) => void;

  resetMousePosition: () => void;
  undo: () => void;
  redo: () => void;
  zoom: (deltaY: number) => void
  selected: SelectedTool
}

export interface CanvasController {
  drawCanvas: (ctx?: CanvasRenderingContext2D, buffer?: OffscreenCanvasRenderingContext2D) => void;
  clearCanvas: () => void;
  drawTransparencyGrid: () => void;
  onionSkin: OnionSkinConfig;
  hoverMask: HoverMaskController;

  // theoretical for now
  changeResolution: (res: Dimensions) => void;
  resizeCanvas: (trueSize: Dimensions) => void;
  getCanvasDimensions: () => CanvasDimensions;
}

export interface CanvasSetup {
  canvasRef: RefObject<HTMLCanvasElement | null>,
  hoverOverlayCanvasRef: RefObject<HTMLCanvasElement | null>,
  transparencyGridCanvasRef: RefObject<HTMLCanvasElement | null>,
  onionSkinCanvasRef: RefObject<HTMLCanvasElement | null>,
  trueSize: Dimensions,
  resolution: Dimensions
}

// CONCEPT FOR BETTER DIMENSIONS
export interface CanvasDimensions {
  // the size of the actual canvas element
  trueSize: Dimensions;
  // viewport is the DRAWING AREA, not the full canvas
  // I confused those 2 back when I first wrote the camera system
  // oh to be young again, so full of life, woefully unaware of
  // the horrors yet to come. 
  viewport: Dimensions;
  // position from the top left of the canvas 
  viewportPosition: Position;
  aspectRatio: number;
  resolution: Dimensions;
  // the base scale factor of the viewport
  // please do integer scaling Im begging you morning me
  // or at least seperate zoom and scale in the zooming logic lol
  scale: number;
  zoom: number;
}

export interface FileController {
  importFile: (file: File) => void;
  exportGif: (name: string) => void;
  exportImage: (type: "png" | "jpeg", name: string) => void;
}

export interface OnionSkinConfig {
  isEnabled: boolean;
  toggle: () => void;
  draw: () => void;
  clear: () => void;
}

export interface HoverMaskController {
  draw: (clientX: number, clientY: number) => void;
  clear: () => void;
}

const canvasContext = createContext<CanvasContext | null>(null)

export const zoom = 1

export const CanvasProvider = ({
  children
}: PropsWithChildren<any>) => {

  // only needs to cause a rerender
  const [, setIsReady] = useState(false)


  const [onionSkin, setOnionSkin] = useState(false)

  // main tools 
  const canvasToolsConfig = useCanvasToolsConfig()
  const frameManager = useCanvasFrameManager()
  const viewportManager = useMemo(() => new CanvasViewportManager(), [])

  // utilities
  const colorProcessor = useMemo(() => new ColorProcessor(), [])
  const actionManager = useMemo(() => new CanvasActionManager(), [])

  // rendering context
  const canvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const hoverOverlayCanvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const transparencyGridCanvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const onionSkinCanvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const offscreenBuffer = useOffscreenBuffer()

  const { selectedTool, colors } = canvasToolsConfig

  const canvasUpdate = useRef({
    willDraw: false,
    willClear: false
  })

  const mouseCoordinates = useRef<{
    prevClientX: number,
    prevClientY: number
  } | null>(null)

  const scroll = useRef<{
    dir: number | null,
    scrolled: boolean
  }>({
    scrolled: false,
    dir: null
  })


  // CANVAS DRAWING

  const drawCanvas = (
    ctx: CanvasRenderingContext2D | null = canvasRenderingContext.current,
    buffer: OffscreenCanvasRenderingContext2D | null = frameManager.getCurrentFrame()?.buffer ?? null
  )  => {
    if (!ctx) {
      throw new Error("Set up the canvas first")
    }
    if (!buffer) {
      throw new Error("Buffer not ready")
    }

    const { viewportPosition, viewport, zoom } = viewportManager

    const { x, y } = viewportPosition
    const { width, height } = viewport

    ctx.drawImage(buffer.canvas,
      Math.floor(x),
      Math.floor(y),
      Math.floor(width) * zoom,
      Math.floor(height) * zoom
    )

    canvasUpdate.current.willDraw = false
  }

  const drawOnionSkin = async () => {
    if (!onionSkinCanvasRenderingContext.current) {
      throw new Error("Onion skin canvas not ready")
    }

    const ctx = onionSkinCanvasRenderingContext.current

    const onionSkinFrames = frameManager.getOnionSkinFrames()
    const count = onionSkinFrames.length

    onionSkinFrames.forEach((frame, i) => {
      const buffer = frame.buffer
      // decrease alpha based on distance from current frame
      const alphaValue = (1 / (count + 1)) * (i + 1)
      ctx.globalAlpha = alphaValue
      drawCanvas(ctx, buffer)
    })
  }

  const clearCanvas = (ctx: CanvasRenderingContext2D | null = canvasRenderingContext.current) => {
    if (!ctx) {
      throw new Error("Set up the canvas first")
    }

    const { viewportPosition, viewport, zoom } = viewportManager

    const { x, y } = viewportPosition
    const { width: drawingAreaWidth, height: drawingAreaHeight } = viewport

    ctx.clearRect(
      (x) - 1,
      (y) - 1,
      // adding 2 to prevent artifacts, 1 wasnt enough
      ((drawingAreaWidth) * zoom) + 2,
      ((drawingAreaHeight) * zoom) + 2
    )

    canvasUpdate.current.willClear = false
  }

  const clearOnionSkin = () => {
    if (!onionSkinCanvasRenderingContext.current) {
      throw new Error("Onion skin canvas not ready")
    }

    const ctx = onionSkinCanvasRenderingContext.current

    clearCanvas(ctx)
  }

  const drawTransparencyGrid = () => {
    if (!transparencyGridCanvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const { viewport, viewportPosition, trueSize, zoom } = viewportManager

    const { width, height } = viewport
    const { x, y } = viewportPosition

    const ctx = transparencyGridCanvasRenderingContext.current

    ctx.clearRect(0, 0, trueSize.width, trueSize.height)

    const gridSize = 8;

    const pattern = ctx.createPattern(getPattern(gridSize), 'repeat')
    ctx.fillStyle = pattern as CanvasPattern;
    ctx.fillRect(
      Math.floor(x),
      Math.floor(y),
      Math.floor(width) * zoom,
      Math.floor(height) * zoom
    );

  }

  const resizeBuffers = (width: number, height: number) => {
    if (!offscreenBuffer.hoverOverlayBuffer) {
      throw new Error("Hover overlay buffer not ready")
    }

    if (!offscreenBuffer.transparencyGridBuffer) {
      throw new Error("Transparency grid buffer not ready")
    }

    if (!onionSkinCanvasRenderingContext.current) {
      throw new Error("Onion skin canvas not ready")
    }

    const {
      hoverOverlayBuffer,
      transparencyGridBuffer
    } = offscreenBuffer

    hoverOverlayBuffer.canvas.width = width
    transparencyGridBuffer.canvas.width = width

    hoverOverlayBuffer.canvas.height = height
    transparencyGridBuffer.canvas.height = height

    drawTransparencyGrid()
    frameManager.changeResolution({ width, height })
    viewportManager.changeResolution({ width, height })
  }


  // ACTIONS 

  const clickAction = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current
    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const { viewportPosition, viewport, scale, zoom } = viewportManager
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, viewportPosition, viewport, scale, zoom, ctx, toolSize)

    if (hoverCoordinates.x === null || hoverCoordinates.y === null) {
      return
    }

    switch (canvasToolsConfig.selectedTool.name) {
      case "bucket": {
        bucketTool(hoverCoordinates)
        break;
      }
    }

    frameManager.updateFramePreview()
    frameManager.updateAnimationPreview()
  }

  const holdAction = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current
    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const { viewportPosition, viewport, scale, zoom } = viewportManager
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, viewportPosition, viewport, scale, zoom, ctx, toolSize)

    if (hoverCoordinates.x === null || hoverCoordinates.y === null) {
      return
    }

    actionManager.hold(hoverCoordinates.x, hoverCoordinates.y)

    if (actionManager.willDraw) return

    actionManager.willDraw = true

    requestAnimationFrame(() => {
      let updatedPixels: Array<Position> = [];
      let rgba: RGBA = [0, 0, 0, 0]

      switch (canvasToolsConfig.selectedTool.name) {
        case "pencil":
          [updatedPixels, rgba] = pencilTool(hoverCoordinates)
          break;
        case "eraser":
          [updatedPixels, rgba] = eraserTool(hoverCoordinates)
          break;
        case "hand":
          handTool(clientX, clientY)
          break;
      }

      actionManager.reposition()
      actionManager.willDraw = false

      // hand tool doesn't modify drawing area pixels
      // so just redraw the canvas 
      if (!updatedPixels.length) {
        drawCanvas()
        return
      }
      updateBuffer(updatedPixels, rgba)
    })
  }

  const startDragAction = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current
    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const { viewportPosition, viewport, scale, zoom } = viewportManager
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, viewportPosition, viewport, scale, zoom, ctx, toolSize)

    if (hoverCoordinates.x === null || hoverCoordinates.y === null) {
      return
    }

    // let updatedPixels: Array<Position> = [];
    // let rgba: RGBA = [0, 0, 0, 0]

    actionManager.startDrag(hoverCoordinates.x, hoverCoordinates.y)

    switch (canvasToolsConfig.selectedTool.name) {
      case "rect":
        clearHoverMask()
        rectTool(hoverCoordinates, "start")
    }
  }

  const updateDragAction = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current
    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const { viewportPosition, viewport, scale, zoom } = viewportManager
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, viewportPosition, viewport, scale, zoom, ctx, toolSize)

    if (hoverCoordinates.x === null || hoverCoordinates.y === null) {
      return
    }

    actionManager.updateDrag(hoverCoordinates.x, hoverCoordinates.y)
    // let updatedPixels: Array<Position> = [];
    // let rgba: RGBA = [0, 0, 0, 0]

    switch (canvasToolsConfig.selectedTool.name) {
      case "rect":
        rectTool(hoverCoordinates, "update")
    }
  }

  // might find a use for them eventually
  // eslint-disable-next-line
  const endHoldAction = (clientX: number, clientY: number) => {
    if (frameManager.willAddToStack()) {
      frameManager.updateFramePreview()
      frameManager.updateAnimationPreview()
    }
    frameManager.finishStep()
    actionManager.release()
  }

  const endDragAction = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current
    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const { viewportPosition, viewport, scale, zoom } = viewportManager
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, viewportPosition, viewport, scale, zoom, ctx, toolSize)

    if (hoverCoordinates.x === null || hoverCoordinates.y === null) {
      return
    }

    switch (canvasToolsConfig.selectedTool.name) {
      case "rect":
        rectTool(hoverCoordinates, "end")
    }

    actionManager.endDrag()
    frameManager.updateFramePreview()
    frameManager.updateAnimationPreview()
  }

  const updateBuffer = (pixels: Array<Position>, rgba: RGBA) => {

    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Attempting to update step on non-existent frame")
    }

    const { resolution } = viewportManager.getDimensions()
    const { width, height } = resolution

    const modifiedImageData = buffer.getImageData(0, 0, width, height).data
    const [r, g, b, a] = rgba // passed as an arg specifically for eraser

    // update imageData while creating the step data
    const step: Step = pixels.reduce((step: Step, { x, y }: Position) => {
      const index = (y * resolution.width + x) * 4

      // should be faster than arr.slice() since no overhead afaik
      const currentRGBA: RGBA = [
        modifiedImageData[index],
        modifiedImageData[index + 1],
        modifiedImageData[index + 2],
        modifiedImageData[index + 3],
      ]

      const difference = colorProcessor.getRGBDifference(currentRGBA, [r, g, b, a])

      // don't push to step if the difference is 0 0 0 0 (same exact color)
      if (difference[0] !== 0 ||
        difference[1] !== 0 ||
        difference[2] !== 0 ||
        difference[3] !== 0
      ) {
        modifiedImageData[index] = r
        modifiedImageData[index + 1] = g
        modifiedImageData[index + 2] = b
        modifiedImageData[index + 3] = a

        step.push({
          x,
          y,
          rgb: difference
        })
      }
      return step
    }, [])

    frameManager.updateStep(step)

    const modifiedImage = new ImageData(modifiedImageData, resolution.width, resolution.height)
    buffer.putImageData(modifiedImage, 0, 0)

    requestAnimationFrame(() => {
      clearCanvas()
      drawCanvas()
    })
  }

  const updateHoverOverlay = (pixels: Array<Position>, rgba: RGBA) => {
    const buffer = offscreenBuffer.hoverOverlayBuffer

    if (!buffer) {
      throw new Error("Hover overlay layer doesn't exist")
    }

    const { resolution } = viewportManager
    const { width, height } = resolution

    // reset to prevent artifacts
    buffer.clearRect(0, 0, resolution.width, resolution.height)

    const modifiedImageData = new ImageData(width, height)
    const [r, g, b, a] = rgba

    pixels.forEach(({ x, y }: Position) => {
      const index = (x + y * resolution.width) * 4

      modifiedImageData.data[index] = r
      modifiedImageData.data[index + 1] = g
      modifiedImageData.data[index + 2] = b
      modifiedImageData.data[index + 3] = a
    }, [])

    buffer.putImageData(modifiedImageData, 0, 0)

    requestAnimationFrame(() => {
      const ctx = hoverOverlayCanvasRenderingContext.current
      clearCanvas(ctx)
      drawCanvas(ctx, buffer)
    })
  }


  // CLICK TOOLS

  const bucketTool = (hoverCoordinates: HoverCoordinates) => {
    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const { resolution } = viewportManager.getDimensions()
    const { x, y } = hoverCoordinates
    const fillColor = colors.activePair[0]

    floodFill(x, y, fillColor, resolution, buffer, frameManager, colorProcessor)
    drawCanvas()
  }


  // HOVER TOOLS

  // add Bresenham's Line Algorithm/interpolation
  const pencilTool = (hoverCoordinates: HoverCoordinates): [Array<Position>, RGBA] => {

    const { toolSizeX } = hoverCoordinates
    const rgba = canvasToolsConfig.colors.activePair[0]

    const { x1, y1, x2, y2 } = actionManager.getCoordinates()

    const updatedPixels = drawLine(x1, y1, x2, y2, toolSizeX)

    return [updatedPixels, rgba]
  }

  const eraserTool = (hoverCoordinates: HoverCoordinates): [Array<Position>, RGBA] => {

    const { toolSizeX } = hoverCoordinates

    const { x1, y1, x2, y2 } = actionManager.getCoordinates()
    const rgba: RGBA = [0, 0, 0, 0]

    const updatedPixels = drawLine(x1, y1, x2, y2, toolSizeX);

    return [updatedPixels, rgba]
  }

  const handTool = (clientX: number, clientY: number) => {

    if (!canvasRenderingContext.current) {
      throw new Error("Unable to move undefined canvas context")
    }

    const { left, top } = canvasRenderingContext.current.canvas.getBoundingClientRect()
    const { viewportPosition } = viewportManager

    if (!mouseCoordinates.current) {
      mouseCoordinates.current = {
        prevClientX: clientX - left,
        prevClientY: clientY - top
      }
    }
    const { prevClientX, prevClientY } = mouseCoordinates.current

    const xDiff = (clientX - left) - prevClientX
    const yDiff = (clientY - top) - prevClientY

    const newX = viewportPosition.x + xDiff// * zoom
    const newY = viewportPosition.y + yDiff //* zoom

    mouseCoordinates.current = {
      prevClientX: clientX - left,
      prevClientY: clientY - top
    }

    requestAnimationFrame(() => {
      clearCanvas()
      clearOnionSkin()
      viewportManager.reposition({
        x: newX,
        y: newY
      })
      drawCanvas()
      drawTransparencyGrid()
      if (onionSkin) {
        drawOnionSkin()
      }
    })

    return
  }


  // DRAG TOOLS

  const rectTool = (hoverCoordinates: HoverCoordinates, stage: "start" | "update" | "end") => {

    const rectBounds = actionManager.getRectBounds()
    if (!rectBounds) return

    const { x1, y1, x2, y2 } = rectBounds
    const rectWalls = getRectWalls(x1, y1, x2, y2)

    const rgba = canvasToolsConfig.colors.activePair[0]

    switch (stage) {
      case "start": {
        updateHoverOverlay(rectWalls, rgba)
        break;
      }
      case "update": {
        updateHoverOverlay(rectWalls, rgba)
        break;
      }
      case "end": {
        updateBuffer(rectWalls, rgba)
        frameManager.finishStep()
        break;
      }
    }
  }


  const hoverMask = (clientX: number, clientY: number) => {
    if (!hoverOverlayCanvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    if (!offscreenBuffer.hoverOverlayBuffer) {
      throw new Error("Hover overlay buffer not ready")
    }

    const ctx = hoverOverlayCanvasRenderingContext.current
    const buffer = offscreenBuffer.hoverOverlayBuffer

    const { trueSize, viewportPosition, viewport, resolution, scale, zoom } = viewportManager
    const { width: viewportWidth, height: viewportHeight } = trueSize
    const { width: bufferWidth, height: bufferHeight } = resolution

    ctx.clearRect(0, 0, viewportWidth, viewportHeight)
    buffer.clearRect(0, 0, bufferWidth, bufferHeight)

    const toolSize = canvasToolsConfig[selectedTool.name].width

    const {
      x,
      y,
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, viewportPosition, viewport, scale, zoom, ctx, toolSize)

    if (x === null || y === null) {
      actionManager.release()
      return
    }

    buffer.fillStyle = "rgba(0, 0, 0, 0.3)"
    buffer.fillRect(x, y, toolSizeX, toolSizeY)

    drawCanvas(ctx, buffer)
  }

  const clearHoverMask = () => {
    if (!hoverOverlayCanvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = hoverOverlayCanvasRenderingContext.current
    const { width, height } = ctx.canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
  }

  const undo = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    if (canvasUpdate.current.willClear || canvasUpdate.current.willDraw) {
      return
    }

    const { resolution } = viewportManager.getDimensions()
    const { width: bufferWidth, height: bufferHeight } = resolution

    const previousFrame = frameManager.undo();

    if (!previousFrame) return

    const modifiedImageData = buffer.getImageData(0, 0, bufferWidth, bufferHeight).data

    for (let i = 0; i < previousFrame.length; i++) {
      const { x, y, rgb } = previousFrame[i];

      const bufferIndex = (y * bufferWidth + x) * 4;

      const currentColor: RGBA = [
        modifiedImageData[bufferIndex],
        modifiedImageData[bufferIndex + 1],
        modifiedImageData[bufferIndex + 2],
        modifiedImageData[bufferIndex + 3]
      ]
      const [r, g, b, a] = colorProcessor.revertRGBADifference(currentColor, rgb)
      modifiedImageData[bufferIndex] = r
      modifiedImageData[bufferIndex + 1] = g
      modifiedImageData[bufferIndex + 2] = b
      modifiedImageData[bufferIndex + 3] = a
    }

    const modifiedImage = new ImageData(modifiedImageData, bufferWidth, bufferHeight)
    buffer.putImageData(modifiedImage, 0, 0)

    canvasUpdate.current.willClear = true
    canvasUpdate.current.willDraw = true

    requestAnimationFrame(() => {
      clearCanvas()
      drawCanvas()
      frameManager.updateFramePreview()
      frameManager.updateAnimationPreview()
    })
  }

  const redo = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    if (canvasUpdate.current.willClear || canvasUpdate.current.willDraw) {
      return
    }

    const { resolution } = viewportManager.getDimensions()
    const { width: bufferWidth, height: bufferHeight } = resolution

    const nextFrame = frameManager.redo();
    if (!nextFrame) return

    const modifiedImageData = buffer.getImageData(0, 0, bufferWidth, bufferHeight).data

    for (let i = 0; i < nextFrame.length; i++) {
      const { x, y, rgb } = nextFrame[i];

      const bufferIndex = (y * bufferWidth + x) * 4;

      const currentColor: RGBA = [
        modifiedImageData[bufferIndex],
        modifiedImageData[bufferIndex + 1],
        modifiedImageData[bufferIndex + 2],
        modifiedImageData[bufferIndex + 3]
      ]

      const [r, g, b, a] = colorProcessor.applyRGBADifference(currentColor, rgb)

      modifiedImageData[bufferIndex] = r
      modifiedImageData[bufferIndex + 1] = g
      modifiedImageData[bufferIndex + 2] = b
      modifiedImageData[bufferIndex + 3] = a
    }

    const modifiedImage = new ImageData(modifiedImageData, bufferWidth, bufferHeight)
    buffer.putImageData(modifiedImage, 0, 0)

    canvasUpdate.current.willClear = true
    canvasUpdate.current.willDraw = true

    requestAnimationFrame(() => {
      clearCanvas()
      drawCanvas()
      frameManager.updateFramePreview()
      frameManager.updateAnimationPreview()
    })
  }

  const zoom = (deltaY: number) => {

    if (canvasUpdate.current.willClear || canvasUpdate.current.willDraw) return

    if (scroll.current.scrolled) {
      return
    }

    const zoomAmount = Math.sign(deltaY) * 0.05 // 5% zoom
    const { zoom, viewportPosition, viewport, resolution } = viewportManager.getDimensions()

    scroll.current.scrolled = true
    canvasUpdate.current.willClear = true
    canvasUpdate.current.willDraw = true

    requestAnimationFrame(() => {
      scroll.current.scrolled = false

      const anchorX = viewportPosition.x + ((viewport.width * zoom) / 2)//trueSize.width / 2
      const anchorY = viewportPosition.y + ((viewport.height * zoom) / 2)//trueSize.height / 2

      const scaleFactor = zoom - zoomAmount

      if (viewport.width * scaleFactor < resolution.width ||
        viewport.height * scaleFactor < resolution.height
      ) {
        canvasUpdate.current.willClear = false
        canvasUpdate.current.willDraw = false
        return
      }

      clearCanvas()
      clearOnionSkin()

      viewportManager.zoom = scaleFactor

      viewportManager.reposition({
        x: anchorX + (viewportPosition.x - anchorX) * (scaleFactor / zoom),
        y: anchorY + (viewportPosition.y - anchorY) * (scaleFactor / zoom)
      })
      drawCanvas()
      drawTransparencyGrid()

      if (onionSkin) {
        drawOnionSkin()
      }
    })
  }

  const toggleOnionSkin = () => {
    if (onionSkin) {
      setOnionSkin(false)
      clearOnionSkin()
    } else {
      setOnionSkin(true)
      drawOnionSkin()
    }
  }

  const changeResolution = (res: Dimensions) => {
    clearCanvas()
    clearOnionSkin()
    viewportManager.changeResolution(res)
    resizeBuffers(res.width, res.height)
    drawCanvas()
    if (onionSkin) {
      drawOnionSkin()
    }
  }

  const resetMousePosition = () => {
    mouseCoordinates.current = null
    actionManager.release()
  }

  const getCanvasDimensions = () => {
    return viewportManager.getDimensions()
  }

  const resizeCanvas = (trueSize: Dimensions) => {
    viewportManager.changeTrueSize(trueSize)
  }

  const importGif = async (gif: File) => {
    const buffer = await gif.arrayBuffer()
    // get gif frames & res
    const { width, height, frameData } = await frameManager.decodeGif(buffer)
    
    // change resolution to gif res
    clearCanvas()
    clearOnionSkin()
    resizeBuffers(width, height)

    // center viewport so it's fully visible when loaded
    viewportManager.rescale()
    viewportManager.center()

    // add each frame to the frame stack and undo metastack
    frameData.forEach(async (frame) => {
      const added = frameManager.addFrame()
      const imageData = new ImageData(frame, width, height)
      added?.buffer.putImageData(imageData, 0, 0)
    })

    // load the frames in the animation preview
    frameManager.loadFullAnimation()
    drawCanvas()
    drawTransparencyGrid()
  }

  const importImage = async (image: File) => {
    const objectURL = URL.createObjectURL(image)
    const img = new Image()
    clearCanvas()
    clearOnionSkin()

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      frameManager.deleteAllFrames()
      resizeBuffers(width,height)

      viewportManager.rescale()
      viewportManager.center()

      const frame = frameManager.addFrame()

      frame?.buffer.drawImage(img, 0, 0)

      drawCanvas()
      drawTransparencyGrid()
      frameManager.updateAnimationPreview()
    }

    img.src = objectURL
  }

  const importFile = (file: File) => {
    switch (true) {
      case /^image\/gif$/.test(file.type):
        importGif(file)
        break;
      case /^image\/(jpg|png|jpeg)$/.test(file.type):
        importImage(file)
        break;
      default: 
        alert("Unsupported file type.")
    }
  }

  // TODO 

  // HIGH PRIORITY (in order)
  // export/import file system for images AND gifs - DONE
  // UI 
  // pinch-to-zoom on touchscreen devices
  // deploy

  // MID PRIORITY (out of order)
  // color palette (the system itself is mostly ready, I just can't decide on the ui design)
  // drawing optimization, prevent redraws on movement with no coordinate change 
  // fix hand tool out of bounds issue
  // fix hand tool snap-to-cursor issue
  // limit draw stack depth
  
  // LOW PRIORITY
  // adjust position on window resize/zoom instead of resetting it

  return (
    <canvasContext.Provider
      value={{
        setup: ({
          canvasRef,
          hoverOverlayCanvasRef,
          transparencyGridCanvasRef,
          onionSkinCanvasRef,
          trueSize,
          resolution,
        }) => {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D
            canvasRenderingContext.current = ctx
            ctx.imageSmoothingEnabled = false
          }
          if (hoverOverlayCanvasRef.current) {
            const ctx = hoverOverlayCanvasRef.current.getContext("2d") as CanvasRenderingContext2D
            hoverOverlayCanvasRenderingContext.current = ctx
            ctx.imageSmoothingEnabled = false
          }
          if (onionSkinCanvasRef.current) {
            const ctx = onionSkinCanvasRef.current.getContext("2d") as CanvasRenderingContext2D
            onionSkinCanvasRenderingContext.current = ctx
            ctx.imageSmoothingEnabled = false
          }
          if (transparencyGridCanvasRef.current) {
            const ctx = transparencyGridCanvasRef.current.getContext("2d") as CanvasRenderingContext2D
            transparencyGridCanvasRenderingContext.current = ctx
            ctx.imageSmoothingEnabled = false
          }
          if (!frameManager.size()) {
            frameManager.changeResolution(resolution)
            frameManager.addFrame()
            resizeBuffers(resolution.width, resolution.height)
          }
          setIsReady(true)
          drawCanvas()

          viewportManager.changeTrueSize(trueSize)
        },
        frameManager,
        canvasToolsConfig,
        viewportManager,

        // refactored api
        toolsController: {
          clickAction,
          holdAction,
          startDragAction,
          updateDragAction,
          endHoldAction,
          endDragAction,
          resetMousePosition,

          undo,
          redo,
          zoom,
          selected: selectedTool
        },
        canvasController: {
          drawCanvas,
          clearCanvas,
          drawTransparencyGrid,
          changeResolution,
          getCanvasDimensions,
          resizeCanvas,
          hoverMask: {
            draw: hoverMask,
            clear: clearHoverMask,
          },
          onionSkin: {
            isEnabled: onionSkin,
            toggle: toggleOnionSkin,
            draw: drawOnionSkin,
            clear: clearOnionSkin
          }
        },
        fileController: {
          importFile,
          exportGif: frameManager.exportAsGif,
          exportImage: frameManager.exportAsImage
        }
      }}
    >
      {children}
    </canvasContext.Provider>
  )
}

export const useCanvasApi = () => {
  const canvasApi = useContext(canvasContext)
  if (!canvasApi) {
    throw new Error("Canvas context is empty")
  }
  return canvasApi
}