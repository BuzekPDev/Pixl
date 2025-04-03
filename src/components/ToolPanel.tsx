import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons";
import { ToolButton } from "./ToolButton"
import { ColorHub } from "./ColorPalette";

export const ToolPanel = () => {

  const { toolsController } = useCanvasApi();

  return (
    <aside
      className="flex flex-col shrink-0 grow-0 items-center gap-2 min-w-20 w-20 h-full bg-neutral-800 pt-10 stroke-white fill-white"
    >
      <ToolButton
        onClick={() => {
          toolsController.selected.set("pencil", "hold")
        }}
        isSelected={toolsController.selected.name === 'pencil'}
      >
        {icons.pencil}
      </ToolButton>
      <ToolButton
        onClick={() => {
          toolsController.selected.set("eraser", "hold")
        }}
        isSelected={toolsController.selected.name === 'eraser'}
      >
        {icons.eraser}
      </ToolButton>
      <ToolButton
        onClick={() => {
          toolsController.selected.set("hand", "hold")
        }}
        isSelected={toolsController.selected.name === 'hand'}
      >
        {icons.hand}
      </ToolButton>
      <ToolButton
        onClick={() => {
          toolsController.selected.set("bucket", "click")
        }}
        isSelected={toolsController.selected.name === 'bucket'}
      >
        {icons.bucket}
      </ToolButton>
      <ToolButton
        onClick={() => {
          toolsController.selected.set("rect", "drag")
        }}
        isSelected={toolsController.selected.name === 'rect'}
      >
        {icons.rect}
      </ToolButton>
      <ColorHub />
    </aside>
  )
}