export type DeltaE = number

export type LAB = [number, number, number]

export type RGBA = [number, number, number, number] 

export class ColorProcessor {

  getRGBDifference (originalColor: RGBA, newColor: RGBA) {
    // I can just subtract the numbers lmao

    return newColor
  }

  applyRGBADifference (color: RGBA, difference: RGBA) {}

  revertRGBADifference (color: RGBA, difference: RGBA) {}

  parseRGBAString (str: string) {}

  // rgbToLAB (rgb: RGB) {}

  // labToRGB (lab: LAB) {}

  // getDeltaE (originalColor: LAB, newColor: LAB) {}

  // applyDeltaE (color: number, deltaE: DeltaE) {}

  // undoDeltaE (color: number, deltaE: DeltaE) {}

}