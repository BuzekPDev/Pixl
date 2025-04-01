import { RefObject, use, useEffect, useMemo, useRef, useState } from "react"
import { CanvasFrameManager, FrameData } from "../classes/CanvasFrameManager"
import { CanvasDrawStack, Step } from "../classes/CanvasDrawStack"
import { Dimensions } from "./useCanvasViewportConfig"
import { AnimationManager, CanvasImageProcessor } from "../classes/AnimationManager";


export interface FrameManagerApi {
  getCurrentFrame: () => FrameData | null;
  getCurrentFrameIndex: () => number;
  setCurrentFrame: (index: number) => void;
  getFrame: (index: number) => FrameData | null;
  getAllFrames: () => Array<FrameData>
  deleteFrame: (frameIndex: number) => void;
  changeResolution: (resolution: Dimensions) => Promise<void>;
  addFrame: () => void;
  updateStep: (stepData: Step) => void;
  finishStep: () => void;
  undo: () => Step | null;
  redo: () => Step | null;
  updateFramePreview: () => void;
  updateAnimationPreview: () => Promise<void>;
  currentFrameRef: RefObject<HTMLCanvasElement | null>;
  animationPreviewRef: RefObject<HTMLDivElement | null>;
  changeAnimationSpeed: (speed: number) => void

  size: () => number
}

export const useCanvasFrameManager = () => {

  // current frame index needs to be updated synchronously but adding, deleting and changing current frame
  // needs to cause a rerender the the frame preview updates accordingly
  const [, forceUpdate] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(12)

  const frameManager = useMemo(() => new CanvasFrameManager(), [])
  const metaStack = useMemo(() => new CanvasDrawStack(), [])
  const animationManager = useMemo(() => new AnimationManager(), [])

  const currentFrameRef = useRef<HTMLCanvasElement | null>(null)
  const animationPreviewRef = useRef<HTMLDivElement | null>(null)


  useEffect(() => {
    startAnimationPreview()
  }, [])
  // temporary Ill do it in a better way lmao
  // first I need to solve how to play and update the animation preview properly
  const downloadFrameAsImage = (imageType: "jpg" | "jpeg" | "png") => {
    const objectUrl = animationManager.frameToObjectURL(frameManager.getAllFrames()[0])

    objectUrl.then(res => {
      const a = document.createElement("a")

      a.href = res
      a.download = `coolassimage.${imageType}`

      a.click()

      URL.revokeObjectURL(res)
    })
  }

  // this should be done with a worker I think, might look into it in the future
  const changeResolution = async (resolution: Dimensions) => {
    frameManager.changeResolution(resolution)
    forceUpdate(r => r + 1)

    const allFrames = frameManager.getAllFrames()
    animationManager.loadFramesAsObjectURLs(allFrames)
  }

  const getCurrentFrame = () => frameManager.getCurrent()

  const getFrame = (frameIndex: number) => frameManager.getFrame(frameIndex)

  const getAllFrames = () => frameManager.getAllFrames()

  const getCurrentFrameIndex = () => frameManager.getIndex()

  const setCurrentFrame = (index: number) => {
    metaStack.setCurrentStack(index)
    frameManager.setCurrent(index)
    forceUpdate(r => r + 1)
  }

  const deleteFrame = (frameIndex: number) => {
    frameManager.delete(frameIndex)
    metaStack.deleteStack(frameIndex)
    animationManager.deleteObjectURL(frameIndex)
    forceUpdate(r => r + 1)
  }

  const addFrame = () => {
    const frame = frameManager.add()
    metaStack.addStack()

    if (frame) {
      animationManager.saveFrameAsObjectURL(frame)
    }

    forceUpdate(r => r + 1)
    startAnimationPreview()
  }

  const updateStep = (stepData: Step) => {
    metaStack.push(stepData)
  }

  const finishStep = () => {
    metaStack.commit()
  }

  const updateFramePreview = () => {
    if (!currentFrameRef.current) return
    const ctx = currentFrameRef.current.getContext("2d")
    const buffer = frameManager.getCurrent()?.buffer
    const { width, height } = frameManager.getResolution()

    const aspectRatio = width / height

    if (ctx && buffer) {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(buffer.canvas, 0, 0, width, height, 0, 0, 64 * aspectRatio, 64)
    }
  }

  const startAnimationPreview = (speed: number = animationSpeed) => {
    const intervalId = setInterval(() => {
      if (!animationPreviewRef.current) return

      const image = animationManager.getCurrentAnimationFrame()
      animationPreviewRef.current.style.backgroundImage = `url(${image})`
      animationManager.tick()
      // needs to tick
      // get the image of the current tick
      // assign image to the preview div
    }, 1000/speed)
    animationManager.setIntervalId(intervalId)
  }

  const updateAnimationPreview = async () => {
    if (!animationPreviewRef.current) {
      throw new Error("Animation preview unavailable.")
    }

    const index = frameManager.getIndex()
    const frame = frameManager.getCurrent()

    if (!frame) return

    const objectURL = await animationManager.updateObjectURL(frame, index)
    animationPreviewRef.current.style.backgroundImage = `url(${objectURL})`
  } 

  const changeAnimationSpeed = (speed: number) => {
    setAnimationSpeed(speed)
    startAnimationPreview(speed)
  }


  const undo = () => {
    return metaStack.undo()
  }

  const redo = () => {
    return metaStack.redo()
  }

  return {
    getCurrentFrame,
    getFrame,
    getAllFrames,
    getCurrentFrameIndex,
    setCurrentFrame,
    deleteFrame,
    changeResolution,
    addFrame,
    updateStep,
    finishStep,
    undo,
    redo,
    updateFramePreview,
    updateAnimationPreview,
    currentFrameRef,
    animationPreviewRef,
    changeAnimationSpeed,

    downloadFrameAsImage,

    // temporary solution to some problem I forgot
    size: () => frameManager.size
  }
}