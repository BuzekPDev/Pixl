import { useMemo } from "react";
import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons";
import { ToolButton } from "./ToolButton"
import Block from "@uiw/react-color-block";
import { ColorPicker } from "./Swatch";
import { ColorHub, ColorPalette, ColorSelect } from "./ColorPalette";

export const ToolPanel = () => {

  const { controller, canvasToolsConfig } = useCanvasApi();
  const { colors } = canvasToolsConfig

  const [r,g,b] = useMemo(() => {
    return colors.palette[colors.current]
  }, [colors.current, colors.palette])


  return (
    <aside
      className="flex flex-col items-center gap-2 w-20 h-full bg-neutral-800 pt-10 stroke-white fill-white"
    >
      <ToolButton
        onClick={() => {
          controller.selected.set("pencil", "hold")
        }}
        isSelected={controller.selected.name === 'pencil'}
      >
        {icons.pencil}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("eraser", "hold")
        }}
        isSelected={controller.selected.name === 'eraser'}
      >
        {icons.eraser}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("hand", "hold")
        }}
        isSelected={controller.selected.name === 'hand'}
      >
        {icons.hand}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("bucket", "click")
        }}
        isSelected={controller.selected.name === 'bucket'}
      >
        {icons.bucket}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("rect", "drag")
        }}
        isSelected={controller.selected.name === 'rect'}
      >
        {icons.rect}
      </ToolButton>
      <ColorHub />
    </aside>
  )
}