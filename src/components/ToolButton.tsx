import { PropsWithChildren } from "react"

export interface ToolButton {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isSelected?: boolean
}

export const ToolButton = ({
  onClick,
  isSelected,
  children, 
}: PropsWithChildren<ToolButton>) => {
  return (
    <button
      className={`rounded-lg border-2 ${isSelected ? "bg-neutral-600 border-purple-eva" : "bg-neutral-700 border-neutral-700 hover:border-neutral-600"} hover:bg-neutral-600  fill-neutral-400 stroke-neutral-400 p-2`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}