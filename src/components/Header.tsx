import { useCallback, useEffect, useState } from "react"
import { useCanvasApi } from "../context/canvasContext2d"
import { debounce } from "../utils/debounce"
import { icons } from "../icons"
import Logo from "../assets/Pixl_logo.png"
import { ToolButton } from "./ToolButton"

export const Header = ({ fileName, changeFileName }: { fileName: string, changeFileName: (e) => void }) => {

  const { viewportManager, canvasController, frameManager, importFile, importGif } = useCanvasApi()

  return (
    <header
      className="grid grid-cols-3 absolute h-16 w-full top-0 left-0 bg-neutral-800"
    >

      <div className="flex items-center gap-4 ml-5">
        <img className="h-10 hidden md:block" src={Logo} />
      </div>
      <div className="flex justify-center items-center fill-white relative">
        <div className="flex relative"> 
        <input
          className="appearance-none pr-6 text-lg text-white text-center outline-0 border-b border-transparent focus:border-b-neutral-400"
          type="text"
          placeholder="New Pixl project"
          style={{ width: `${Math.max(fileName.length+5, 18)}ch` }}
          value={fileName}
          maxLength={40}
          onChange={changeFileName}
        />
        <div className="absolute right-0 bottom-1/2 translate-y-1/2 pointer-events-none">
          {icons.pencil}
        </div>
        </div>
      </div>
      <div className="w-10 h-10"></div>
      {/* <input
        type="number"
        value={dims.width}
        onChange={(e) => {
          const width = parseInt(e.target.value)
          setDims(d => ({ ...d, width }))
          widthResizeDebounce(width)
        }}
      />
      <input
        type="number"
        value={dims.height}
        onChange={(e) => {
          const height = parseInt(e.target.value)
          console.debug(height)
          setDims(d => ({ ...d, height }))
          heightResizeDebounce(height)
        }}
      />
      <button onClick={() => frameManager.exportAsGif()}>download gif</button>
      <button onClick={() => frameManager.exportAsImage("png", "shinjer")}>download png</button>
      <button onClick={() => frameManager.exportAsImage("jpeg", "shinjer")}>download jpeg</button>
       */}
    </header>
  )
}