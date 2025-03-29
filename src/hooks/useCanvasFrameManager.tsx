import { useMemo, useState } from "react"
import { CanvasFrameManager } from "../classes/CanvasFrameManager"
import { CanvasDrawStack, PixelData, Step } from "../classes/CanvasDrawStack"
import { Dimensions } from "./useCanvasViewportConfig"


export interface FrameManagerApi {
  currentFrame: OffscreenCanvasRenderingContext2D;
  currentFrameIndex: number;
  setCurrentFrame: (index: number) => void;
  deleteFrame: (frameIndex: number) => void;
  changeResolution: (resolution: Dimensions) => void;
  addFrame: () => void;
  updateStep: (stepData: Step) => void;
  finishStep: () => void;
  undo: () => Step;
  redo: () => Step

  size: () => number
}

export const useCanvasFrameManager = () => {

  // current frame index is kept in state to cause a rerender and update frame preview
  // the metastack keeps track of the current frame too so I don't have to pass the index 
  // to every method
  const [current, setCurrent] = useState(0)

  const frameManager = useMemo(() => new CanvasFrameManager(), [])
  const metaStack = useMemo(() => new CanvasDrawStack(), [])

  // this should be done with a worker I think
  const changeResolution = (resolution: Dimensions) => {
    frameManager.changeResolution(resolution)
  }

  const setCurrentFrame = (index: number) => {
    setCurrent(index)
    metaStack.setCurrentStack(index)
  }

  const deleteFrame = (frameIndex: number) => {
    frameManager.delete(frameIndex)
    metaStack.deleteStack(frameIndex)

    if (current >= frameIndex) {
      setCurrent(Math.min(current - 1, frameManager.size - 1))
    }
  }

  const addFrame = () => {
    console.debug(frameManager.resolution)
    frameManager.add()
    metaStack.addStack()
    setCurrent(frameManager.size - 1)
  }

  const updateStep = (stepData: Step) => {
    metaStack.push(stepData)
  }

  const finishStep = () => {
    metaStack.commit()
  }

  const undo = () => {
    return metaStack.undo()
  }

  const redo = () => {
    return metaStack.redo()
  }

  return {
    // ...frameManager,
    currentFrame: frameManager.getFrame(current),
    currentFrameIndex: current,
    setCurrentFrame,
    deleteFrame,
    changeResolution,
    addFrame,
    updateStep,
    finishStep,
    undo,
    redo,

    size: () => frameManager.size
  }
}