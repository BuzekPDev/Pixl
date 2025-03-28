import { RGBA } from "../classes/ColorProcessor"
import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons"
import { Swatch } from "./Swatch"

export const ColorHub = () => {

  const { colors } = useCanvasApi().canvasToolsConfig

  return (
    <div className="flex flex-col justify-center items-center w-fit bg-neutral-800 p-2 ">
      <div className="flex gap-2">
        <ColorSwap />
      </div>
      <div>
        <ColorPalette />
      </div>
    </div>
  )
}

const ColorPalette = () => {

  const { colors } = useCanvasApi().canvasToolsConfig

  return (
    <div>
      {colors.palette.map((color: RGBA)=> (
        <Swatch
          color={color} 
          onClick={() => {}}
          size="sm"
        />
      ))}
    </div>
  )
}

const ColorSwap = () => {

  const { colors } = useCanvasApi().canvasToolsConfig

  return (
    <div className="relative w-13 h-13">
      <div className="absolute bottom-0 right-0">
        <Swatch 
          color={colors.activePair[1]} 
          size="sm"
          onClick={() => {}} 
        />
      </div>
      <div className="absolute top-0 left-0">
        <Swatch 
          color={colors.activePair[0]} 
          onClick={() => {}}
          size="lg" 
          isSelected={true} 
        />
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