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
  hand: any;
}

export interface SelectedTool {
  name: ToolName;
  type: ToolType;
  set: (name: ToolName, type: ToolType) => void
}

export interface ColorOptions extends ColorState {
  swapActive: () => void;
  setActive: (color: RGBA, index: number) => void;
  setCurrent: (index: number) => void;
  setPalette: (color: RGBA, index: number) => void;
  addToPalette: (color: RGBA) => void;
  deleteFromPalette: (index: number) => void
}

export type ToolName = "pencil" | "eraser" | "hand" | "zoom" | "bucket" | "rect"
export type ToolType = "click" | "hold" | "drag"

export interface ColorState {
  palette: RGBA[];
  activePair: RGBA[];
  current: number;
}

type ToolState = Omit<ToolOptions, "setWidth">

export interface ToolOptions {
  width: number;
  setWidth: (width: number) => void;
}


export const useCanvasToolsConfig = (): CanvasToolsConfig => {

  const [colorOptions, setColorOptions] =
    useState<ColorState>({
      activePair: [[0, 0, 0, 255], [255, 255, 255, 255]],
      palette: [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
      current: 0
    })

  const [selectedTool, setSelectedTool] = useState<{
    name: ToolName,
    type: ToolType
  }>({
    name: "pencil",
    type: "hold"
  })

  const [pencilToolOptions, setPencilToolOptions] =
    useState<ToolState>({
      width: 1
    })

  const [eraserToolOptions, setEraserToolOptions] =
    useState<ToolState>({
      width: 1
    })

  const [bucketToolOptions,] =
    useState<ToolState>({
      width: 1
    })

  const [rectToolOptions,] =
    useState<ToolState>({
      width: 1
    })

  return {
    selectedTool: {
      name: selectedTool.name,
      type: selectedTool.type,
      set: (name: ToolName, type: ToolType) => setSelectedTool({ name, type })
    },
    colors: {
      ...colorOptions,
      setCurrent: (index: number) => setColorOptions(c => ({ ...c, current: index })),
      setPalette: (color: RGBA, index: number) =>
        setColorOptions(c => ({
          ...c,
          palette: c.palette.map((c: RGBA, i: number) => i === index ? color : c)
        })),
      addToPalette: (color: RGBA) => setColorOptions(c => ({ ...c, palette: c.palette.concat([color]) })),
      deleteFromPalette: (index: number) => setColorOptions(c => ({
        ...c,
        palette: c.palette.filter((c: RGBA, i: number) => i !== index)
      })),
      swapActive: () => setColorOptions(o => ({ ...o, activePair: [o.activePair[1], o.activePair[0]] })),
      setActive: (color: RGBA, index: number) => {
        setColorOptions(o => ({ ...o, activePair: o.activePair.map((c, i) => i === index ? color : c) }))
      }
    },
    pencil: {
      ...pencilToolOptions,
      setWidth: (width: number) => setPencilToolOptions(p => ({ ...p, width: width }))
    },
    eraser: {
      ...eraserToolOptions,
      setWidth: (width: number) => setEraserToolOptions(p => ({ ...p, width: width }))
    },
    bucket: {
      ...bucketToolOptions,
      setWidth: () => { }
    },
    rect: {
      ...rectToolOptions,
      setWidth: () => { }
    },
    zoom: {},
    hand: {}
  }
}