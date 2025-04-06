import { useEffect } from "react";
import { FrameData } from "../classes/CanvasFrameManager"
import { useCanvasApi } from "../context/canvasContext2d"
import { getAdjustedDimensions } from "../graphicsUtils/getAdjustedDimensions";
import { icons } from "../icons";

export interface FramePreviewProps {
  frame: FrameData;
  pattern: string;
  frameIndex: number
}

export const FramePreview = ({ frame, pattern, frameIndex }: FramePreviewProps) => {

  const { frameManager, canvasController } = useCanvasApi()
  const { resolution } = canvasController.getCanvasDimensions()

  const currentFrameIndex = frameManager.getCurrentFrameIndex()

  const baseSize = 128
  const { width, height } = getAdjustedDimensions(resolution.width, resolution.height, baseSize)

  const handleFrameSwitch = () => {
    frameManager.setCurrentFrame(frameIndex)
    canvasController.clearCanvas()
    canvasController.drawCanvas()
    if (canvasController.onionSkin.isEnabled) {
      canvasController.onionSkin.clear()
      canvasController.onionSkin.draw()
    }
  }

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation()
    frameManager.deleteFrame(frameIndex)
    canvasController.clearCanvas()
    canvasController.drawCanvas()
    if (canvasController.onionSkin.isEnabled) {
      canvasController.onionSkin.clear()
      canvasController.onionSkin.draw()
    }
  }

  const isSelected = currentFrameIndex === frameIndex

  return (
    <li
      className={`flex justify-center items-center mx-auto w-35 h-35 relative border-2 ${isSelected ? "border-purple-eva" : "border-neutral-600"} group`}
      onClick={handleFrameSwitch}
    >
      <button 
        className={ // pl & pb only as the list item already has a 2px border
          `absolute z-20 top-0 right-0 stroke-white pl-0.5 pb-0.5 ${
            isSelected ? "bg-purple-eva" : "bg-neutral-600 md:hidden group-hover:block"}`
        }
        onClick={handleDelete}
      >
        {icons.delete}
      </button>
      <div className="w-fit h-fit relative">
        <div style={{ backgroundImage: `url(${pattern})`, width: width, height: height }}></div>
        <canvas
          className="top-0 pixelated absolute"
          width={width}
          height={height}
          ref={ref => {
            if (!ref) return
            if (frameIndex === currentFrameIndex) {
              // only need to keep reference to the current frame
              // since the others won't be updating
              frameManager.currentFrameRef.current = ref
            }
            const ctx = ref.getContext("2d")
            // throwing an error cause im not actually sure if this CAN happen
            // and would like to see it in case it does 
            if (!ctx) {
              throw new Error("Frame preview canvas context is null")
            }

            ctx.imageSmoothingEnabled = false
            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(frame.buffer.canvas, 0, 0, resolution.width, resolution.height, 0, 0, width, height)
          }}
        />
      </div>
    </li>
  )
}