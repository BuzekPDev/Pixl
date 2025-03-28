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
      className="w-20 h-full bg-neutral-800 pt-10 stroke-white fill-white"
    >
      <ToolButton
        onClick={() => {
          controller.selected.set("pencil")
        }}
        isSelected={controller.selected.key === 'pencil'}
      >
        {icons.pencil}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("eraser")
        }}
        isSelected={controller.selected.key === 'eraser'}
      >
        {icons.eraser}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("hand")
        }}
        isSelected={controller.selected.key === 'hand'}
      >
        {icons.hand}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("bucket")
        }}
        isSelected={controller.selected.key === 'bucket'}
      >
        {icons.bucket}
      </ToolButton>
      <ToolButton
        onClick={() => {
          controller.selected.set("rect")
        }}
        isSelected={controller.selected.key === 'rect'}
      >
        {icons.rect}
      </ToolButton>
      <ColorHub />
    </aside>
  )
}