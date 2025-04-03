import { useMemo } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { AnimationPreview } from "./AnimationPreview"

export const FramePreview = () => {

  const { frameManager, canvasController, viewportManager } = useCanvasApi()
  const { resolution } = viewportManager.getDimensions()

  const aspectRatio = useMemo(() => resolution.width / resolution.height, [resolution])

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
    <aside className="flex flex-col w-80 h-full pt-20 bg-neutral-800 text-white">
      <AnimationPreview></AnimationPreview>
      <label htmlFor="fps">
        framerate
        <input type="range" name="fps" min={1} max={24} defaultValue={12} onChange={(e) => {
          frameManager.changeAnimationSpeed(parseInt(e.target.value))
        }} />
          <button onClick={() => frameManager.startAnimationPreview()}>start</button>
          <button onClick={() => frameManager.pauseAnimationPreview()}>pause</button>
          <button onClick={() => canvasController.onionSkin.toggle()}>onion skin {canvasController.onionSkin.isEnabled.toString()}</button>
        </label>
      <div className="flex flex-col shrink h-full overflow-y-scroll">
        <button onClick={handleNewFrame}>add new</button>
        <div className="flex flex-col gap-4 w-full h-full">
          {Array.from({ length: frameManager.size() }, (_, i) => i).map((_, i) => {
            const frameData = frameManager.getFrame(i)
            const frameIndex = frameManager.getCurrentFrameIndex()

            if (!frameData) return null

            return (
              <button
                className={`flex flex-col justify-center w-full max-w-full items-center ${frameIndex === i ? "border-2 border-red-500" : ""} overflow-hidden`}
                onClick={() => {
                  frameManager.setCurrentFrame(i)
                  canvasController.clearCanvas()
                  canvasController.drawCanvas()
                  if (canvasController.onionSkin.isEnabled) {
                    canvasController.onionSkin.clear()
                    canvasController.onionSkin.draw()
                  }
                }}>
                <span>frame {i} <button onClick={(e) => { e.stopPropagation(); frameManager.deleteFrame(i) }}>del</button></span>
                <canvas
                  width={64}
                  height={64/aspectRatio}
                  style={{aspectRatio}}
                  key={frameData.id} ref={(ref) => {
                    if (!ref) return
                    const ctx = ref?.getContext("2d")

                    if (ctx) {
                      ctx.clearRect(0, 0, 64, 64/aspectRatio)
                      ctx.drawImage(frameData.buffer.canvas, 0, 0, resolution.width, resolution.height, 0, 0, 64, 64/aspectRatio)

                      // only need to update the currently selected frame when drawing
                      if (i === frameIndex) {
                        frameManager.currentFrameRef.current = ref
                      }
                    }
                  }}></canvas>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}