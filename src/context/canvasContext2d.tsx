import { createContext, PropsWithChildren, RefObject, useContext, useMemo, useRef, useState } from "react";
import { CanvasToolsConfig, SelectedTool, useCanvasToolsConfig } from "../hooks/useCanvasToolsConfig";
import { CanvasDimensions, CanvasViewportConfig, Dimensions, Position, useCanvasViewportConfig } from "../hooks/useCanvasViewportConfig";
import { getHoverCoordinates, HoverCoordinates } from "../graphicsUtils/getHoverCoordinates";
import { ColorProcessor, RGBA } from "../classes/ColorProcessor";
import { useOffscreenBuffer } from "../hooks/useOffscreenBuffer";
import { floodFill } from "../graphicsUtils/floodFill";
import { MovementTracker } from "../classes/MovementTracker";
import { SelectionTracker } from "../classes/SelectionTracker";
import { getRectWalls } from "../graphicsUtils/getRectWalls";
import { FrameManagerApi, useCanvasFrameManager } from "../hooks/useCanvasFrameManager";
import { CanvasActionManager } from "../classes/CanvasActionManager";
import { Step } from "../classes/CanvasDrawStack";
import { getPattern } from "../graphicsUtils/getPattern";
import { drawLine } from "../graphicsUtils/drawLine";

export interface CanvasContext {
  setup: (
    canvasRef: RefObject<HTMLCanvasElement | null>,
    hoverOverlayCanvasRef: RefObject<HTMLCanvasElement | null>,
    transparencyGridCanvasRef: RefObject<HTMLCanvasElement | null>,
    onionSkinCanvasRef: RefObject<HTMLCanvasElement | null>,
    viewport: Dimensions,
    size: Dimensions,
    position: Position,
    resolution: Dimensions
  ) => void,
  changeDimensions: // this one's getting SO refactored
  <K extends keyof CanvasDimensions>
    (dims: Record<K, CanvasDimensions[K]>) => void;


  toolsController: ToolsController;
  canvasController: CanvasController;

  resetMousePosition: () => void
  frameManager: FrameManagerApi;
  canvasToolsConfig: CanvasToolsConfig;
  canvasViewportConfig: CanvasViewportConfig;
}

export interface ToolsController {
  
  clickAction: (clientX: number, clientY: number) => void;
  holdAction: (clientX: number, clientY: number) => void;
  startDragAction: (clientX: number, clientY: number) => void;
  updateDragAction: (clientX: number, clientY: number) => void;
  endHoldAction: (clientX: number, clientY: number) => void;
  endDragAction: (clientX: number, clientY: number) => void;

  undo: () => void;
  redo: () => void;
  zoom: (deltaY: number) => void
  selected: SelectedTool
}

export interface CanvasController {
  drawCanvas: () => void;
  clearCanvas: () => void;
  drawTransparencyGrid: () => void;
  onionSkin: OnionSkinConfig;
  hoverMask: HoverMaskController;
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
  const canvasViewportConfig = useCanvasViewportConfig()
  const frameManager = useCanvasFrameManager()

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

