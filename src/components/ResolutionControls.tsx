import { useCallback, useEffect, useState } from "react"
import { icons } from "../icons"
import { debounce } from "../utils/debounce"
import { useCanvasApi } from "../context/canvasContext2d"

export const ResolutionControls = () => {

  const [dims, setDims] = useState({
    width: 64,
    height: 64
  })
  const { viewportManager, canvasController, frameManager, importFile, importGif } = useCanvasApi()
  const { changeResolution } = canvasController
  const { resolution } = viewportManager.getDimensions()

  useEffect(() => {
    if (dims.width !== resolution.width || dims.height !== resolution.height) {
      setDims(resolution)
    }
  }, [resolution])
  const widthResizeDebounce = useCallback(debounce(
    (num) => {
      const { resolution } = viewportManager.getDimensions()
      changeResolution({
        width: num,
        height: resolution.height
      })
    }, 500)
    , [])

  const heightResizeDebounce = useCallback(debounce(
    (num) => {
      const { resolution } = viewportManager.getDimensions()
      changeResolution({
        width: resolution.width,
        height: num
      })
    }, 500)
    , [])


  return (
    <div className="flex justify-between w-full py-1 fill-white">
      <div className="flex items-center relative">
        <div className="absolute left-0">{icons.horizontalArrow}</div>
        <input
          className="appearance-none w-12 ml-6 pr-2 border-b border-transparent hover:border-neutral-400 focus:border-neutral-400"
          type="number"
          onChange={({ target }) => {
            const width = Math.min(parseInt(target.value), 512)
            widthResizeDebounce(width)
            setDims(d => ({ ...d, width }))
          }}
          value={dims.width}
        />
        <span className="absolute right-0">px</span>
      </div>
      <div className="flex items-center relative">
        <div className="absolute left-0">{icons.horizontalArrow}</div>
        <input
          className="appearance-none w-12 ml-6 pr-2 border-b border-transparent hover:border-neutral-400 focus:border-neutral-400"
          type="number"
          onChange={({ target }) => {
            const height = Math.min(parseInt(target.value), 512)
            heightResizeDebounce(height)
            setDims(d => ({ ...d, height }))
          }}
          value={dims.height}
        />
        <span className="absolute right-0">px</span>
      </div>
    </div>

  )
}