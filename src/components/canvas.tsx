import { useEffect,  useRef } from "react";
import { useCanvasApi } from "../context/canvasContext2d";

export const Canvas = ({
  width,
  height,
  canvasWidth,
  canvasHeight,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hoverOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const transparencyGridCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const api = useCanvasApi()
  const isDrawing = useRef(false)

  const { selected } = api.controller

  useEffect(() => {
    api.setup(
      canvasRef, 
      hoverOverlayCanvasRef, 
      transparencyGridCanvasRef, 
      {width: width, height: height},
      {width: width, height: height},
      {x: 0, y: 0},
      {width: 64, height: 64}
    )
  
    api.controller.drawTransparencyGrid()

    const keyboardHandler = (e: KeyboardEvent) => {
      const {selected} = api.controller
      if (e.ctrlKey) {
        switch (e.code) {
          case "KeyZ": 
            api.controller.undo()
            break;
          case "KeyY":
            api.controller.redo()
            break;
        }
      } else {
        switch (e.code) {
          case "KeyH": // h stands for hand I might change it later
            selected.set("move")
            break;
          case "KeyP": 
            selected.set("pencil")
            break;
          case "KeyE": 
            selected.set("eraser")
            break;
        }
      }
      
    } 

    const handlePointerUp = () => {
      isDrawing.current = false
      api.canvasDrawStack.commit()
    }

    window.addEventListener("keydown", keyboardHandler)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("keydown", keyboardHandler)
      window.addEventListener("pointerup", handlePointerUp)
    }
  }, [width, height])

  return (
    <div className="relative">
      <canvas
        className="touch-none w-full h-full -z-10 absolute top-0 left-0 pointer-events-none [image-rendering:pixelated]"
        width={width}
        height={height} 
        ref={transparencyGridCanvasRef}
      ></canvas>
      <canvas
        className="touch-none w-full h-full [image-rendering:pixelated]"
        width={width}
        height={height} 
        ref={canvasRef}
        onPointerDown={(e) => {
          const x = e.clientX 
          const y = e.clientY 
          api.controller[selected.key](x, y)
          isDrawing.current = true
        }}
        onPointerUp={() => {
          isDrawing.current=false
          api.canvasDrawStack.commit()
          api.resetMousePosition()
        }}
        onPointerMove={(e) => {
          if (isDrawing.current) {
            api.controller[selected.key](e.clientX, e.clientY)
          }
          api.controller.hoverMask(e.clientX, e.clientY)
        }}
        onPointerOut={() => {
          api.controller.clearHoverMask()
          api.resetMousePosition()
        }}
        onWheel={(e) => {
          if (!e.ctrlKey) {
            api.controller.zoom(e.deltaY)
          } 
        }}
      >
      </canvas>
      <canvas
        className="touch-none w-full h-full absolute top-0 left-0 pointer-events-none [image-rendering:pixelated]"
        width={width}
        height={height} 
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