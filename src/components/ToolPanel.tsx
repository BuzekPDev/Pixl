import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons";
import { ToolButton } from "./ToolButton"

export const ToolPanel = () => {

  const { controller } = useCanvasApi();

  return (
    <aside
      className="w-80 h-full bg-green-700 pt-20 stroke-white fill-white"
    >
      <ToolButton
        onClick={() => {
          controller.selected.set("pencil")
        }}
      >
        {icons.pencil}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("eraser")
        }}
      >
        {icons.eraser}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("move")
        }}
      >
        {icons.hand}
      </ToolButton>
    </aside>
  )
}