import { createContext, PropsWithChildren, RefObject, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CanvasToolsConfig, SelectedTool, useCanvasToolsConfig } from "../hooks/useCanvasToolsConfig";
import { CanvasDimensions, CanvasViewportConfig, Dimensions, Position, useCanvasViewportConfig } from "../hooks/useCanvasViewportConfig";
import { getHoverCoordinates } from "../graphicsUtils/getHoverCoordinates";
import { CanvasDrawStack } from "../classes/CanvasDrawStack";
import { ColorProcessor, RGBA } from "../classes/ColorProcessor";
import { useOffscreenBuffer } from "../hooks/useOffscreenBuffer";
import { floodFill } from "../graphicsUtils/floodFill";
import { MovementTracker } from "../classes/MovementTracker";
import { SelectionTracker } from "../classes/SelectionTracker";
import { drawRect, RectBounds } from "../graphicsUtils/drawRect";
import { getRectWalls } from "../graphicsUtils/getRectWalls";

export interface CanvasContext {
  setup: (
    canvasRef: RefObject<HTMLCanvasElement | null>,
    hoverOverlayCanvasRef: RefObject<HTMLCanvasElement | null>,
    transparencyGridCanvasRef: RefObject<HTMLCanvasElement | null>,
    viewport: Dimensions,
    size: Dimensions,
    position: Position,
    resolution: Dimensions
  ) => void,
  changeDimensions:
  <K extends keyof CanvasDimensions>
    (dims: Record<K, CanvasDimensions[K]>) => void;
  controller: CanvasController;
  resetMousePosition: () => void
  canvasDrawStack: CanvasDrawStack;
  canvasToolsConfig: CanvasToolsConfig;
  canvasViewportConfig: CanvasViewportConfig;
  selectionTracker: SelectionTracker;
  log: () => void;
}

export interface CanvasController {
  drawTransparencyGrid: () => void;
  pencil: (clientX: number, clientY: number) => void;
  eraser: (clientX: number, clientY: number) => void;
  move: (clientX: number, clientY: number) => void;
  bucket: (clientX: number, clientY: number) => void;
  rect: (clientX: number, clientY: number) => void;
  hoverMask: (clientX: number, clientY: number) => void;
  clearHoverMask: () => void;
  undo: () => void;
  redo: () => void;
  zoom: (deltaY: number) => void
  selected: SelectedTool
}

const canvasContext = createContext<CanvasContext | null>(null)

export const zoom = 1

