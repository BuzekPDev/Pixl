import { useCanvasApi } from "../context/canvasContext2d"
import { icons } from "../icons";
import { ToolButton } from "./ToolButton"
import { ColorHub } from "./ColorPalette";

export const ToolPanel = ({ isOpen, fileName }: { isOpen: boolean, fileName: string }) => {

  const { toolsController, fileController } = useCanvasApi();

  return (
    <aside
      className="flex flex-col justify-between shrink-0 grow-0 items-center min-w-20 w-20 h-full bg-neutral-800 pt-16 stroke-white fill-white"
    >
      <div className="flex flex-col items-center gap-2">
        <ToolButton
          onClick={() => {
            toolsController.selected.set("pencil", "hold")
          }}
          isSelected={toolsController.selected.name === 'pencil'}
        >
          {icons.pencil}
        </ToolButton>
        <ToolButton
          onClick={() => {
            toolsController.selected.set("eraser", "hold")
          }}
          isSelected={toolsController.selected.name === 'eraser'}
        >
          {icons.eraser}
        </ToolButton>
        <ToolButton
          onClick={() => {
            toolsController.selected.set("hand", "hold")
          }}
          isSelected={toolsController.selected.name === 'hand'}
        >
          {icons.hand}
        </ToolButton>
        <ToolButton
          onClick={() => {
            toolsController.selected.set("bucket", "click")
          }}
          isSelected={toolsController.selected.name === 'bucket'}
        >
          {icons.bucket}
        </ToolButton>
        <ToolButton
          onClick={() => {
            toolsController.selected.set("rect", "drag")
          }}
          isSelected={toolsController.selected.name === 'rect'}
        >
          {icons.rect}
        </ToolButton>
        <ColorHub />
      </div>
      <div className="flex flex-col items-center gap-2">
        <ToolButton
          onClick={(e) => {
            const button = e.target as HTMLButtonElement
            const input = button.firstChild as HTMLInputElement
            input.click()
          }}
        >
          <input className="absolute hidden" type="file" onChange={async (e) => {
            if (!e.target.files?.length) return
            fileController.importFile(e.target.files[0])
          }}/>
          {icons.folder}
        </ToolButton>
        <ToolButton
          onClick={() => fileController.exportImage("png", fileName || "New Pixl Project")}
        >
          {icons.png}
        </ToolButton>
        <ToolButton
          onClick={() => fileController.exportGif(fileName || "New Pixl Project")}
        >
          {icons.gif}
        </ToolButton>
        <a className="w-fit h-fit my-6" href="https://github.com/BuzekPDev" target="_blank">
          {icons.github}
        </a>
      </div>
    </aside>
  )
}