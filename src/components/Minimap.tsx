import { useMemo, useRef } from "react"
import { useCanvasApi } from "../context/canvasContext2d"

export const Minimap = ({pattern}: {pattern: string}) => {

  const { frameManager, viewportManager } = useCanvasApi()
  const { resolution } = viewportManager.getDimensions()

  const transparencyGridRef = useRef<HTMLDivElement | null>(null)

  const previewDims = useMemo(() => {
    const scale = 200 / Math.max(resolution.width, resolution.height)
    return {
      width: resolution.width * scale,
      height: resolution.height * scale
    }
  }, [resolution])

  return (
    <div 
      className="relative flex justify-center items-center mx-auto w-50 h-50 min-h-50 bg-cover bg-neutral-700"   
    >
      <div
        ref={transparencyGridRef}
        className="w-full mx-auto top-0 left-0 shrink-0 bg-repeat "
        style={{
          imageRendering: "pixelated",
          width: previewDims.width,
          height: previewDims.height,
          backgroundImage: `url(${pattern})`
        }}
      />
      <div
        ref={frameManager.animationPreviewRef}
        className="absolute w-full m-auto shrink-0 bg-contain bg-no-repeat"
        style={{
          imageRendering: "pixelated",
          width: previewDims.width,
          height: previewDims.height
        }}
      />
    </div>
  )
}