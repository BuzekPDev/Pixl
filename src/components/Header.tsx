import { useCallback, useState } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { debounce } from "../utils/debounce"


export const Header = () => {

  const [dims, setDims] = useState({
    width: 64,
    height: 64
  })
  const { viewportManager, canvasController } = useCanvasApi()
  const { changeResolution } = canvasController

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
    <header
      className="absolute h-10 w-full top-0 left-0 bg-neutral-800"
    >
      <input
        type="number"
        value={dims.width}
        onChange={(e) => {
          const width = parseInt(e.target.value)
          setDims(d => ({ ...d, width }))
          widthResizeDebounce(width)
        }}
      />
      <input
        type="number"
        value={dims.height}
        onChange={(e) => {
          const height = parseInt(e.target.value)
          console.debug(height)
          setDims(d => ({ ...d, height }))
          heightResizeDebounce(height)
        }}
      />
    </header>
  )
}