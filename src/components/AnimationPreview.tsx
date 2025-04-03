import { useEffect, useMemo, useRef } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { getPattern } from "../graphicsUtils/getPattern"

export const AnimationPreview = () => {

  const { frameManager, viewportManager } = useCanvasApi()
  const { resolution } = viewportManager.getDimensions()

  const aspectRatio = useMemo(() => resolution.width / resolution.height, [resolution])
  const transparencyGridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const createGridBackground = async () => {
      if (!transparencyGridRef.current) return

      const gridCanvas = new OffscreenCanvas(16, 16)
      const patternCanvas = getPattern(8)
      const ctx = gridCanvas.getContext("2d")
      if (!ctx || !patternCanvas) {
        throw new Error("Animation preview transparency canvas not ready")
      }

      patternCanvas.toBlob((blob) => {
        if (!blob || !transparencyGridRef.current) return
        const objURL = URL.createObjectURL(blob)
        transparencyGridRef.current.style.backgroundImage = `url(${objURL})`

      }, "image/png")
    }
    createGridBackground()
  }, [aspectRatio])

  const previewDims = useMemo(() => {
    const scale = 200 / Math.max(resolution.width, resolution.height)
    return {
      width: resolution.width * scale,
      height: resolution.height * scale
    }
  }, [resolution])

  return (
    <div 
      className="relative flex justify-center items-center mx-auto w-50 h-50 min-h-50 bg-cover"   
    >
      <div
        ref={transparencyGridRef}
        className="w-full m-auto top-0 left-0 shrink-0 bg-repeat"
        style={{
          imageRendering: "pixelated",
          width: previewDims.width,
          height: previewDims.height
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