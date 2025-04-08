import { useState } from 'react'
import './App.css'
import { CanvasLayers } from './components/CanvasLayers'
import { SizeObserver } from './components/SizeObserver'
import { Header } from './components/Header'
import { ToolPanel } from './components/ToolPanel'
import { Taskbar } from './components/Taskbar'
import { TabbedPanel } from './components/TabbedPanel'

function App() {

  const [fileName, setFileName] = useState("New Pixl project")
  const [panelOpenState, setPanelOpenState] = useState({
    tools: false,
    tabbed: false
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value)
  }

  return (
    <div className='flex h-dvh w-full overflow-hidden relative select-none'>
      <Header 
        fileName={fileName} 
        changeFileName={handleNameChange} 
        openPanel={(panel: "tools" | "tabbed") => {
          setPanelOpenState(o => ({...o, [panel]: !o[panel]}))
        }}
        panelState={panelOpenState}
      />
      <ToolPanel 
        isOpen={panelOpenState.tools} 
        fileName={fileName} 
      />
      <main className='h-full box-border w-full pt-14 lg:pt-16 pb-14 lg:pb-0'>
        <SizeObserver>
          <CanvasLayers
            canvasWidth={640}
            canvasHeight={640}
            width={1024}
            height={1024}
          />
        </SizeObserver>
      </main>
      <TabbedPanel 
        isOpen={panelOpenState.tabbed} 
      />
      <Taskbar />
    </div>
  )
}

export default App
