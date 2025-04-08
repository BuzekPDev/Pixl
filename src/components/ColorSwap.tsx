import { useRef, useState } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons"
import { Swatch } from "./Swatch"
import Sketch from "@uiw/react-color-sketch"
import { debounce } from "../utils/debounce"

interface PickerState {
  index: number,
  isPicking: boolean
}

export const ColorSwap = () => {

  const [pickerState, setPickerState] = useState<PickerState>({
    index: 0,
    isPicking: false,
  })
  const { colors } = useCanvasApi().canvasToolsConfig
  const [r, g, b] = colors.activePair[pickerState.index]
  const colorSwapDebounce = debounce(colors.setActive, 100)
  const colorPickerRef = useRef<HTMLDivElement | null>(null)

  const clickAwayHandler = (e: MouseEvent) => {
    if (!colorPickerRef.current) return
    if (!colorPickerRef.current.contains(e.target as HTMLElement)) {
      setPickerState(p => ({ ...p, isPicking: false }))
      window.removeEventListener("click", clickAwayHandler)
    }
  }

  const handlePickerToggle = (index: number) => {
    setPickerState(s => ({
      index,
      isPicking: (index !== s.index && s.isPicking)
        ? s.isPicking
        : !s.isPicking
    }))
    if (!pickerState.isPicking) {
      // removes itself on click away so a bunch of them getting
      // stacked won't really be an issue
      window.addEventListener("click", clickAwayHandler)
    }
  }

  return (
    <div className="relative flex flex-col justify-center items-center w-full bg-neutral-800 p-2 ">
      <div className="flex gap-2" ref={colorPickerRef}>
        <SwatchPair
          onClick={handlePickerToggle}
        />
        {pickerState.isPicking
          ? (
            <div className="absolute left-full">
              <Sketch
                disableAlpha
                style={{ 
                  backgroundColor: "#262626", 
                  border: "none", 
                  boxShadow: "none", 
                  borderRadius: "0 8px 8px 0" 
                }}
                color={`#${ // split up like this for more readability
                  r.toString(16).padStart(2, "0")
                  }${
                  g.toString(16).padStart(2, "0")
                  }${
                  b.toString(16).padStart(2, "0")
                }`}
                onChange={({ rgb }) => 
                  colorSwapDebounce([rgb.r, rgb.g, rgb.b, 255], pickerState.index)
                }
              />
            </div>
          )
          : null
        }
      </div>
    </div>
  )
}

const SwatchPair = ({ onClick }: { onClick: (index: number) => void }) => {

  const { colors } = useCanvasApi().canvasToolsConfig

  return (
    <div className="relative w-13 h-13">
      <div className="absolute bottom-0 right-0">
        <Swatch
          color={colors.activePair[1]}
          size="sm"
          onClick={() => onClick(1)}
        >
        </Swatch>
      </div>
      <div className="absolute top-0 left-0">
        <Swatch
          color={colors.activePair[0]}
          onClick={() => onClick(0)}
          size="lg"
        >
        </Swatch>
      </div>
      <button
        className="absolute bottom-0 left-1 stroke-neutral-500 hover:stroke-neutral-400 active:stroke-neutral-300 cursor-pointer"
        onClick={() => colors.swapActive()}
      >
        {icons.bottomLeftArrow}
      </button>
      <button
        className="absolute top-1 right-0 stroke-neutral-500 hover:stroke-neutral-400 active:stroke-neutral-300 cursor-pointer"
        onClick={() => colors.swapActive()}
      >
        {icons.topRightArrow}
      </button>
    </div>
  )
}
