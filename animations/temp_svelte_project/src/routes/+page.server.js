import {
  generateGrid,
  generateLabels,
} from '$lib/animation-builder.ts';

// Define canvas properties for the grid and labels
const canvasWidth = 600;
const canvasHeight = 600;

export function load() {
  const gridSvg = generateGrid(canvasWidth, canvasHeight, 30);
  const labelsSvg = generateLabels(canvasWidth, canvasHeight);

  return {
    canvas: { width: canvasWidth, height: canvasHeight },
    gridSvg,
    labelsSvg
  };
}