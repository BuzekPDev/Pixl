import { useMemo } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { AnimationPreview } from "./AnimationPreview"
import { getPattern } from "../graphicsUtils/getPattern"
import { FramePreview } from "./FramePreview"
import { icons } from "../icons"

export const AnimationTab = ({isOpen}: {isOpen: boolean}) => {

  const { frameManager, canvasController } = useCanvasApi()

  const pattern = useMemo(() => getPattern(8).toDataURL(), [])

  const handleNewFrame = () => {
    frameManager.addFrame()
    canvasController.drawCanvas()
    canvasController.clearCanvas()
    if (canvasController.onionSkin.isEnabled) {
      canvasController.onionSkin.clear()
      canvasController.onionSkin.draw()
    }
  }


  return (
    <div className={`${isOpen ? "flex" : "hidden"} flex-col w-full h-full`}>
      <AnimationPreview
        pattern={pattern}
      />
      <div
        className="flex flex-col flex-1 w-full gap-2 min-h-0">
        <div className="flex justify-between w-50 mx-auto gap-4 bg-neutral-700">
          <button
            className={`transition-colors duration-50 p-0.5 ${canvasController.onionSkin.isEnabled
                ? "stroke-purple-eva hover:stroke-purple-eva-dark"
                : "stroke-neutral-400 hover:stroke-neutral-300"
              }`}
            onClick={() =>
              canvasController.onionSkin.toggle()
            }
          >
            {icons.onion}
          </button>
          <button
            className="flex justify-center items-center gap-1 transition-colors duration-50 fill-neutral-400 text-neutral-400 hover:fill-neutral-300 hover:text-neutral-300"
            onClick={handleNewFrame}
          >
            <span>{icons.plus}</span>
            Add frame
          </button>
        </div>
        <div className="w-full flex-1 min-h-0 scrollable symmetrical">
          <ul className="w-50 mx-auto">
            {frameManager.getAllFrames().map((frame, i) => (
              <FramePreview
                key={frame.id}
                frame={frame}
                pattern={pattern}
                frameIndex={i}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}