import { createContext, PropsWithChildren, RefObject, useContext, useMemo, useRef } from "react";
import { CanvasToolsConfig, useCanvasToolsConfig } from "../hooks/useCanvasToolsConfig";
import { useCanvasViewportConfig } from "../hooks/useCanvasViewportConfig";
import { getHoverCoordinates } from "../graphicsUtils.ts/getHoverCoordinates";
import { CanvasDrawStack } from "../classes/CanvasDrawStack";
import { ColorProcessor, RGBA } from "../classes/ColorProcessor";

export interface CanvasContext {
  setup: (canvasRef: RefObject<HTMLCanvasElement | null>, hoverOverlayCanvasRef: RefObject<HTMLCanvasElement | null>, width: number, height: number) => void,
  controller: CanvasController;
  canvasDrawStack: CanvasDrawStack;
  canvasToolsConfig: CanvasToolsConfig;
  log: () => void
}

export interface CanvasController {
  drawTransparencyGrid: () => void;
  pencilTool: (clientX: number, clientY: number) => void;
  hoverMask: (clientX: number, clientY: number) => void;
  clearHoverMask: () => void
}

const canvasContext = createContext<CanvasContext | null>(null)

export const CanvasProvider = ({
  children
}: PropsWithChildren<any>) => {

  const canvasToolsConfig = useCanvasToolsConfig() 
  const canvasViewportConfig = useCanvasViewportConfig()
  const canvasDrawStack = useMemo(() => new CanvasDrawStack(), [])
  const colorProcessor = useMemo(() => new ColorProcessor(), [])

  const {pencil, eraser, colors} = canvasToolsConfig
  const {dimensions} = canvasViewportConfig

  const canvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)
  const hoverOverlayCanvasRenderingContext = useRef<CanvasRenderingContext2D | null>(null)

  const drawTransparencyGrid = () => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current
    const canvas = ctx.canvas as HTMLCanvasElement

    const { width, height } = canvas.getBoundingClientRect();
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

    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    ctx.fillStyle = pattern as CanvasPattern;

    ctx.fillRect(0, 0, width, height);
  }

  const pencilTool = (clientX: number, clientY: number) => {
    if (!canvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = canvasRenderingContext.current
    const { scaleX, scaleY } = canvasViewportConfig.dimensions

    const {
      x, 
      y, 
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, canvasViewportConfig.dimensions, ctx, pencil.width)    

    const imageData = ctx.getImageData(x, y, toolSizeX, toolSizeY)

    ctx.fillStyle = "rgb(255, 0, 0, 1)"
    ctx.fillRect(x, y, toolSizeX, toolSizeY)

    const scaledLength = (toolSizeX*toolSizeY) / (scaleX * scaleY)

    for (let i = 0; i < scaledLength; i++) {
      const index = i*4 * (toolSizeX*toolSizeY)
      const previousColorData: RGBA = [
        imageData.data[index],
        imageData.data[index+1],
        imageData.data[index+2],
        imageData.data[index+3]
      ]

      const newColorData = canvasToolsConfig.colors.current

      const difference = colorProcessor.getRGBDifference(previousColorData, newColorData)

      canvasDrawStack.push({
        x: x/scaleX,
        y: y/scaleY,
        rgb: difference
      })
    }
  }

  const hoverMask = (clientX: number, clientY: number) => {
    if (!hoverOverlayCanvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = hoverOverlayCanvasRenderingContext.current
    const {width, height} = ctx.canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)

    const {
      x, 
      y, 
      toolSizeX,
      toolSizeY
    } = getHoverCoordinates(clientX, clientY, canvasViewportConfig.dimensions, ctx, pencil.width)    

    ctx.globalAlpha = 0.2
    ctx.fillStyle = "#000"
    ctx.fillRect(x, y, toolSizeX, toolSizeY)
  }

  const clearHoverMask = () => {
    if (!hoverOverlayCanvasRenderingContext.current) {
      throw new Error("Set up the canvas first")
    }

    const ctx = hoverOverlayCanvasRenderingContext.current
    const {width, height} = ctx.canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
  }

  return (
    <canvasContext.Provider
      value={{
        setup: (canvasRef, hoverOverlayCanvasRef, width, height) => {
          if (canvasRef.current) {
            const canvasHeight = canvasRef.current?.getBoundingClientRect().height
            const canvasWidth = canvasRef.current?.getBoundingClientRect().width
            dimensions.set(width, height, canvasWidth, canvasHeight)
            canvasRenderingContext.current = canvasRef.current.getContext("2d")
          } else {
            dimensions.set(width, height, width, height)
          }
          if (hoverOverlayCanvasRef.current) {
            hoverOverlayCanvasRenderingContext.current = hoverOverlayCanvasRef.current.getContext("2d")
          }
          return
        },
        controller: {
          drawTransparencyGrid,
          pencilTool,
          hoverMask,
          clearHoverMask,
        },
        canvasDrawStack,
        canvasToolsConfig,
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