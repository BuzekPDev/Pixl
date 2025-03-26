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
      className="bg-slate-700 text-white p-2"
      onClick={onClick}
    >
      {children}
    </button>
  )
}