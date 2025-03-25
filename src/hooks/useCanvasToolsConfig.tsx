import { useState } from "react";
import { RGBA } from "../classes/ColorProcessor";

export interface CanvasToolsConfig {
  selectedTool: SelectedTool; // tool key
  colors: ColorOptions;
  pencil: ToolOptions;
  eraser: ToolOptions;
}

export interface SelectedTool {
  key: ToolType;
  set: (key: ToolType) => void
}

export interface ColorOptions {
  palette: RGBA[];
  current: number;
  setCurrent: (index: number) => void;
  setPalette: (color: RGBA, index: number) => void
}

export type ToolType = "pencil" | "eraser"

type ColorState = Omit<ColorOptions, "setCurrent" | "setPalette">

type ToolState = Omit<ToolOptions, "setWidth">

export interface ToolOptions {
  width: number;
  setWidth: (width: number) => void;
}


export const useCanvasToolsConfig = (): CanvasToolsConfig => {

  const [colorOptions, setColorOptions] =
    useState<ColorState>({
      palette: [[255, 0 , 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
      current: 0
    })

  const [selectedTool, setSelectedTool] = useState<ToolType>("pencil")

  const [pencilToolOptions, setPencilToolOptions] =
    useState<ToolState>({
      width: 1
    })

  const [eraserOptions, setEraserOptions] =
    useState<ToolState>({
      width: 1
    })

  return {
    selectedTool: {
      key: selectedTool,
      set: (key: ToolType) => setSelectedTool(key)
    },
    colors: {
      ...colorOptions,
      setCurrent: (index: number) => setColorOptions(c => ({ ...c, current: index })),
      setPalette: (color: RGBA, index: number) => 
        setColorOptions(c => ({ 
          ...c, 
          palette: c.palette.map((c: RGBA, i: number) => i === index ? color : c) 
        }))
    },
    pencil: {
      ...pencilToolOptions,
      setWidth: (width: number) => setPencilToolOptions(p => ({...p, width: width}))
    },
    eraser: {
      ...eraserOptions,
      setWidth: (width: number) => setEraserOptions(p => ({...p, width: width}))
    }
  }
}