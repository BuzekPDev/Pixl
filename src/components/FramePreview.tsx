import { useMemo } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { AnimationPreview } from "./AnimationPreview"

export const FramePreview = () => {

  const { frameManager, drawCanvas, clearCanvas, drawOnionSkin, canvasViewportConfig } = useCanvasApi()
  const { resolution } = canvasViewportConfig.dimensions.ref.current

  const aspectRatio = useMemo(() => resolution.width / resolution.height, [resolution])

  const handleNewFrame = () => {
    frameManager.addFrame()
    drawCanvas()
    clearCanvas()
    drawOnionSkin()
  }

  return (
    <aside className="flex flex-col w-80 h-full pt-20 bg-neutral-800 text-white">
      <AnimationPreview></AnimationPreview>
      <label htmlFor="fps">
        framerate
        <input type="range" name="fps" min={1} max={60} defaultValue={12} onChange={(e) => {
          frameManager.changeAnimationSpeed(parseInt(e.target.value))
        }} />
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
                className={`flex flex-col justify-center items-center ${frameIndex === i ? "border-2 border-red-500" : ""}`}
                onClick={() => {
                  frameManager.setCurrentFrame(i)
                  clearCanvas()
                  drawCanvas()
                  drawOnionSkin()
                }}>
                <span>frame {i} <button onClick={(e) => { e.stopPropagation(); frameManager.deleteFrame(i) }}>del</button></span>
                <canvas
                  width={Math.round(64 * aspectRatio)}
                  height={64}
                  key={frameData.id} ref={(ref) => {
                    if (!ref) return
                    const ctx = ref?.getContext("2d")

                    if (ctx) {
                      ctx.clearRect(0, 0, Math.round(64 * aspectRatio), 64)
                      ctx.drawImage(frameData.buffer.canvas, 0, 0, resolution.width, resolution.height, 0, 0, Math.round(64 * aspectRatio), 64)

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