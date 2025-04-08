import { icons } from "../icons"
import { ToolButton } from "./ToolButton"
import { useCanvasApi } from "../context/canvasContext2d"

export const Taskbar = () => {

  const { toolsController } = useCanvasApi()

  return (
    <div className="flex items-center justify-between px-4 w-full h-14 bg-neutral-800 absolute bottom-0 lg:hidden">
      <ToolButton
        onClick={toolsController.undo}
      >
        {icons.undo}
      </ToolButton>
      <img className="h-10" src="/assets/Pixl_logo.png"/>
      <ToolButton
        onClick={toolsController.redo}
      >
        {icons.redo}
      </ToolButton>
    </div>
  )
}