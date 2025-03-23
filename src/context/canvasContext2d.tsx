import { createContext, PropsWithChildren, RefObject, useContext, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CanvasToolsConfig, useCanvasToolsConfig } from "../hooks/useCanvasToolsConfig";
import { CanvasDimensions, CanvasViewportConfig, Dimensions, Position, useCanvasViewportConfig } from "../hooks/useCanvasViewportConfig";
import { getHoverCoordinates } from "../graphicsUtils.ts/getHoverCoordinates";
import { CanvasDrawStack } from "../classes/CanvasDrawStack";
import { ColorProcessor, RGBA } from "../classes/ColorProcessor";
import { useOffscreenBuffer } from "../hooks/useOffscreenBuffer";

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
  canvasViewportConfig: CanvasViewportConfig
  log: () => void
}

export interface CanvasController {
  drawTransparencyGrid: () => void;
  pencilTool: (clientX: number, clientY: number) => void;
  hoverMask: (clientX: number, clientY: number) => void;
  clearHoverMask: () => void;
  undo: () => void;
  redo: () => void;
  move: (clientX: number, clientY: number) => void;
  zoom: (deltaY: number) => void 
}

const canvasContext = createContext<CanvasContext | null>(null)

export const zoom = 1

export const CanvasProvider = ({
  children
}: PropsWithChildren<any>) => {

  const canvasToolsConfig = useCanvasToolsConfig()
  const canvasViewportConfig = useCanvasViewportConfig()
  const canvasDrawStack = useMemo(() => new CanvasDrawStack(), [])
  const colorProcessor = useMemo(() => new ColorProcessor(), [])

  const { pencil, eraser, colors } = canvasToolsConfig

  const canvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const hoverOverlayCanvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const transparencyGridCanvaRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const offscreenBuffer = useOffscreenBuffer()

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
  
  useEffect(() => {
    // set buffer size/resolution on initial load
    resizeBuffers()
  }, [])

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
    const {width: bufferWidth, height: bufferHeight} = drawingBuffer.canvas
   
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
      drawingBuffer.clearRect(0,0,newBufferWidth, newBufferHeight)
      drawingBuffer.putImageData(imageData, 0, 0)
    }
    drawTransparencyGrid()

  }

  const drawCanvas = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const buffer = offscreenBuffer.drawingBuffer
    const ctx = canvasRenderingContext.current

    const { position, resolution, size, aspectRatio, zoom } = canvasViewportConfig.dimensions.ref.current

    const { x: drawingAreaX, y: drawingAreaY } = position
    const { width: bufferWidth, height: bufferHeight } = resolution
    const { width: drawingAreaWidth, height: drawingAreaHeight} = size
    
    const scaleX = drawingAreaWidth/bufferWidth
    const scaleY = drawingAreaHeight/bufferHeight

    const scaledBufferX = bufferWidth * scaleX
    const scaledBufferY = bufferHeight * scaleY

    ctx.drawImage(buffer.canvas, 
      drawingAreaX / zoom, 
      drawingAreaY / zoom, 
      (scaledBufferX / aspectRatio) * zoom, 
      scaledBufferY * zoom
    )
  }

  const clearCanvas = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current

    const { position, resolution, size, aspectRatio, zoom } = canvasViewportConfig.dimensions.ref.current

    const { x: drawingAreaX, y: drawingAreaY } = position
    const { width: bufferWidth, height: bufferHeight } = resolution
    const { width: drawingAreaWidth, height: drawingAreaHeight} = size
    
    const scaleX = drawingAreaWidth/bufferWidth
    const scaleY = drawingAreaHeight/bufferHeight

    const scaledBufferX = bufferWidth * scaleX
    const scaledBufferY = bufferHeight * scaleY

    ctx.clearRect(
      drawingAreaX / zoom, 
      drawingAreaY / zoom, 
      (scaledBufferX / aspectRatio) * zoom, 
      scaledBufferY * zoom
    )
  }

  const drawTransparencyGrid = () => {
    if (!transparencyGridCanvaRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const {
      width: drawingAreaWidth, 
      height: drawingAreaHeight
    } = canvasViewportConfig.dimensions.ref.current.size

    const { x, y } = 
      canvasViewportConfig.dimensions.ref.current.position

    const { aspectRatio, zoom } = canvasViewportConfig.dimensions.ref.current

    const ctx = transparencyGridCanvaRenderingContext.current

    const {width, height} = ctx.canvas
    ctx.clearRect(0,0,width,height)
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
      Math.floor(x/zoom), 
      Math.floor(y/zoom), 
      Math.floor((drawingAreaWidth / aspectRatio)*zoom), 
      Math.floor(drawingAreaHeight*zoom)
    );
  }

  // optimize & add Bresenham's Line Algorithm/interpolation
  const pencilTool = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }
    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const ctx = canvasRenderingContext.current
    const buffer = offscreenBuffer.drawingBuffer

    const { position, aspectRatio, zoom } = canvasViewportConfig.dimensions.ref.current

    const {
      x,
      y,
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, position, aspectRatio, zoom, ctx, pencil.width)

    if (x === null || y === null) {
      return
    }

    const imageData = buffer.getImageData(x, y, toolSizeX, toolSizeY)

    const [r, g, b, a] = colors.palette[colors.current]

    buffer.fillStyle = `rgb(${r},${g},${b},${a})`
    buffer.fillRect(x, y, toolSizeX, toolSizeY)

    const surfaceArea = toolSizeX * toolSizeY

    requestAnimationFrame(drawCanvas)

    for (let i = 0; i < surfaceArea; i++) {
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
        x: x + (i % toolSizeX),
        y: y + Math.floor(i / toolSizeY),
        rgb: difference,
      })
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

    const { viewport, position, size, resolution, aspectRatio, zoom } = canvasViewportConfig.dimensions.ref.current
    const { width: drawingAreaWidth, height: drawingAreaHeight} = size
    const { width: viewportWidth, height: viewportHeight } = viewport
    const { x: drawingAreaX, y: drawingAreaY } = position
    const { width: bufferWidth, height: bufferHeight } = resolution

    const scaleX = drawingAreaWidth/bufferWidth
    const scaleY = drawingAreaHeight/bufferHeight

    ctx.clearRect(0, 0, viewportWidth, viewportHeight)
    buffer.clearRect(0, 0, bufferWidth, bufferHeight)

    const scaledBufferX = bufferWidth * scaleX
    const scaledBufferY = bufferHeight * scaleY

    const {
      x,
      y,
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, position, aspectRatio, zoom, ctx, pencil.width)

    if (x === null || y === null) {
      return
    }
    ctx.globalAlpha = 0.2
    ctx.fillStyle = "#000"
    buffer.fillRect(x, y, toolSizeX, toolSizeY)

    ctx.drawImage(buffer.canvas, drawingAreaX / zoom, drawingAreaY / zoom, (scaledBufferX / aspectRatio) * zoom, scaledBufferY * zoom)
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

    const ctx = canvasRenderingContext.current
    const buffer = offscreenBuffer.drawingBuffer
    const { position, size, resolution, aspectRatio, zoom } = canvasViewportConfig.dimensions.ref.current
    const { width: drawingAreaWidth, height: drawingAreaHeight} = size
    const { x: drawingAreaX, y: drawingAreaY } = position
    const { width: bufferWidth, height: bufferHeight } = resolution

    const scaleX = drawingAreaWidth/bufferWidth
    const scaleY = drawingAreaHeight/bufferHeight

    const scaledBufferX = bufferWidth * scaleX
    const scaledBufferY = bufferHeight * scaleY

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

    ctx.clearRect(drawingAreaX/zoom, drawingAreaY/zoom, (scaledBufferX / aspectRatio)*zoom, scaledBufferY*zoom)
    ctx.drawImage(buffer.canvas, drawingAreaX/zoom, drawingAreaY/zoom, (scaledBufferX / aspectRatio)*zoom, scaledBufferY*zoom)
  }

  const redo = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    if (!offscreenBuffer.drawingBuffer) {
      throw new Error("Drawing buffer buffer not ready")
    }

    const ctx = canvasRenderingContext.current
    const buffer = offscreenBuffer.drawingBuffer
    const { position, size, resolution, aspectRatio, zoom } = canvasViewportConfig.dimensions.ref.current
    const { width: drawingAreaWidth, height: drawingAreaHeight} = size
    const { x: drawingAreaX, y: drawingAreaY } = position
    const { width: bufferWidth, height: bufferHeight } = resolution

    const scaleX = drawingAreaWidth/bufferWidth
    const scaleY = drawingAreaHeight/bufferHeight

    const scaledBufferX = bufferWidth * scaleX
    const scaledBufferY = bufferHeight * scaleY

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

    ctx.clearRect(drawingAreaX / zoom, drawingAreaY / zoom, (scaledBufferX / aspectRatio) * zoom , scaledBufferY * zoom)
    ctx.drawImage(buffer.canvas, drawingAreaX / zoom, drawingAreaY / zoom, (scaledBufferX / aspectRatio) * zoom, scaledBufferY * zoom)
  }

  const zoom = (deltaY: number) => {

    if (scroll.current.scrolled) {
      return
    }

    const zoomDir = Math.sign(deltaY) * 0.05
    const { zoom } = canvasViewportConfig.dimensions.ref.current
    
    requestAnimationFrame(() => {
      scroll.current.scrolled = false

      canvasViewportConfig.dimensions.set({zoom: zoom - zoomDir})
      clearCanvas()
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

  
    // ctx drawing canvas context
    const ctxDCC = canvasRenderingContext.current
    // ctx transparency grid context
    const ctxTGC = transparencyGridCanvaRenderingContext.current

    const { drawingBuffer } = offscreenBuffer

    const { position, size, aspectRatio, resolution, zoom } = canvasViewportConfig.dimensions.ref.current
    const { left, top } = ctxDCC.canvas.getBoundingClientRect()

    if (!mouseCoordinates.current) {
      mouseCoordinates.current = {
        prevClientX: clientX - left,
        prevClientY: clientY - top
      }
      return
    }
    const {prevClientX, prevClientY} = mouseCoordinates.current

    const xDiff = (clientX - left) - prevClientX
    const yDiff = (clientY - top) - prevClientY

    const scaleX = size.width/resolution.width
    const scaleY = size.height/resolution.height

    const newX = position.x + xDiff * zoom
    const newY = position.y + yDiff * zoom

    mouseCoordinates.current = {
      prevClientX: clientX - left,
      prevClientY: clientY - top
    }

    requestAnimationFrame(() => {
      ctxDCC.clearRect(position.x / zoom,(position.y / zoom), (size.width / aspectRatio) * zoom, size.height * zoom)
      ctxTGC.clearRect(position.x / zoom,(position.y / zoom), (size.width / aspectRatio) * zoom, size.height * zoom)

      ctxDCC.drawImage(drawingBuffer.canvas, newX / zoom, newY / zoom, (resolution.width*scaleX) * zoom, (resolution.height * scaleY) * zoom)
      drawTransparencyGrid()
    })

    canvasViewportConfig.dimensions.set({
      position: {
        x: newX,
        y: newY
      },
    })
  }

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
        },
        controller: {
          drawTransparencyGrid,
          pencilTool,
          hoverMask,
          clearHoverMask,
          undo,
          redo,
          move,
          zoom
        },
        changeDimensions: (dims) => {
          canvasViewportConfig.dimensions.set(dims)

          if ((dims as CanvasDimensions)?.resolution) {
            console.debug("what")
            resizeBuffers()
          }
        },
        resetMousePosition: () => {
          mouseCoordinates.current=null
        },
        canvasDrawStack,
        canvasToolsConfig,
        canvasViewportConfig,
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