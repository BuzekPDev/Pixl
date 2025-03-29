import { useState } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons"
import { Swatch } from "./Swatch"
import Sketch from "@uiw/react-color-sketch"
import { debounce } from "../utils/debounce"

interface PickerState {
  index: number,
  isPicking: boolean
}

export const ColorHub = () => {

  const [pickerState, setPickerState] = useState<PickerState>({
    index: 0,
    isPicking: false,
  })
  const { colors } = useCanvasApi().canvasToolsConfig
  const [r, g, b] = colors.activePair[pickerState.index]
  const colorSwapDebounce = debounce(colors.setActive, 100)

  const handlePickerToggle = (index: number) => {
    setPickerState(s => ({ 
      index, 
      isPicking: (index !== s.index && s.isPicking)
        ? s.isPicking 
        : !s.isPicking
      }))
  }

  return (
    <div className="relative flex flex-col justify-center items-center w-full bg-neutral-800 p-2 ">
      <div className="flex gap-2">
        <ColorSwap 
          onClick={handlePickerToggle} 
        />
        {pickerState.isPicking
          ? (
            <div className="absolute z-50 left-full">
              <Sketch
                disableAlpha
                style={{ backgroundColor: "#262626", color: "white !important", border: "none", boxShadow: "none", borderRadius: "0 8px 8px 0" }}
                color={`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`}
                onChange={({ rgb }) => colorSwapDebounce([rgb.r, rgb.g, rgb.b, 255], pickerState.index)}
              />
            </div>
          )
          : null
        }
      </div>
      {/* PALETTE TO BE ADDED WHEN I DECIDE HOW I WANT THE UI TO LOOK */}
    </div>
  )
}

const ColorSwap = ({ onClick }: { onClick: (index: number) => void }) => {

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
          isSelected={true}
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


// const ColorPalette = () => {

//   const { colors } = useCanvasApi().canvasToolsConfig

//   return (
//     <div className="flex flex-col w-full items-center">
//       {colors.palette.map((color: RGBA) => (
//         <Swatch
//           color={color}
//           onClick={() => { }}
//           size="sm"
//         />
//       ))}
//       {icons.palette}
//     </div>
//   )
// }