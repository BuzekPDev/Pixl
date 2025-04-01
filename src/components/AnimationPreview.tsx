import { useEffect, useMemo, useRef } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { getPattern } from "../graphicsUtils/getPattern"

export const AnimationPreview = () => {
 
  const { frameManager, canvasViewportConfig } = useCanvasApi()
  const { resolution } = canvasViewportConfig.dimensions.ref.current

  const aspectRatio = useMemo(() => resolution.width / resolution.height, [resolution])

  const transparencyGridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const createGridBackground =  async () => {
      if (!transparencyGridRef.current) return

      const gridCanvas = new OffscreenCanvas(16, 16)
      const patternCanvas = getPattern(8)
      const ctx = gridCanvas.getContext("2d")
      if (!ctx || !patternCanvas) throw new Error("Animation preview transparency canvas not ready") 
      // ctx.drawImage
       patternCanvas.toBlob((blob) => {
        if (!blob || !transparencyGridRef.current) return
        const objURL = URL.createObjectURL(blob)
        transparencyGridRef.current.style.backgroundImage = `url(${objURL})`

      }, "image/png")
      // const blob = await gridCanvas.convertToBlob()
      // const objectUrl = URL.createObjectURL(blob)
    }
    createGridBackground()
  }, [aspectRatio])

  return (
    <div className="relative flex justify-center items-center bg-cover" style={{ width: 200, height: 200, aspectRatio}}>
      <div style={{imageRendering: "pixelated", aspectRatio: Math.round(aspectRatio)}} className="absolute w-full max-h-full top-0 left-0 shrink-0 bg-repeat" ref={transparencyGridRef}></div>
      <div style={{imageRendering: "pixelated", aspectRatio: Math.round(aspectRatio)}} className="absolute w-full max-h-full top-0 left-0 shrink-0 bg-contain bg-no-repeat" ref={frameManager.animationPreviewRef} />
    </div>
  )
}