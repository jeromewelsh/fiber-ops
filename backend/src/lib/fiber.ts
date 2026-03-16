export const fiberColors12 = [
  "Blue",
  "Orange",
  "Green",
  "Brown",
  "Slate",
  "White",
  "Red",
  "Black",
  "Yellow",
  "Violet",
  "Rose",
  "Aqua",
] as const;

export function colorForStrand(strandNumber: number): string {
  return fiberColors12[(strandNumber - 1) % 12];
}

export function bufferForStrand(strandNumber: number): number {
  return Math.floor((strandNumber - 1) / 12) + 1;
}