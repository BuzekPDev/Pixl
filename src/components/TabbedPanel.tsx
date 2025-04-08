import { useState } from "react"
import { AnimationTab } from "./AnimationTab"
import { PaletteTab } from "./PaletteTab"
import { ToolButton } from "./ToolButton"

export const TabbedPanel = ({ isOpen }: { isOpen: boolean }) => {

  const [tab, setTab] = useState("animation")

  return (
    <aside className={`flex flex-col min-w-55 h-full flex-1 pt-14 lg:pb-0 lg:pt-16 bg-neutral-800 text-white lg:static absolute z-50 right-0 overflow-hidden transition-transform lg:translate-0 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
      <div className="grid grid-cols-2 gap-2 w-50 mx-auto mb-2">
        <ToolButton 
          padding="sm"
          onClick={() => setTab("animation")}
          isSelected={tab === "animation"}
        >
          Animation
        </ToolButton>
        <ToolButton
          padding="sm"
          onClick={() => setTab("palette")}
          isSelected={tab === "palette"}
        >
          Palette
        </ToolButton>
      </div>
      <div className="min-h-0">
        <AnimationTab isOpen={tab === "animation"}/>
        <PaletteTab isOpen={tab === "palette"}/>
      </div>
    </aside>
  )
}