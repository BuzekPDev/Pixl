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

    const resizeHandler = () => {
      if (!measureRef.current) return
      const {width, height} = measureRef.current.getBoundingClientRect()
      setDimesions({
        width,height
      })
    }

    window.addEventListener("resize", resizeHandler)

    return () => window.removeEventListener("resize", resizeHandler)
  }, [])


  return (
    <div
      className="w-full h-full"
      onResizeCapture={(e) => {
        const { width, height } = e.currentTarget.getBoundingClientRect()
        setDimesions({
          width,height
        })
      }}
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