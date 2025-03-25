import { Children, cloneElement, isValidElement, PropsWithChildren, useLayoutEffect, useRef, useState } from "react"
import { CanvasProps } from "./Canvas"

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

    const resizeHandler = (e: any) => {
      const [width, height] = [e.target.innerWidth, e.target.innerHeight] 
      setDimesions({
        width,height
      })
    }

    window.addEventListener("resize", resizeHandler)

    return () => window.removeEventListener("resize", resizeHandler)
  }, [])

  if (dimensions === null) {
    return (
      <div className="w-full h-full" ref={measureRef}></div>
    )
  }

  return (
    <>
      {Children.map(children, (child) => {
        if (isValidElement<CanvasProps>(child)) {
          return cloneElement(child, {
            width: dimensions.width,
            height: dimensions.height
          });
        }
        return child;
      })}
    </>
  )
}