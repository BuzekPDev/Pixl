import { useState } from "react";
import { RGBA } from "../classes/ColorProcessor";

export interface CanvasToolsConfig {
  colors: ColorOptions;
  pencil: ToolOptions;
  eraser: ToolOptions;
}

export interface ColorOptions {
  palette: RGBA[];
  current: number;
  setCurrent: (index: number) => void;
  setPalette: (color: RGBA, index: number) => void
}

type ColorState = Omit<ColorOptions, "setCurrent" | "setPalette">

type ToolState = Omit<ToolOptions, "setWidth">

export interface ToolOptions {
  width: number;
  setWidth: (width: number) => void;
}


export const useCanvasToolsConfig = (): CanvasToolsConfig => {

  const [colorOptions, setColorOptions] =
    useState<ColorState>({
      palette: [[0, 0 ,0, 255], [255, 255, 255, 255], [0, 0, 0, 0]],
      current: 0
    })

  const [pencilOptions, setPencilOptions] =
    useState<ToolState>({
      width: 1
    })

  const [eraserOptions, setEraserOptions] =
    useState<ToolState>({
      width: 1
    })

  return {
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
      ...pencilOptions,
      setWidth: (width: number) => setPencilOptions(p => ({...p, width: width}))
    },
    eraser: {
      ...eraserOptions,
      setWidth: (width: number) => setEraserOptions(p => ({...p, width: width}))
    }
  }
}