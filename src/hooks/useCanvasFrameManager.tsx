import { RefObject, useEffect, useMemo, useRef, useState } from "react"
import { CanvasFrameManager, FrameData } from "../classes/CanvasFrameManager"
import { CanvasDrawStack, Step } from "../classes/CanvasDrawStack"
import { AnimationManager } from "../classes/AnimationManager";
import { Dimensions } from "../types/types";
import { decodeFrames, encode } from "modern-gif";
import { getAdjustedDimensions } from "../graphicsUtils/getAdjustedDimensions";


export interface FrameManagerApi {
  getCurrentFrame: () => FrameData | null;
  getCurrentFrameIndex: () => number;
  setCurrentFrame: (index: number) => void;
  getFrame: (index: number) => FrameData | null;
  getOnionSkinFrames: () => Array<FrameData>;
  getAllFrames: () => Array<FrameData>
  deleteFrame: (frameIndex: number) => void;
  changeResolution: (resolution: Dimensions) => Promise<void>;
  addFrame: () => FrameData | undefined;
  updateStep: (stepData: Step) => void;
  finishStep: () => void;
  undo: () => Step | null;
  redo: () => Step | null;
  updateFramePreview: () => void;
  updateAnimationPreview: () => Promise<void>;
  currentFrameRef: RefObject<HTMLCanvasElement | null>;
  animationPreviewRef: RefObject<HTMLDivElement | null>;
  changeAnimationSpeed: (speed: number) => void
  willAddToStack: () => boolean;
  deleteAllFrames: () => void;
  startAnimationPreview: () => void;
  pauseAnimationPreview: () => void;
  isAnimationPaused: boolean;
  animationSpeed: number;
  loadFullAnimation: () => void;
  exportAsGif: () => void;
  exportAsImage: (type: "png" | "jpeg", name: string) => void; 
  size: () => number
}

