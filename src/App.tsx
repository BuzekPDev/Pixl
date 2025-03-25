import { FormEvent, useEffect, useState } from 'react'
import './App.css'
import { Canvas } from './components/Canvas'
import { useCanvasApi } from './context/canvasContext2d'
import { SizeObserver } from './components/SizeObserver'

const api = "http://localhost:3000/"

const path = (pathName: string = "") => api + pathName 

function App() {

  const [dims, setDims] = useState({
    w: 64,
    h: 64
  })

  const { colors } = useCanvasApi().canvasToolsConfig
  
  useEffect(() => {

    // fetch(api, {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "text/html", 
    //   }
    // }).then(res => console.debug(res.json()))
    // fetch(api, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({message: "this is the frontend"})
    // })
    // fetch(path("user/1"), {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // })
    // .then(res => res.json())
    // .then(res => console.debug(res))
    
  }, [])

  const { canvasToolsConfig, controller } = useCanvasApi()
  // const { colors } = canvasToolsConfig
  const createUser = async ({username, password}: {
    username: string;
    password: string;
  }) => {
    fetch(path("user"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password
      })
    })
    .then(res => res.json())
    .then(res => console.debug(res))
  }

  return (
    <div className='flex h-screen'>
      <SizeObserver>
        <Canvas
          canvasWidth={640}
          canvasHeight={640}
          width={1024}
          height={1024}
        />
      </SizeObserver>
      <div>
        <label htmlFor="width">width</label>
        <input 
          // min={1}
          step={32}
          type="number" 
          name='width' 
          value={dims.w} 
          onChange={(e) => {
            const w = parseInt(e.target.value)
            // changeDimensions({resolution: {width: w, height: dims.h }})
            setDims(d => ({...d, w}))
          }}
        />
        <label htmlFor="height">height</label>
        <input 
          // min={1}
          step={32}
          type="number" 
          name='height' 
          value={dims.h} 
          onChange={(e) => {
            const h = parseInt(e.target.value)
            // changeDimensions({resolution: {width: dims.w, height: h }})
            setDims(d => ({...d, h}))
          }}
        />
        <input type="range" max={10} min={1} value={canvasToolsConfig?.pencil?.width ?? 0} onChange={(e) => canvasToolsConfig.pencil.setWidth(parseInt(e.target.value))}/>
        <button onClick={() => controller.undo()}>undo</button>
        <button onClick={() => controller.redo()}>redo</button>
        <button className='text-red-400' onClick={() => colors.setCurrent(0)}>red</button>
        <button className='text-green-400' onClick={() => colors.setCurrent(1)}>green</button>
        <button className='text-blue-400' onClick={() => colors.setCurrent(2)}>blue</button>
        <button onClick={() => pen}>eraser</button>
        <button>pencil</button>
        <button onClick={() => controller.moveDrawingArea(1, 0)}>move 1 px right</button>
        <button onClick={() => controller.moveDrawingArea(0, 1)}>move 1 px down</button>
      </div>
      <form action="post"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault()
          createUser({
            username: (e.target as HTMLFormElement).username.value as string,
            password: (e.target as HTMLFormElement).password.value as string
          })
        }}
      >
        <label htmlFor="username">username</label>
        <input type="text" name='username'/>
        <label htmlFor="password"></label>
        <input type="password" name="password" />
        <button>create</button>
      </form>
    </div>
  )
}

export default App
