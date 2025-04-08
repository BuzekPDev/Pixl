import Sketch from "@uiw/react-color-sketch"
import { Swatch } from "./Swatch"
import { useCanvasApi } from "../context/canvasContext2d"
import { RGBA } from "../classes/ColorProcessor"
import { debounce } from "../utils/debounce"
import { icons } from "../icons"
import { useState } from "react"

interface PaletteState {
  isEditing: boolean;
  isDeleting: boolean;
  pickerColor: RGBA;
  selectedSwatch: number | null
}

export const PaletteTab = ({ isOpen }: { isOpen: boolean }) => {

  const { canvasToolsConfig } = useCanvasApi()
  const { colors } = canvasToolsConfig
  const [paletteState, setPaletteState] = useState<PaletteState>({
    isEditing: false,
    isDeleting: false,
    pickerColor: [147, 190, 230, 255], // default for the Sketch component
    selectedSwatch: null
  })

  const handlePalettePick = (rgba: RGBA) => {
    colors.setActive(rgba, 0)
  }

  const handlePickerChange = debounce(({ rgb }) => {
    const { r, g, b } = rgb
    setPaletteState(s => ({ ...s, pickerColor: [r, g, b, 255] }))
    if (paletteState.selectedSwatch !== null) {
      colors.setPalette([r, g, b, 255], paletteState.selectedSwatch)
    }
  }, 200)

  const handleAddColor = () => {
    colors.addToPalette(paletteState.pickerColor)
  }

  const handleDeleteToggle = () => {
    setPaletteState(s => ({
      ...s,
      isDeleting: !s.isDeleting
    }))
  }

  const handleDeleteColor = (index: number) => {
    colors.deleteFromPalette(index)
  }

  const handleEditToggle = () => {
    setPaletteState(s => ({
      ...s,
      isEditing: !s.isEditing,
      isDeleting: s.isEditing
        ? false
        : s.isDeleting,
      selectedSwatch: s.isEditing
        ? null
        : s.selectedSwatch
    }))
  }

  return (
    <div className={`${isOpen ? "flex" : "hidden"} flex-col gap-4 w-full flex-1 bg-neutral-800`}>
      <Sketch
        style={{ boxShadow: 'none', appearance: "none", backgroundColor: "#262626", borderRadius: 0, padding: 0 }}
        presetColors={false}
        disableAlpha
        onChange={handlePickerChange}
      />
      <div>
        <div className="flex justify-between w-50 mx-auto bg-neutral-700">
          <button
            className={`flex items-center gap-1 ${paletteState.isEditing
              ? "text-purple-eva hover:text-purple-eva-dark fill-purple-eva hover:fill-purple-eva-dark"
              : "text-neutral-400 hover:text-neutral-300 fill-neutral-400 hover:fill-neutral-300"
              }`}
            onClick={handleEditToggle}
          >
            {icons.pencil}
            Edit
          </button>
          {paletteState.isEditing
            ? (
              <button
                className={`flex items-center gap-1 ${paletteState.isDeleting
                  ? "text-purple-eva stroke-purple-eva hover:text-purple-eva-dark hover:stroke-purple-eva-dark"
                  : "text-neutral-400 hover:text-neutral-300 stroke-neutral-400 hover:stroke-neutral-300"
                  }`}
                onClick={handleDeleteToggle}
              >
                {icons.delete}
                Delete
              </button>
            )
            : (
              <button
                className="flex items-center gap-1 text-neutral-400 hover:text-neutral-300 fill-neutral-400 hover:fill-neutral-300"
                onClick={handleAddColor}
              >
                {icons.plus}
                Add
              </button>
            )
          }
        </div>
        {/* h-30 only at lg breakpoint so hidden swatches can be seen 
          on ios&iPadOS as they don't support scrollbar customization  
        */}
        <div className="grid grid-cols-5 row-auto auto-rows-[36px] gap-1 justify-items-center w-50 h-24 lg:h-30 mx-auto py-2 scrollable">
          {colors.palette.map((rgba, i) => (
            <Swatch
              key={i} // index for key should be fine here
              color={rgba}
              size="md"
              isSelected={paletteState.selectedSwatch === i}
              onClick={() => {
                if (paletteState.isDeleting) {
                  handleDeleteColor(i)
                } else if (paletteState.isEditing) {
                  setPaletteState(s => ({ ...s, selectedSwatch: i }))
                } else {
                  handlePalettePick(rgba)
                }
              }}
            >
              {paletteState.isDeleting
                ? (
                  <div className="w-full h-full relative">
                    <div className="w-full h-full bg-black opacity-40 absolute"></div>
                    <div className="w-full h-full absolute">{icons.delete}</div>
                  </div>
                )
                : null
              }
            </Swatch>
          ))}
        </div>
      </div>
      <div>

        {canvasToolsConfig[canvasToolsConfig.selectedTool.name]?.width
          ? (
            <>
              <div className="w-50 mx-auto text-center bg-neutral-700">Tool size</div>
              <div className="flex justify-between w-50 mx-auto bg-neutral-700">

                <div className="flex justify-center items-center w-4 h-4">
                  <div className="w-1 h-1 bg-neutral-400"></div>
                </div>
                
                <div className="flex items-center relative">
                  <div 
                    className="h-1.5 bg-purple-eva rounded-lg pointer-events-none absolute" 
                    style={{
                      width: `${canvasToolsConfig[canvasToolsConfig.selectedTool.name].width * 10}%`
                    }}
                  />
                  <input
                    type="range"
                    onChange={({ target }) => {
                      const val = parseInt(target.value)
                      const toolName = canvasToolsConfig.selectedTool.name
                      canvasToolsConfig[toolName].setWidth(val)
                    }}
                    min={1}
                    max={10}
                    value={canvasToolsConfig[canvasToolsConfig.selectedTool.name].width}
                  />
                </div>

                <div className="flex justify-center items-center w-4 h-4">
                  <div className="w-2.5 h-2.5 bg-neutral-400"></div>
                </div>
              </div>
              <div className="w-50 mx-auto text-center bg-neutral-700">{canvasToolsConfig[canvasToolsConfig.selectedTool.name].width}</div>
            </>
          )
          : null
        }
      </div>
    </div>
  )
}