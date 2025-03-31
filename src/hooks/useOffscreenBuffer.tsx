import { useMemo } from "react";

export interface OffscreenBuffer {
  transparencyGridBuffer: OffscreenCanvasRenderingContext2D;
  hoverOverlayBuffer: OffscreenCanvasRenderingContext2D;
}

export const useOffscreenBuffer = () => {

  const transparencyGridBuffer = useMemo(() =>
    new OffscreenCanvas(0, 0).getContext("2d"),
  []);

  const hoverOverlayBuffer = useMemo(() =>
    new OffscreenCanvas(0, 0).getContext("2d"),
  []);

  return {
    transparencyGridBuffer,
    hoverOverlayBuffer,
  }
}