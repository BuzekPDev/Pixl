import { useEffect, useMemo } from "react";
import { CanvasDimensions, Dimensions } from "./useCanvasViewportConfig";

export interface OffscreenBuffer {
  transparencyGridBuffer: OffscreenCanvasRenderingContext2D;
  drawingBuffer: OffscreenCanvasRenderingContext2D;
  hoverOverlayBuffer: OffscreenCanvasRenderingContext2D;
}

export const useOffscreenBuffer = (dimensions: Dimensions) => {
  const drawingBuffer = useMemo(() => 
    new OffscreenCanvas(
      dimensions.width,
      dimensions.height
    ).getContext("2d")
  ,[dimensions]);

  const transparencyGridBuffer = useMemo(() =>
    new OffscreenCanvas(
      dimensions.width,
      dimensions.height
    ).getContext("2d"),
    [dimensions]);

  const hoverOverlayBuffer = useMemo(() =>
    new OffscreenCanvas(
      dimensions.width,
      dimensions.height
    ).getContext("2d"),
    [dimensions]);

  return {
    drawingBuffer,
    transparencyGridBuffer,
    hoverOverlayBuffer
  }
}