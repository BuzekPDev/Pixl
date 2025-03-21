import { createContext, PropsWithChildren, RefObject, useContext, useRef } from "react";
import { transparency_grid } from "../shaders/transparency_grid";

export interface CanvasContextWebGL {
  setup: (canvasRef: RefObject<HTMLCanvasElement | null>) => void,
  controller: CanvasControllerWebGL;
  log: () => void
}

export interface CanvasControllerWebGL {
  makeGrid: () => void;
  pencilDraw: (x: number, y: number) => void
}

const canvasContextWebGL = createContext<CanvasContextWebGL | null>(null)

export const CanvasProvider = ({
  children
}: PropsWithChildren<any>) => {

  const canvasRenderingContext = useRef<WebGL2RenderingContext | null>(null)

  return (
    <canvasContextWebGL.Provider
      value={{
        setup: (canvasRef) => canvasRef.current ? canvasRenderingContext.current = canvasRef.current.getContext("webgl2") : "",
        controller: {
          makeGrid: () => {
            if (!canvasRenderingContext.current) {
              throw new Error("Set up the canvas first")
            }

            const ctx = canvasRenderingContext.current

            transparency_grid(ctx)
            // const ctx = canvasRenderingContext.current

            // const { width, height } = ctx.canvas.getBoundingClientRect();
            // const gridSize = 8

            // const patternCanvas: HTMLCanvasElement = document.createElement('canvas');
            // patternCanvas.width = gridSize * 2; // 2x2 grid of squares
            // patternCanvas.height = gridSize * 2;

            // const patternCtx = patternCanvas.getContext('2d') as CanvasRenderingContext2D;
            // patternCtx.fillStyle = '#CCCCCC80'; // Light gray with 50% opacity
            // patternCtx.fillRect(0, 0, gridSize, gridSize);
            // patternCtx.fillStyle = '#80808080'; // Dark gray with 50% opacity
            // patternCtx.fillRect(gridSize, 0, gridSize, gridSize);
            // patternCtx.fillStyle = '#80808080'; // Dark gray with 50% opacity
            // patternCtx.fillRect(0, gridSize, gridSize, gridSize);
            // patternCtx.fillStyle = '#CCCCCC80'; // Light gray with 50% opacity
            // patternCtx.fillRect(gridSize, gridSize, gridSize, gridSize);

            // const pattern = ctx.createPattern(patternCanvas, 'repeat');
            // ctx.fillStyle = pattern as CanvasPattern;

            // ctx.fillRect(0, 0, width, height);
          },
          pencilDraw: (x, y) => {
            if (!canvasRenderingContext.current) {
              throw new Error("Set up the canvas first")
            }

            const ctx = canvasRenderingContext.current
            // pencil_tool(ctx, x, y)
          }
        },
        log: () => console.debug(canvasRenderingContext)
      }}
    >
      {children}
    </canvasContextWebGL.Provider>
  )
}

export const useCanvasApi = () => {
  const canvasApi = useContext(canvasContextWebGL)
  if (!canvasApi) {
    throw new Error("Canvas context is empty")
  }
  return canvasApi
}