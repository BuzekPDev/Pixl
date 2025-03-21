import { useState } from "react";

export interface CanvasToolsConfig {
  colors: ColorOptions;
  pencil: ToolOptions;
  eraser: ToolOptions;
}

export interface ColorOptions {
  palette: Color[];
  current: Color;
  setCurrent: (color: Color) => void;
  setPalette: (color: Color, index: number) => void
}

type ColorState = Omit<ColorOptions, "setCurrent" | "setPalette">

type ToolState = Omit<ToolOptions, "setWidth">

export interface ToolOptions {
  width: number;
  setWidth: (width: number) => void;
}


export type Color = string

export const useCanvasToolsConfig = (): CanvasToolsConfig => {

  const [colorOptions, setColorOptions] =
    useState<ColorState>({
      palette: [],
      current: ""
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
      setCurrent: (color: Color) => setColorOptions(c => ({ ...c, current: color })),
      setPalette: (color: Color, index: number) => 
        setColorOptions(c => ({ 
          ...c, 
          palette: c.palette.map((c: Color, i: number) => i === index ? color : c) 
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