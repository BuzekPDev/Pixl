import { useMemo, useState } from "react"
import { CanvasFrameManager } from "../classes/CanvasFrameManager"
import { CanvasDrawStack, Step } from "../classes/CanvasDrawStack"
import { Dimensions } from "./useCanvasViewportConfig"


export interface FrameManagerApi {
  getCurrentFrame: () => OffscreenCanvasRenderingContext2D | null;
  getCurrentFrameIndex: () => number;
  setCurrentFrame: (index: number) => void;
  deleteFrame: (frameIndex: number) => void;
  changeResolution: (resolution: Dimensions) => void;
  addFrame: () => void;
  updateStep: (stepData: Step) => void;
  finishStep: () => void;
  undo: () => Step | null;
  redo: () => Step | null;

  size: () => number
}

export const useCanvasFrameManager = () => {

  // current frame index needs to be updated synchronously but adding, deleting and changing current frame
  // needs to cause a rerender the the frame preview updates accordingly
  const [,forceUpdate] = useState(0)

  const frameManager = useMemo(() => new CanvasFrameManager(), [])
  const metaStack = useMemo(() => new CanvasDrawStack(), [])

  // this should be done with a worker I think, might look into it in the future
  const changeResolution = (resolution: Dimensions) => {
    frameManager.changeResolution(resolution)
  }

  const getCurrentFrame = () => frameManager.getCurrent()

  const getCurrentFrameIndex = () => frameManager.getIndex()

  const setCurrentFrame = (index: number) => {
    metaStack.setCurrentStack(index)
    frameManager.setCurrent(index)
    forceUpdate(r => r+1)
  }

  const deleteFrame = (frameIndex: number) => {
    frameManager.delete(frameIndex)
    metaStack.deleteStack(frameIndex)
    forceUpdate(r => r+1)
  }

  const addFrame = () => {
    frameManager.add()
    metaStack.addStack()
    forceUpdate(r => r+1)
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
    getCurrentFrame,
    getCurrentFrameIndex,
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