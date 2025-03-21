import { FormEvent, useEffect } from 'react'
import './App.css'
import { Canvas } from './components/canvas'
import { useCanvasApi } from './context/canvasContext2d'

const api = "http://localhost:3000/"

const path = (pathName: string = "") => api + pathName 

function App() {

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
    <div className='flex flex-col'>
      <Canvas
        canvasWidth={640}
        canvasHeight={640}
        width={64}
        height={64}
      />
      <div>
        <input type="range" max={10} min={1} value={canvasToolsConfig.pencil.width} onChange={(e) => canvasToolsConfig.pencil.setWidth(parseInt(e.target.value))}/>
        <button onClick={() => controller.undo()}>undo</button>
        <button onClick={() => controller.redo()}>redo</button>
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
