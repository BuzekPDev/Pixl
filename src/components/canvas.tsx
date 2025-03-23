import { useEffect, useMemo, useRef, useState } from "react";
import { useCanvasApi } from "../context/canvasContext2d";

export const Canvas = ({
  width,
  height
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hoverOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const transparencyGridCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const api = useCanvasApi()
  const isDrawing = useRef(false)

  const [op, setOp] = useState("pencilTool")

  useEffect(() => {
    api.setup(
      canvasRef, 
      hoverOverlayCanvasRef, 
      transparencyGridCanvasRef, 
      {width: 1024, height: 1024},
      {width: 640, height: 640},
      {x: 20, y: 20},
      {width: 64, height: 64}
    )
  
    api.controller.drawTransparencyGrid()

    const handlePointerUp = () => {
      isDrawing.current = false
      api.canvasDrawStack.commit()
    }


    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [])

  return (
    <>
    <div className="relative w-fit">
      <canvas
        className="w-full h-full -z-10 absolute top-0 left-0 pointer-events-none"
        width={1024}
        height={1024} 
        ref={transparencyGridCanvasRef}
      ></canvas>
      <canvas
        width={1024}
        height={1024} 
        ref={canvasRef}
        onPointerDown={(e) => {
          const x = e.clientX 
          const y = e.clientY 
          api.controller[op](x, y)
          isDrawing.current = true
        }}
        onPointerUp={() => {
          isDrawing.current=false
          api.canvasDrawStack.commit()
          api.resetMousePosition()
        }}
        onPointerMove={(e) => {
          if (isDrawing.current) {
            api.controller[op](e.clientX, e.clientY)
            // api.controller.moveDrawingArea(e.clientX, e.clientY)
          }
          api.controller.hoverMask(e.clientX, e.clientY)
        }}
        onPointerOut={() =>
          api.controller.clearHoverMask()
        }
        onWheel={(e) => api.controller.zoom(e.deltaY)}
      >
      </canvas>
      <canvas
        className="w-full h-full absolute top-0 left-0 pointer-events-none"
        width={1024}
        height={1024} 
        ref={hoverOverlayCanvasRef}
      ></canvas>
    </div>
    <button onClick={() => setOp("pencilTool")}>pencil</button>
    <button onClick={() => setOp("move")}>hand</button>
    </>
  )
}

export interface CanvasProps {
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
}