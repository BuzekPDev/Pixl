import { useState } from 'react'
import './App.css'
import { Canvas } from './components/Canvas'
import { SizeObserver } from './components/SizeObserver'
import { Header } from './components/Header'
import { ToolPanel } from './components/ToolPanel'
import { AnimationPanel } from './components/AnimationPanel'

function App() {

  const [fileName, setFileName] = useState("New Pixl project")
  const [layoutState, setLayoutState] = useState({
    header: false,
    toolPanel: false,
    animationPanel: false
  })

  const handleNameChange = (e) => {
    setFileName(e.target.value)
  } 

  return (
    <div className='flex h-dvh relative select-none'>
      <Header fileName={fileName} changeFileName={handleNameChange}/>
      <ToolPanel isOpen={layoutState.toolPanel} fileName={fileName}/>
      <main className='h-full box-border w-full pt-16'>
        <SizeObserver>
          <Canvas
            canvasWidth={640}
            canvasHeight={640}
            width={1024}
            height={1024}
          />
        </SizeObserver>
      </main>
      <AnimationPanel isOpen={layoutState.animationPanel}/>
    </div>
  )
}

export default App
