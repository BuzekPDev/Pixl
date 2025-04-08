import { PropsWithChildren } from "react"

enum ButtonPad {
  sm = "p-0.5",
  md = "p-1",
  lg = "p-2",
}

export interface ToolButton {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isSelected?: boolean;
  padding?: "sm" | "md" | "lg"
}

export const ToolButton = ({
  onClick,
  isSelected,
  padding = "lg",
  children, 
}: PropsWithChildren<ToolButton>) => {
  return (
    <button
      className={`rounded-lg border-2 ${
        isSelected 
          ? "bg-neutral-600 border-purple-eva" 
          : "bg-neutral-700 border-neutral-700 hover:border-neutral-600"
        } hover:bg-neutral-600  fill-neutral-400 stroke-neutral-400 ${
          ButtonPad[padding]
        } text-neutral-400`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}