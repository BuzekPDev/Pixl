import { PropsWithChildren } from "react"
import { RGBA } from "../classes/ColorProcessor"

export interface ColorPickerProps {
  color: RGBA;
  onClick: () => void;
  size: "sm" | "md" | "lg";
  isSelected?: boolean;
}

enum SIZE {
  "sm" = "w-7 h-7",
  "md" = "w-8 h-8",
  "lg" = "w-9 h-9"
}

export const Swatch = ({color, onClick, size, isSelected = false, children}: PropsWithChildren<ColorPickerProps>) => {
  const [r,g,b] = color

  return (
    <button
      className={`${SIZE[size]} border-3 ${
        isSelected 
          ? "border-purple-eva hover:border-purple-eva-dark" 
          : "border-neutral-500 hover:border-neutral-400"
        } rounded-lg  stroke-neutral-400 hover:stroke-neutral-300`}
      style={{backgroundColor:`rgb(${r},${g},${b})`}}
      onClick={onClick}
    >
      {children}
    </button>
  )
}