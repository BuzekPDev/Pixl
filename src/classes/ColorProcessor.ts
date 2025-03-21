export type DeltaE = number

export type LAB = [number, number, number]

export type RGBA = [number, number, number, number] 

export class ColorProcessor {

  getRGBDifference (originalColor: RGBA, newColor: RGBA): RGBA {
    // I can just subtract the numbers lmao
    
    return [
      originalColor[0] - newColor[0],
      originalColor[1] - newColor[1],
      originalColor[2] - newColor[2],
      originalColor[3] - newColor[3],
    ] 
  }

  applyRGBADifference (color: RGBA, difference: RGBA) {
    const newColor = [
      color[0] - difference[0],
      color[1] - difference[1],
      color[2] - difference[2],
      color[3] - difference[3],
    ]
    return newColor
  }

  revertRGBADifference (color: RGBA, difference: RGBA) {
    const newColor = [
      color[0] + difference[0],
      color[1] + difference[1],
      color[2] + difference[2],
      color[3] + difference[3],
    ]
    return newColor
  }

  parseRGBAString (str: string) {}

  // rgbToLAB (rgb: RGB) {}

  // labToRGB (lab: LAB) {}

  // getDeltaE (originalColor: LAB, newColor: LAB) {}

  // applyDeltaE (color: number, deltaE: DeltaE) {}

  // undoDeltaE (color: number, deltaE: DeltaE) {}

}