export const useCanvasFrameManager = () => {

  // current frame index needs to be updated synchronously but adding, deleting and changing current frame
  // needs to cause a rerender the the frame preview updates accordingly
  const [, forceUpdate] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(12)
  const [paused, setPaused] = useState(false)

  const frameManager = useMemo(() => new CanvasFrameManager(), [])
  const metaStack = useMemo(() => new CanvasDrawStack(), [])
  const animationManager = useMemo(() => new AnimationManager(), [])

  const currentFrameRef = useRef<HTMLCanvasElement | null>(null)
  const animationPreviewRef = useRef<HTMLDivElement | null>(null)


  useEffect(() => {
    startAnimationPreview()
  }, [])


  // this should be done with a worker I think, might look into it in the future
  const changeResolution = async (resolution: Dimensions) => {
    frameManager.changeResolution(resolution)
    forceUpdate(r => r + 1)

    const allFrames = frameManager.getAllFrames()
    animationManager.loadFramesAsBase64PNGs(allFrames)
  }

  const getCurrentFrame = () => frameManager.getCurrent()

  const getFrame = (frameIndex: number) => frameManager.getFrame(frameIndex)

  const getAllFrames = () => frameManager.getAllFrames()

  const getOnionSkinFrames = () => {
    const currentFrameIndex = frameManager.getIndex()
    // keep index in-bounds, max 3 layers deep
    const deepestLayerIndex = Math.max(currentFrameIndex-3, 0)

    return Array.from({
        length: currentFrameIndex-deepestLayerIndex
      }, (_,i) => deepestLayerIndex+i)
      .map((frameIndex) => frameManager.getFrame(frameIndex))
  }

  const getCurrentFrameIndex = () => frameManager.getIndex()

  const setCurrentFrame = (index: number) => {
    metaStack.setCurrentStack(index)
    frameManager.setCurrent(index)
    forceUpdate(r => r + 1)
  }

  const deleteFrame = (frameIndex: number) => {
    frameManager.delete(frameIndex)
    metaStack.deleteStack(frameIndex)
    animationManager.deleteBase64PNG(frameIndex)
    forceUpdate(r => r + 1)
  }

  const addFrame = () => {
    const frame = frameManager.add()
    metaStack.addStack()

    if (frame) {
      animationManager.saveFrameAsBase64PNG(frame)
    }

    forceUpdate(r => r + 1)
    startAnimationPreview()
    return frame
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

    const previewDims = getAdjustedDimensions(width, height, 128)

    if (ctx && buffer) {
      ctx.clearRect(0, 0, 128, 128)
      ctx.drawImage(buffer.canvas, 0, 0, width, height, 0, 0, previewDims.width, previewDims.height)
    }
  }

  const startAnimationPreview = (speed: number = animationSpeed) => {
    const intervalId = setInterval(() => {
      if (!animationPreviewRef.current) return

      const image = animationManager.getCurrentAnimationFrame()
      animationPreviewRef.current.style.backgroundImage = `url(${image})`
      animationManager.tick()
    }, 1000/speed)
    animationManager.setIntervalId(intervalId)
    setPaused(false)
  }

  const pauseAnimationPreview = () => {
    setPaused(true)
    animationManager.pauseAnimation()
  }

  const updateAnimationPreview = async () => {
    if (!animationPreviewRef.current) {
      throw new Error("Animation preview unavailable.")
    }

    const index = frameManager.getIndex()
    const frame = frameManager.getCurrent()

    if (!frame) return

    await animationManager.updateBase64PNG(frame, index)
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

  const willAddToStack = () => metaStack.isStepPopulated()


  const exportAsGif = async (name: string) => {
    const frames = getAllFrames()

    const output = await encode({
      ...frameManager.getResolution(),
      frames: frames.map(frame => ({data: frame.buffer.canvas, delay: 1000/animationSpeed}))
    })

    const blob = new Blob([output], { type: 'image/png' })
    const gifObjectUrl = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = gifObjectUrl;
    a.download = `${name}.gif`
    a.click()

    URL.revokeObjectURL(gifObjectUrl)
  }

  const exportAsImage = async (type: "png" | "jpeg", name: string) => {
    const frame = frameManager.getCurrent()

    if (!frame) {
      throw new Error("No frames to export")
    }
    
    const encodedString = await animationManager.frameToBase64image(frame, type)
    const a = document.createElement("a");
    a.download = `${name}.${type}`;
    a.href = encodedString
    a.click()
  }

  const decodeGif = async (gifSource: any) => {
    const buffer = await gifSource

    const frames = decodeFrames(buffer)

    if (!frames.length) {
      throw new Error("Invalid gif")
    }

    if (frames[0].width === 0 || frames[0].height === 0) {
      throw new Error("Invalid gif")
    }

    deleteAllFrames()
    
    return {
      width: frames[0].width,
      height: frames[0].height,
      frameData: frames.map(frame => frame.data)
    }
  }

  const loadFullAnimation = () => {
    const allFrames = frameManager.getAllFrames()
    animationManager.loadFramesAsBase64PNGs(allFrames)
    startAnimationPreview()
  }

  const deleteAllFrames = () => {
    frameManager.clearFrameStack()
    metaStack.clearMetastack()
  } 

  const copyFrame = (frameIndex: number) => {
    const newFrame = addFrame()

    if (!newFrame) {
      throw new Error("Something went wrong adding a frame")
    }

    // will 
  }


  return {
    getCurrentFrame,
    getFrame,
    getAllFrames,
    getOnionSkinFrames,
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
    startAnimationPreview,
    pauseAnimationPreview,
    isAnimationPaused: paused,
    animationSpeed,
    loadFullAnimation,
    willAddToStack,
    deleteAllFrames,
    exportAsGif,
    exportAsImage,
    decodeGif,
    // temporary solution to some problem I forgot so I'm keeping it here
    size: () => frameManager.size
  }
}