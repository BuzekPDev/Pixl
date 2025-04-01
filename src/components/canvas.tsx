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
  const onionSkinCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const api = useCanvasApi()
  const isDrawing = useRef(false)

  const { selected } = api.controller

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
  
    api.controller.drawTransparencyGrid()

    console.debug('effect')

  }, [width, height])

  useEffect(() => {

    const keyboardHandler = (e: KeyboardEvent) => {
      const {selected} = api.controller
      if (e.ctrlKey) {
        switch (e.code) {
          case "KeyZ": 
            api.controller.undo()
            e.preventDefault()
            break;
          case "KeyY":
            api.controller.redo()
            e.preventDefault()
            break;
        }
      } else {
        switch (e.code) {
          case "KeyH": // h stands for hand I might change it later
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
      isDrawing.current = false
      api.frameManager.finishStep()
      // console.debug(memorySizeOf(api.canvasDrawStack.stack))
      if (api.selectionTracker.isTracking) {
        api.selectionTracker.finish()
        api.controller.rect(e.clientX, e.clientY)
      }
    }

    window.addEventListener("keydown", keyboardHandler)
    // window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("keydown", keyboardHandler)
      // window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [api.controller])

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
            api.controller.clickAction(e.clientX, e.clientY)
          }
        }}
        onPointerDown={(e) => {
          if (api.canvasToolsConfig.selectedTool.type === "click") {
            return
          }
          switch (api.canvasToolsConfig.selectedTool.type) {
            case "hold":
              api.controller.holdAction(e.clientX, e.clientY)
              break;
            case "drag":
              api.controller.startDragAction(e.clientX, e.clientY)
              break
          }
          isDrawing.current = true
        }}
        onPointerUp={(e) => {
          isDrawing.current=false
          if (api.canvasToolsConfig.selectedTool.type === "click") {
            return
          }
          switch (api.canvasToolsConfig.selectedTool.type) {
            case "hold":
              api.controller.endHoldAction(e.clientX, e.clientY)
              break;
            case "drag":
              api.controller.endDragAction(e.clientX, e.clientY)
              break
          }
          api.resetMousePosition()
        }}
        onPointerMove={(e) => {
          if (api.canvasToolsConfig.selectedTool.type === "click") {
            return
          }

          api.controller.hoverMask(e.clientX, e.clientY)

          if (isDrawing.current) {
            switch (api.canvasToolsConfig.selectedTool.type) {
              case "hold":
                api.controller.holdAction(e.clientX, e.clientY)
                break;
              case "drag":
                api.controller.updateDragAction(e.clientX, e.clientY)
                break
            }
          }
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