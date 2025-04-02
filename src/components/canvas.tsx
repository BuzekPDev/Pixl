import { useEffect,  useRef } from "react";
import { useCanvasApi } from "../context/canvasContext2d";

export const Canvas = ({
  width,
  height,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hoverOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const transparencyGridCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const onionSkinCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const api = useCanvasApi()
  const isDrawing = useRef(false)


  useEffect(() => {
    if (!width || !height) return
    api.setup(
      canvasRef, 
      hoverOverlayCanvasRef, 
      transparencyGridCanvasRef, 
      onionSkinCanvasRef,
      {width: width, height: height},
      {width: width, height: height},
      {x: 0, y: 0},
      {width: 64, height: 64}
    )
  
    api.canvasController.drawTransparencyGrid()

  }, [width, height])

  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      const {selected, undo, redo} = api.toolsController
      if (e.ctrlKey) {
        switch (e.code) {
          case "KeyZ": 
            undo()
            e.preventDefault()
            break;
          case "KeyY":
            redo()
            e.preventDefault()
            break;
        }
      } else {
        switch (e.code) {
          case "KeyH":
            selected.set("hand", "hold")
            break;
          case "KeyP": 
            selected.set("pencil", "hold")
            break;
          case "KeyE": 
            selected.set("eraser", "hold")
            break;
          case "KeyB": 
            selected.set("bucket", "click")
            break;
          case "KeyR": 
            selected.set("rect", "drag")
        }
      }
    } 

    const handlePointerUp = (e: PointerEvent) => {
      // should delay just long enough for pointerMove to finish
      requestAnimationFrame(() => {
        isDrawing.current=false
        const { type } = api.canvasToolsConfig.selectedTool
        if (type === "click") {
          return
        }
        switch (type) {
          case "hold":
            api.toolsController.endHoldAction(e.clientX, e.clientY)
            break;
          case "drag":
            api.toolsController.endDragAction(e.clientX, e.clientY)
            break
        }
        api.resetMousePosition()
      })
    }

    window.addEventListener("keydown", keyboardHandler)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("keydown", keyboardHandler)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [api.toolsController])

  return (
    <div className="relative">
      <canvas
        className="touch-none w-full h-full -z-10 absolute top-0 left-0 pointer-events-none [image-rendering:pixelated]"
        width={width}
        height={height} 
        ref={transparencyGridCanvasRef}
      ></canvas>
      <canvas
        className="touch-none w-full h-full z-20 absolute top-0 left-0 pointer-events-none [image-rendering:pixelated]"
        width={width}
        height={height} 
        ref={onionSkinCanvasRef}
      ></canvas>
      <canvas
        className="touch-none w-full h-full [image-rendering:pixelated]"
        width={width}
        height={height} 
        ref={canvasRef}
        onClick={(e) => {
          if (api.canvasToolsConfig.selectedTool.type === "click") {
            api.toolsController.clickAction(e.clientX, e.clientY)
          }
        }}
        onPointerDown={(e) => {
          if (api.canvasToolsConfig.selectedTool.type === "click") {
            return
          }
          switch (api.canvasToolsConfig.selectedTool.type) {
            case "hold":
              api.toolsController.holdAction(e.clientX, e.clientY)
              break;
            case "drag":
              api.toolsController.startDragAction(e.clientX, e.clientY)
              break
          }
          isDrawing.current = true
        }}
        onPointerMove={(e) => {
          if (api.canvasToolsConfig.selectedTool.type === "click") {
            return
          }

          api.canvasController.hoverMask.draw(e.clientX, e.clientY)

          if (isDrawing.current) {
            switch (api.canvasToolsConfig.selectedTool.type) {
              case "hold":
                api.toolsController.holdAction(e.clientX, e.clientY)
                break;
              case "drag":
                api.toolsController.updateDragAction(e.clientX, e.clientY)
                break
            }
          }
        }}
        onPointerOut={() => {
          api.canvasController.hoverMask.clear()
          api.resetMousePosition()
        }}
        onWheel={(e) => {
          if (!e.ctrlKey) {
            api.toolsController.zoom(e.deltaY)
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