export const CanvasProvider = ({
  children
}: PropsWithChildren<any>) => {

  const [, setIsReady] = useState(false)

  // main tools 
  const canvasToolsConfig = useCanvasToolsConfig()
  const canvasViewportConfig = useCanvasViewportConfig()
  const canvasDrawStack = useMemo(() => new CanvasDrawStack(), [])

  // utilities
  const colorProcessor = useMemo(() => new ColorProcessor(), [])
  const movementTracker = useMemo(() => new MovementTracker(), [])
  const selectionTracker = useMemo(() => new SelectionTracker(), [])

  // rendering context
  const canvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const hoverOverlayCanvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const transparencyGridCanvaRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
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

  const resizeBuffers = () => {
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer not ready")
    }

    if (!offscreenBuffer.hoverOverlayBuffer) {
      throw new Error("Hover overlay buffer not ready")
    }

    if (!offscreenBuffer.transparencyGridBuffer) {
      throw new Error("Transparency grid buffer not ready")
    }

    const {
      drawingBuffer,
      hoverOverlayBuffer,
      transparencyGridBuffer
    } = offscreenBuffer

    const {
      width: newBufferWidth,
      height: newBufferHeight
    } = canvasViewportConfig.dimensions.ref.current.resolution

    let imageData: ImageData | null = null;
    const { width: bufferWidth, height: bufferHeight } = drawingBuffer.canvas

    if (bufferWidth && bufferHeight) {
      imageData = drawingBuffer.getImageData(0, 0, bufferWidth, bufferHeight)
    }

    drawingBuffer.canvas.width = newBufferWidth
    hoverOverlayBuffer.canvas.width = newBufferWidth
    transparencyGridBuffer.canvas.width = newBufferWidth

    drawingBuffer.canvas.height = newBufferHeight
    hoverOverlayBuffer.canvas.height = newBufferHeight
    transparencyGridBuffer.canvas.height = newBufferHeight

    if (imageData) {
      drawingBuffer.clearRect(0, 0, newBufferWidth, newBufferHeight)
      drawingBuffer.putImageData(imageData, 0, 0)
    }

    drawTransparencyGrid()
  }

  const drawCanvas = (
    ctx: CanvasRenderingContext2D | null = canvasRenderingContext.current,
    buffer: OffscreenCanvasRenderingContext2D | null = offscreenBuffer.drawingBuffer
  ) => {
    if (!ctx) {
      throw new Error("Set up the canvas first")
    }
    if (!buffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    console.debug("drew")

    // const buffer = offscreenBuffer.drawingBuffer
    // const ctx = canvasRenderingContext.current
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

  const clearCanvas = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current

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

  // make grid lighter
  const drawTransparencyGrid = () => {
    if (!transparencyGridCanvaRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const { size, position } = canvasViewportConfig.dimensions.ref.current

    const {
      width: drawingAreaWidth,
      height: drawingAreaHeight
    } = size

    const { x, y } = position

    const ctx = transparencyGridCanvaRenderingContext.current

    const { width, height } = ctx.canvas
    ctx.clearRect(0, 0, width, height)
    const gridSize = 8

    const patternCanvas: HTMLCanvasElement = document.createElement('canvas');
    patternCanvas.width = gridSize * 2; // 2x2 grid of squares
    patternCanvas.height = gridSize * 2;

    const patternCtx = patternCanvas.getContext('2d') as CanvasRenderingContext2D;
    patternCtx.fillStyle = '#CCCCCC80'; // Light gray with 50% opacity
    patternCtx.fillRect(0, 0, gridSize, gridSize);
    patternCtx.fillStyle = '#80808080'; // Dark gray with 50% opacity
    patternCtx.fillRect(gridSize, 0, gridSize, gridSize);
    patternCtx.fillStyle = '#80808080'; // Dark gray with 50% opacity
    patternCtx.fillRect(0, gridSize, gridSize, gridSize);
    patternCtx.fillStyle = '#CCCCCC80'; // Light gray with 50% opacity
    patternCtx.fillRect(gridSize, gridSize, gridSize, gridSize);

    const pattern = ctx.createPattern(patternCanvas, 'repeat')
    ctx.fillStyle = pattern as CanvasPattern;
    ctx.fillRect(
      Math.floor(x),
      Math.floor(y),
      Math.floor(drawingAreaWidth),
      Math.floor(drawingAreaHeight)
    );
  }

  // optimize & add Bresenham's Line Algorithm/interpolation
  const pencil = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const [r, g, b, a] = colors.palette[colors.current]

    if (r === 0 && g === 0 && b === 0 && a === 0) {
      return eraser(clientX, clientY)
    }

    const ctx = canvasRenderingContext.current
    const buffer = offscreenBuffer.drawingBuffer

    const { position, size, resolution, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.key].width

    const {
      x,
      y,
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

    if (x === null || y === null) {
      return
    }

    const imageData = buffer.getImageData(x, y, toolSizeX, toolSizeY)

    buffer.fillStyle = `rgb(${r},${g},${b})`
    buffer.fillRect(x, y, toolSizeX, toolSizeY)

    const surfaceArea = toolSizeX * toolSizeY

    requestAnimationFrame(() => {
      clearCanvas()
      drawCanvas()
    })

    for (let i = 0; i < surfaceArea; i++) {
      const pixelX = x + (i % toolSizeX)
      const pixelY = y + Math.floor(i / toolSizeY)
      if (pixelX > resolution.width - 1 || pixelY > resolution.height - 1) {
        continue
      }
      const index = 4 * i
      const previousColorData: RGBA = [
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]

      const newColorData: RGBA = [r, g, b, a]
      const difference = colorProcessor.getRGBDifference(previousColorData, newColorData)

      canvasDrawStack.push({
        x: pixelX,
        y: pixelY,
        rgb: difference,
      })
    }
  }

  const eraser = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const ctx = canvasRenderingContext.current
    const buffer = offscreenBuffer.drawingBuffer

    const { position, size, resolution, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.key].width

    const {
      x,
      y,
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

    if (x === null || y === null) {
      return
    }

    const imageData = buffer.getImageData(x, y, toolSizeX, toolSizeY)

    buffer.clearRect(x, y, toolSizeX, toolSizeY)

    const surfaceArea = toolSizeX * toolSizeY

    requestAnimationFrame(() => {
      clearCanvas()
      drawCanvas()
    })

    for (let i = 0; i < surfaceArea; i++) {
      const pixelX = x + (i % toolSizeX)
      const pixelY = y + Math.floor(i / toolSizeY)
      if (pixelX > resolution.width - 1 || pixelY > resolution.height - 1) {
        continue
      }
      const index = 4 * i
      const previousColorData: RGBA = [
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]

      canvasDrawStack.push({
        x: pixelX,
        y: pixelY,
        rgb: previousColorData,
      })
    }
  }

  const bucket = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const ctx = canvasRenderingContext.current
    const buffer = offscreenBuffer.drawingBuffer

    const { position, size, resolution, scale } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.key].width

    const {
      x,
      y,
    } = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

    if (x === null || y === null) {
      return
    }

    const fillColor = colors.palette[colors.current]

    floodFill(x, y, fillColor, resolution, buffer, canvasDrawStack, colorProcessor)
    drawCanvas()
  }


  const finishRect = (
    rectBounds: RectBounds, 
    resolution: Dimensions, 
    rgba: RGBA, 
    buffer: OffscreenCanvasRenderingContext2D
  ) => {
    const { x1, y1, x2, y2 } = rectBounds
    const [ r, g, b ] = rgba

    const rectWalls = getRectWalls(x1, y1, x2, y2)
    const imageData = buffer.getImageData(0, 0, resolution.width, resolution.height)
    for (let i = 0; i < rectWalls.length; i++) {
      const { x, y } = rectWalls[i]
      const index = (x + ((resolution.width) * y)) * 4
      const previousColorData: RGBA = [
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]
      const difference = colorProcessor.getRGBDifference(previousColorData, rgba)
      canvasDrawStack.push({
        ...rectWalls[i],
        rgb: difference,
      })
    }
    buffer.fillStyle = `rgb(${r},${g},${b})`
    drawRect(
      buffer, x1, y1, x2, y2
    )
    canvasDrawStack.commit()
  }

  const updateRect = (cursorPosition: Position, rectBounds: RectBounds, rgba: RGBA, buffer: OffscreenCanvasRenderingContext2D) => {
    const { x1, y1, x2, y2 } = rectBounds;
    const [r, g, b] = rgba;
    buffer.fillStyle = `rgba(${r},${g},${b})`
    drawRect(
      buffer, x1, y1, x2, y2
    )
    selectionTracker.update(cursorPosition.x, cursorPosition.y)
  }

  const rect = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }
    if (!offscreenBuffer.hoverOverlayBuffer) {
      throw new Error("Hover overlay buffer buffer not ready")
    }

    const [r, g, b, a] = colors.palette[colors.current]

    if (r === 0 && g === 0 && b === 0 && a === 0) {
      return eraser(clientX, clientY)
    }

    const ctx = canvasRenderingContext.current
    const buffer = offscreenBuffer.drawingBuffer
    const overlayBuffer = offscreenBuffer.hoverOverlayBuffer

    const { position, size, scale, resolution } = canvasViewportConfig.dimensions.ref.current
    const toolSize = canvasToolsConfig[selectedTool.key].width

    if (canvasUpdate.current.willDraw || canvasUpdate.current.willClear) {
      return
    }
    const {
      x,
      y,
    } = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

    if (x === null || y === null) {
      return
    }

    const rectBounds = selectionTracker.getRectBounds()

    clearHoverMask()
    overlayBuffer.clearRect(0, 0, resolution.width, resolution.height)

    if (!selectionTracker.isTracking) {
      selectionTracker.track(x, y)
    } else if (selectionTracker.shouldCommit) {
      if (!rectBounds) return
      finishRect(rectBounds, resolution, [r,g,b,a], buffer)
    } else {
      if (!rectBounds) return
      updateRect({x,y}, rectBounds, [r,g,b,a], overlayBuffer)
    }

    requestAnimationFrame(() => {
      canvasUpdate.current.willClear = false;
      canvasUpdate.current.willDraw = false;
      drawCanvas(hoverOverlayCanvasRenderingContext.current, overlayBuffer)
      if (selectionTracker.shouldCommit) {
        drawCanvas()
        selectionTracker.untrack()
      }
    })
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

    const { viewport, position, size, resolution, zoom, scale } = canvasViewportConfig.dimensions.ref.current
    const { width: drawingAreaWidth, height: drawingAreaHeight } = size
    const { width: viewportWidth, height: viewportHeight } = viewport
    const { x: drawingAreaX, y: drawingAreaY } = position
    const { width: bufferWidth, height: bufferHeight } = resolution

    ctx.clearRect(0, 0, viewportWidth, viewportHeight)
    buffer.clearRect(0, 0, bufferWidth, bufferHeight)

    const toolSize = canvasToolsConfig[selectedTool.key].width

    const {
      x,
      y,
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, position, size, scale, ctx, toolSize)

    if (x === null || y === null) {
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

    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    if (canvasUpdate.current.willClear || canvasUpdate.current.willDraw) {
      return
    }

    const buffer = offscreenBuffer.drawingBuffer
    const { resolution } = canvasViewportConfig.dimensions.ref.current
    const { width: bufferWidth, height: bufferHeight } = resolution

    const previousFrame = canvasDrawStack.undo();

    if (!previousFrame) return

    const fullBuffer = buffer.getImageData(0, 0, bufferWidth, bufferHeight)
    const modifiedImageData = fullBuffer.data.slice()

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
    })
  }

  const redo = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    if (canvasUpdate.current.willClear || canvasUpdate.current.willDraw) {
      return
    }

    const buffer = offscreenBuffer.drawingBuffer
    const { resolution } = canvasViewportConfig.dimensions.ref.current
    const { width: bufferWidth, height: bufferHeight } = resolution

    const nextFrame = canvasDrawStack.redo();
    if (!nextFrame) return

    const fullBuffer = buffer.getImageData(0, 0, bufferWidth, bufferHeight)
    const modifiedImageData = fullBuffer.data.slice()

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
      canvasViewportConfig.dimensions.set({
        position: {
          x: anchorX + (position.x - anchorX) * scaleFactor,
          y: anchorY + (position.y - anchorY) * scaleFactor
        },
        scale: Math.round((scale * scaleFactor) * 1000) / 1000
      })
      drawCanvas()
      drawTransparencyGrid()
    })
  }

  const move = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }
    if (!transparencyGridCanvaRenderingContext.current) {
      throw new Error("Set up transparency grid first")
    }
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    if (canvasUpdate.current.willClear || canvasUpdate.current.willDraw) return

    // ctx drawing canvas context
    const ctxDCC = canvasRenderingContext.current

    const { position, zoom } = canvasViewportConfig.dimensions.ref.current
    const { left, top } = ctxDCC.canvas.getBoundingClientRect()

    if (!mouseCoordinates.current) {
      mouseCoordinates.current = {
        prevClientX: clientX - left,
        prevClientY: clientY - top
      }
      return
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

    canvasUpdate.current.willClear = true
    canvasUpdate.current.willDraw = true

    requestAnimationFrame(() => {
      clearCanvas()
      canvasViewportConfig.dimensions.set({
        position: {
          x: newX,
          y: newY
        },
      })
      drawCanvas()
      drawTransparencyGrid()
    })
  }


  // TODO
  // canvas frame system (check out notes app for info)
  // onion skin & animation
  // frame preview (canvas-based)
  // refactor the coordinate system it hurts to look at

  return (
    <canvasContext.Provider
      value={{
        setup: (
          canvasRef,
          hoverOverlayCanvasRef,
          transparencyGridCanvasRef,
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
          if (transparencyGridCanvasRef.current) {
            const ctx = transparencyGridCanvasRef.current.getContext("2d") as CanvasRenderingContext2D
            transparencyGridCanvaRenderingContext.current = ctx
            ctx.imageSmoothingEnabled = false
          }
          setIsReady(true)
          resizeBuffers()
          canvasViewportConfig.dimensions.recenter()
          drawCanvas()
        },
        controller: {
          drawTransparencyGrid,
          pencil,
          eraser,
          bucket,
          rect,
          hoverMask,
          clearHoverMask,
          undo,
          redo,
          move,
          zoom,
          selected: selectedTool
        },
        changeDimensions: (dims) => {
          clearCanvas()
          canvasViewportConfig.dimensions.set(dims)

          if ((dims as CanvasDimensions)?.resolution) {
            resizeBuffers()
            drawCanvas()
          }
        },
        resetMousePosition: () => {
          mouseCoordinates.current = null
        },
        canvasDrawStack,
        canvasToolsConfig,
        canvasViewportConfig,
        selectionTracker,
        log: () => console.debug(canvasRenderingContext)
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