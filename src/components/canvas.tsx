import { useEffect, useMemo, useRef } from "react";
import { useCanvasApi } from "../context/canvasContext2d";

export const Canvas = ({
  width,
  height
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hoverOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const api = useCanvasApi()
  const isDrawing = useRef(false)

  const canvasDimensions = useMemo(() => {
    // aspect ratio of the user-selected dimensions
    const canvasAspectRatio = width/height

    // 640 is a placeholder size, I might change it later
    return {
      width: 640,
      height: 640 * canvasAspectRatio
    }
  }, [])

  useEffect(() => {
    api.setup(canvasRef, hoverOverlayCanvasRef, width, height)

    api.controller.drawTransparencyGrid()

    const handlePointerUp = () => {
      isDrawing.current = false
      api.canvasDrawStack.commit()
      console.debug("stack", api.canvasDrawStack.debug())
    }

    window.addEventListener("pointerup", handlePointerUp)

    return () => window.removeEventListener("pointerup", handlePointerUp)
    // api.controller.pencilDraw()
  }, [])

  return (
    <div className="relative">
      <canvas
        width={canvasDimensions.width}
        height={canvasDimensions.height} 
        ref={canvasRef}
        className="bg-white"
        onPointerDown={(e) => {
          const x = e.clientX //- e.currentTarget.getBoundingClientRect().left
          const y = e.clientY //- e.currentTarget.getBoundingClientRect().top
          api.controller.pencilTool(x, y)
          isDrawing.current = true
        }}
        onPointerUp={() => {
          isDrawing.current=false
          api.canvasDrawStack.commit()
        }}
        onPointerMove={(e) => {
          if (isDrawing.current) {
            api.controller.pencilTool(e.clientX, e.clientY)
          }
          api.controller.hoverMask(e.clientX, e.clientY)
        }}
        onPointerOut={() =>
          api.controller.clearHoverMask()
        }
      >
      </canvas>
      <canvas
        className="w-full h-full absolute top-0 left-0 pointer-events-none"
        width={canvasDimensions.width}
        height={canvasDimensions.height} 
        ref={hoverOverlayCanvasRef}
      ></canvas>
    </div>
  )
}

export interface CanvasProps {
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
}