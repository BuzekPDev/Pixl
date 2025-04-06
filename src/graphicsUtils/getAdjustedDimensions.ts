export const getAdjustedDimensions = (
  width: number, 
  height: number, 
  baseSize: number, 
) => {
  const aspectRatio = width > height ? width / height : height / width
  const { adjustedWidth, adjustedHeight } =  
    width > height 
    ? {adjustedWidth: baseSize, adjustedHeight: baseSize/aspectRatio} 
    : {adjustedWidth: baseSize/aspectRatio, adjustedHeight: baseSize}

  // canvas floors dimensions anyway
  return {
    width: Math.floor(adjustedWidth),
    height: Math.floor(adjustedHeight)
  }
}