import { PropsWithChildren } from "react"

export interface ToolButton {
  onClick: () => void;
  isSelected?: boolean
}

export const ToolButton = ({
  onClick,
  isSelected,
  children, 
}: PropsWithChildren<ToolButton>) => {
  return (
    <button
      className={`rounded-lg ${isSelected ? "bg-neutral-600" : "bg-neutral-700"} hover:bg-neutral-600 fill-neutral-400 stroke-neutral-400 p-2`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}