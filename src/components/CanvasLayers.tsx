import { TouchEvent, useEffect, useRef } from "react";
import { useCanvasApi } from "../context/canvasContext2d";

export const CanvasLayers = ({
  width,
  height,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hoverOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const transparencyGridCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const onionSkinCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // const pinchZoomCache = useRef([])
  const pinchDistance = useRef<number | null>(null)

  const api = useCanvasApi()
  const isDrawing = useRef(false)


  useEffect(() => {
    if (!width || !height) return
    api.setup({
      canvasRef,
      hoverOverlayCanvasRef,
      transparencyGridCanvasRef,
      onionSkinCanvasRef,
      trueSize: { width: width, height: height },
      resolution: { width: 64, height: 64 }
    })

    api.canvasController.drawTransparencyGrid()

  }, [width, height])

  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      const { selected, undo, redo } = api.toolsController
      if ((e.target as HTMLElement).tagName === "INPUT") return
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
        isDrawing.current = false
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
        api.toolsController.resetMousePosition()
        pinchDistance.current = null
      })
    }

    window.addEventListener("keydown", keyboardHandler)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("keydown", keyboardHandler)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [api.toolsController])

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (api.canvasToolsConfig.selectedTool.type === "click") {
      return
    }
    switch (api.canvasToolsConfig.selectedTool.type) {
      case "hold":
        api.toolsController.holdAction(clientX, clientY)
        break;
      case "drag":
        api.toolsController.startDragAction(clientX, clientY)
        break
    }
    isDrawing.current = true
  }

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (api.canvasToolsConfig.selectedTool.type === "click") {
      return
    }

    api.canvasController.hoverMask.draw(clientX, clientY)

    if (isDrawing.current) {
      switch (api.canvasToolsConfig.selectedTool.type) {
        case "hold":
          api.toolsController.holdAction(clientX, clientY)
          break;
        case "drag":
          api.toolsController.updateDragAction(clientX, clientY)
          break
      }
    }
  }

  const handlePinchZoom = (e: TouchEvent<HTMLCanvasElement>) => {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    if (pinchDistance.current !== null
      && Math.abs(pinchDistance.current - currentDistance) > 1.5 // threshold so micro movements don't trigger zoom
    ) {
      const zoomDirection = currentDistance < pinchDistance.current ? 1 : -1;
      api.toolsController.zoom(zoomDirection);
    }

    pinchDistance.current = currentDistance;
  }

  return (
    <div className="relative">
      <canvas
        className="touch-none w-full h-full -z-10 absolute top-0 left-0 pointer-events-none pixelated"
        width={width}
        height={height}
        ref={transparencyGridCanvasRef}
      ></canvas>
      <canvas
        className="touch-none w-full h-full z-20 absolute top-0 left-0 pointer-events-none pixelated"
        width={width}
        height={height}
        ref={onionSkinCanvasRef}
      ></canvas>
      <canvas
        className="touch-none w-full h-full pixelated"
        width={width}
        height={height}
        ref={canvasRef}
        onClick={(e) => {
          console.debug(e)
          if (api.canvasToolsConfig.selectedTool.type === "click") {
            api.toolsController.clickAction(e.clientX, e.clientY)
          }
        }}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 1) {
            handlePinchZoom(e)
          } else {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
          }
        }}
        onPointerOut={() => {
          api.canvasController.hoverMask.clear()
          api.toolsController.resetMousePosition()
          pinchDistance.current = null
        }}
        onWheel={(e) => {
          if (!e.ctrlKey) {
            api.toolsController.zoom(e.deltaY)
          }
        }}
      >
      </canvas>
      <canvas
        className="touch-none w-full h-full absolute top-0 left-0 pointer-events-none pixelated"
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