import { icons } from "../icons"
import { ToolButton } from "./ToolButton"

export const Header = ({
  fileName,
  changeFileName,
  openPanel,
  panelState
}: {
  fileName: string,
  changeFileName: (e: React.ChangeEvent<HTMLInputElement>) => void,
  openPanel: (panel: "tools" | "tabbed") => void;
  panelState: {tools: boolean, tabbed: boolean}
}) => {


  return (
    <header
      className="grid lg:grid-cols-[200px_1fr_200px] grid-cols-[80px_1fr_80px] w-full lg:h-16 h-14 px-4 top-0 left-0 bg-neutral-800 absolute z-70"
    >
      <div className="flex items-center gap-4">
        <img className="h-10 hidden lg:block" src="/assets/Pixl_logo.png" />
        <div className="lg:hidden">
          <ToolButton
            onClick={() => openPanel("tools")}
            isSelected={panelState.tools}
          >
            {icons.brushAndPalette}
          </ToolButton>
        </div>
      </div>
      <div className="flex justify-center items-center grow-0 fill-white relative overflow-hidden">
        <div className="flex relative">
          <input
            className="appearance-none pr-6 text-lg text-white text-center outline-0 border-b border-transparent focus:border-b-neutral-400"
            type="text"
            placeholder="New Pixl project"
            style={{ width: `${Math.max(fileName.length + 5, 18)}ch` }} // +5 to make up for padding and prevent hidden overflow
            value={fileName}
            maxLength={40}
            onChange={changeFileName}
          />
          <div className="absolute right-0 bottom-1/2 translate-y-1/2 pointer-events-none">
            {icons.pencil}
          </div>
        </div>
      </div>
      <div className="flex items-center place-self-end w-fit h-full">
        <div className="lg:hidden">
          <ToolButton
            onClick={() => openPanel("tabbed")}
            isSelected={panelState.tabbed}
          >
            {icons.frames}
          </ToolButton>
        </div>
      </div>
    </header>
  )
}