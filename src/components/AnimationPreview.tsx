import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons"
import { Minimap } from "./Minimap"
import { ResolutionControls } from "./ResolutionControls"

export const AnimationPreview = ({pattern}: {pattern: string}) => {

  const { frameManager }= useCanvasApi()
  
  return (
    <div className="w-full h-fit">
      <div className="flex justify-center items-center w-50 mx-auto px-4 bg-neutral-700">
        <ResolutionControls />
      </div>
      <Minimap pattern={pattern}/>
      <div className="flex w-50 mx-auto gap-2 bg-neutral-700 text-neutral-400">
        <button 
          className="transition-colors duration-50 stroke-neutral-400 fill-neutral-400 hover:stroke-neutral-300 hover:fill-neutral-300 p-1"
          onClick={() => 
            frameManager.isAnimationPaused 
              ? frameManager.startAnimationPreview()
              : frameManager.pauseAnimationPreview()
          }
        >
          {frameManager.isAnimationPaused ? icons.play : icons.pause}
        </button>
        <input className="w-full" type="range" min={1} max={24} name="framerate" onChange={({target}) => frameManager.changeAnimationSpeed(parseInt(target.value))}/>
        <label className="px-1 text-nowrap w-14 block shrink-0" htmlFor="framerate">{frameManager.animationSpeed} FPS</label>
      </div>
    </div>
  )
}