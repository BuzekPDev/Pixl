import { useState } from "react";
import { RGBA } from "../classes/ColorProcessor";

export interface CanvasToolsConfig {
  selectedTool: SelectedTool; // tool key
  colors: ColorOptions;
  pencil: ToolOptions;
  eraser: ToolOptions;
  bucket: ToolOptions;
  rect: ToolOptions;
  zoom: any;
  move: any;
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

export type ToolType = "pencil" | "eraser" | "move" | "zoom" | "bucket"

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

  const [eraserToolOptions, setEraserToolOptions] =
    useState<ToolState>({
      width: 1
    })

  const [bucketToolOptions, setBucketToolOptions] =
    useState<ToolState>({
      width: 1
    })

  const [rectToolOptions, setRectToolOptions] =
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
      ...eraserToolOptions,
      setWidth: (width: number) => setEraserToolOptions(p => ({...p, width: width}))
    },
    bucket: {
      ...bucketToolOptions,
      setWidth: () => {}
    },
    rect: {
      ...rectToolOptions,
      setWidth: () => {}
    },
    zoom: {},
    move: {}
  }
}