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
console.debug(`#${r.toString(16)}${g.toString(16)}${b.toString(16)}`)
  console.debug(controller.selected.key)
  return (
    <aside
      className="w-20 h-full bg-green-700 pt-20 stroke-white fill-white"
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
      <input 
        type="color" 
        value={`#${r.toString(16).padEnd(2, "0")}${g.toString(16).padEnd(2, "0")}${b.toString(16).padEnd(2, "0")}`}/>
    </aside>
  )
}