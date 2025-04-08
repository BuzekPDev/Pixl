import { useCallback, useEffect, useState } from "react"
import { icons } from "../icons"
import { debounce } from "../utils/debounce"
import { useCanvasApi } from "../context/canvasContext2d"

export const ResolutionControls = () => {

  const [dims, setDims] = useState({
    width: 64,
    height: 64
  })
  const { viewportManager, canvasController } = useCanvasApi()
  const { changeResolution } = canvasController
  const { resolution } = viewportManager.getDimensions()

  useEffect(() => {
    if (dims.width !== resolution.width || dims.height !== resolution.height) {
      setDims(resolution)
    }
  }, [resolution])

  const resize = useCallback(
    debounce((dim: { width?: number, height?: number }) => {
      const { resolution } = viewportManager.getDimensions()
      changeResolution({
        ...resolution,
        ...dim
      })
    }, 500),
    []
  )

  return (
    <div className="flex justify-between w-full py-1 fill-white">
      <div className="flex items-center relative">
        <div className="absolute left-0">
          {icons.horizontalArrow}
        </div>
        <input
          className="appearance-none w-12 ml-6 pr-2 border-b border-transparent hover:border-neutral-400 focus:border-neutral-400"
          type="number"
          onChange={({ target }) => {
            const width = Math.min(parseInt(target.value), 512)
            if (Number.isNaN(width)) return
            resize({ width })
            setDims(d => ({ ...d, width }))
          }}
          value={dims.width}
        />
        <span className="absolute right-0">px</span>
      </div>
      <div className="flex items-center relative">
        <div className="absolute left-0">
          {icons.verticalArrow}
        </div>
        <input
          className="appearance-none w-12 ml-6 pr-2 border-b border-transparent hover:border-neutral-400 focus:border-neutral-400"
          type="number"
          onChange={({ target }) => {
            const height = Math.min(parseInt(target.value), 512)
            if (Number.isNaN(height)) return
            resize({ height })
            setDims(d => ({ ...d, height }))
          }}
          value={dims.height}
        />
        <span className="absolute right-0">px</span>
      </div>
    </div>

  )
}