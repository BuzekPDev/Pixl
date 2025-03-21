import { useState } from "react"


export const useCanvasViewportConfig = () => {

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  })


  return {
    dimensions: {
      width: dimensions.width,
      height: dimensions.height,
      set: (width: number, height: number) => setDimensions({width, height})
    }
  }
}