  const drawCanvas = (args: {
    ctx: CanvasRenderingContext2D | null,
    buffer: OffscreenCanvasRenderingContext2D | null
  } = {
      ctx: canvasRenderingContext.current,
      buffer: frameManager.getCurrentFrame()?.buffer ?? null
    }) => {
    const { ctx, buffer } = args

    if (!ctx) {
      throw new Error("Set up the canvas first")
    }
    if (!buffer) {
      throw new Error("Buffer not ready")
    }

    const { position, size } = canvasViewportConfig.dimensions.ref.current

    const { x, y } = position
    const { width: drawingAreaWidth, height: drawingAreaHeight } = size

    ctx.drawImage(buffer.canvas,
      Math.floor(x),
      Math.floor(y),
      Math.floor(drawingAreaWidth),
      Math.floor(drawingAreaHeight)
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
      const alphaValue = (1/(count+1)) * (i+1)
      ctx.globalAlpha = alphaValue
      drawCanvas({ctx, buffer})
    })
  }

  const clearCanvas = (ctx: CanvasRenderingContext2D | null = canvasRenderingContext.current) => {
    if (!ctx) {
      throw new Error("Set up the canvas first")
    }

    const { position, size } = canvasViewportConfig.dimensions.ref.current

    const { x, y } = position
    const { width: drawingAreaWidth, height: drawingAreaHeight } = size

    ctx.clearRect(
      (x) - 1,
      (y) - 1,
      (drawingAreaWidth) + 1,
      (drawingAreaHeight) + 1
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

    const { size, position } = canvasViewportConfig.dimensions.ref.current

    const {
      width: drawingAreaWidth,
      height: drawingAreaHeight
    } = size

    const { x, y } = position

    const ctx = transparencyGridCanvasRenderingContext.current

    const { width, height } = ctx.canvas
    ctx.clearRect(0, 0, width, height)
    
    const gridSize = 8;

    const pattern = ctx.createPattern(getPattern(gridSize), 'repeat')
    ctx.fillStyle = pattern as CanvasPattern;
    ctx.fillRect(
      Math.floor(x),
      Math.floor(y),
      Math.floor(drawingAreaWidth),
      Math.floor(drawingAreaHeight)
    );

  }

  const resizeBuffers = () => {
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

    const {
      width: newBufferWidth,
      height: newBufferHeight
    } = canvasViewportConfig.dimensions.ref.current.resolution

    hoverOverlayBuffer.canvas.width = newBufferWidth
    transparencyGridBuffer.canvas.width = newBufferWidth

    hoverOverlayBuffer.canvas.height = newBufferHeight
    transparencyGridBuffer.canvas.height = newBufferHeight

    drawTransparencyGrid()
    frameManager.changeResolution({ width: newBufferWidth, height: newBufferHeight })
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

    const { position, size, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.name].width

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

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

    const { position, size, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

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

    const { position, size, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

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

    const { position, size, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

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

    const { position, size, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.name]?.width ?? 0

    const hoverCoordinates = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

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

    const { resolution } = canvasViewportConfig.dimensions.ref.current
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

    const { resolution } = canvasViewportConfig.dimensions.ref.current
    const { width, height } = resolution

    // reset to prevent artifacts
    buffer.clearRect(0,0,resolution.width, resolution.height)

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
      drawCanvas({ctx, buffer})
    })
  }


  // CLICK TOOLS

  const bucketTool = (hoverCoordinates: HoverCoordinates) => {
    const buffer = frameManager.getCurrentFrame()?.buffer

    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const { resolution } = canvasViewportConfig.dimensions.ref.current
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

    const {x1, y1, x2, y2} = actionManager.getCoordinates()

    const updatedPixels = drawLine(x1, y1, x2, y2, toolSizeX)

    return [updatedPixels, rgba]
  }

  const eraserTool = (hoverCoordinates: HoverCoordinates): [Array<Position>, RGBA] => {

    const { toolSizeX } = hoverCoordinates

    const {x1, y1, x2, y2} = actionManager.getCoordinates()
    const rgba: RGBA = [0, 0, 0, 0]

    const updatedPixels = drawLine(x1, y1, x2, y2, toolSizeX);

    return [updatedPixels, rgba]
  }

  const handTool = (clientX: number, clientY: number) => {

    if (!canvasRenderingContext.current) {
      throw new Error("Unable to move undefined canvas context")
    }

    const { left, top } = canvasRenderingContext.current.canvas.getBoundingClientRect()
    const { position, zoom } = canvasViewportConfig.dimensions.ref.current

    if (!mouseCoordinates.current) {
      mouseCoordinates.current = {
        prevClientX: clientX - left,
        prevClientY: clientY - top
      }
    }
    const { prevClientX, prevClientY } = mouseCoordinates.current

    const xDiff = (clientX - left) - prevClientX 
    const yDiff = (clientY - top) - prevClientY

    const newX = position.x + xDiff * zoom
    const newY = position.y + yDiff * zoom

    mouseCoordinates.current = {
      prevClientX: clientX - left,
      prevClientY: clientY - top
    }

    requestAnimationFrame(() => {
      clearCanvas()
      clearOnionSkin()
      canvasViewportConfig.dimensions.set({
        position: {
          x: newX,
          y: newY
        },
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

    const { viewport, position, size, resolution, scale } = canvasViewportConfig.dimensions.ref.current
    const { width: drawingAreaWidth, height: drawingAreaHeight } = size
    const { width: viewportWidth, height: viewportHeight } = viewport
    const { x: drawingAreaX, y: drawingAreaY } = position
    const { width: bufferWidth, height: bufferHeight } = resolution

    ctx.clearRect(0, 0, viewportWidth, viewportHeight)
    buffer.clearRect(0, 0, bufferWidth, bufferHeight)

    const toolSize = canvasToolsConfig[selectedTool.name].width

    const {
      x,
      y,
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

    if (x === null || y === null) {
      actionManager.release()
      return
    }

    buffer.fillStyle = "rgba(0, 0, 0, 0.3)"
    buffer.fillRect(x, y, toolSizeX, toolSizeY)

    ctx.drawImage(
      buffer.canvas,
      drawingAreaX,
      drawingAreaY,
      drawingAreaWidth,
      drawingAreaHeight
    )
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

    const { resolution } = canvasViewportConfig.dimensions.ref.current
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

    const { resolution } = canvasViewportConfig.dimensions.ref.current
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

    const zoomAmount = Math.sign(deltaY) * 0.05
    const { zoom, position, scale, viewport } = canvasViewportConfig.dimensions.ref.current

    if (zoom - zoomAmount < 0.25) return

    scroll.current.scrolled = true
    canvasUpdate.current.willClear = true
    canvasUpdate.current.willDraw = true

    requestAnimationFrame(() => {
      scroll.current.scrolled = false

      const anchorX = Math.round(viewport.width / 2);
      const anchorY = Math.round(viewport.height / 2);

      const scaleFactor = Math.round((1 - zoomAmount) * 100) / 100

      if (scale * scaleFactor <= 1) {
        canvasUpdate.current.willClear = false
        canvasUpdate.current.willDraw = false
        return
      }

      clearCanvas()
      clearOnionSkin()
      canvasViewportConfig.dimensions.set({
        position: {
          x: anchorX + (position.x - anchorX) * scaleFactor,
          y: anchorY + (position.y - anchorY) * scaleFactor
        },
        scale: Math.round((scale * scaleFactor) * 1000) / 1000
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

  // TODO
  // canvas frame system - DONE
  // onion skin & animation - DONE
  // frame preview - DONE
  // animation preview refactor
  // refactor the coordinate system it hurts to look at - TBD

  return (
    <canvasContext.Provider
      value={{
        setup: (
          canvasRef,
          hoverOverlayCanvasRef,
          transparencyGridCanvasRef,
          onionSkinCanvasRef,
          viewport: Dimensions,
          size: Dimensions,
          position: Position,
          resolution: Dimensions,
        ) => {
          if (canvasRef.current) {
            canvasViewportConfig.dimensions.set({
              viewport,
              size,
              resolution,
              position
            })

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
            resizeBuffers()
          }
          setIsReady(true)
          canvasViewportConfig.dimensions.recenter()
          drawCanvas()
        },
        changeDimensions: (dims) => {
          clearCanvas()
          clearOnionSkin()
          canvasViewportConfig.dimensions.set(dims)

          if ((dims as CanvasDimensions)?.resolution) {
            resizeBuffers()
            drawCanvas()
            if (onionSkin) {
              drawOnionSkin()
            }
          }
        },
        resetMousePosition: () => {
          mouseCoordinates.current = null
          actionManager.release()
        },
        frameManager,
        canvasToolsConfig,
        canvasViewportConfig,

        // refactored values
        toolsController: {
          clickAction,
          holdAction,
          startDragAction,
          updateDragAction,
          endHoldAction,
          endDragAction,

          undo,
          redo,
          zoom,
          selected: selectedTool
        },
        canvasController: {
          drawCanvas,
          clearCanvas,
          drawTransparencyGrid,
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