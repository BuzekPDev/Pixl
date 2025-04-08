import { Children, cloneElement, isValidElement, PropsWithChildren, useLayoutEffect, useRef, useState } from "react"
import { CanvasProps } from "./CanvasLayers"
import { debounce } from "../utils/debounce"

export const SizeObserver = ({ children }: PropsWithChildren) => {

  const [dimensions, setDimesions] = useState<{
    width: number,
    height: number
  } | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!measureRef.current) return
    const { width, height } = measureRef.current.getBoundingClientRect()
    setDimesions({ width, height })

    const resize = debounce((width, height) => setDimesions({width, height}), 100)

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width !== dimensions?.width || height !== dimensions.height) {
          resize(width, height)
        }
      }
    })
    observer.observe(measureRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])


  return (
    <div
      className="w-full h-full"
      ref={measureRef}
    >
      {dimensions ?
        Children.map(children, (child) => {
        if (isValidElement<CanvasProps>(child)) {
          return cloneElement(child, {
            width: dimensions.width,
            height: dimensions.height
          });
        }
        return child;
      })
      : null
      }
    </div>
  )
}