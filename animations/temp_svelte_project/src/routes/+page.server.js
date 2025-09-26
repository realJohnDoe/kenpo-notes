
import {
  generateGrid,
  generateLabels,
  generatePersonShapes,
} from '$lib/animation-builder.ts';
import { readFileSync } from 'fs';
import * as yaml from 'yaml';
import { resolve } from 'path';

// Define canvas properties
const canvasWidth = 600;
const canvasHeight = 600;
const unitSize = 60;

export function load() {
  // Generate static background
  const gridSvg = generateGrid(canvasWidth, canvasHeight, 30);
  const labelsSvg = generateLabels(canvasWidth, canvasHeight);

  // Load and process the YAML to get the initial person shapes
  const yamlPath = resolve(`../src/delayed-sword.yml`);
  const rawYaml = readFileSync(yamlPath, 'utf8');
  const cfg = yaml.parse(rawYaml);
  const personSvg = generatePersonShapes(cfg.steps[0], canvasWidth, canvasHeight, unitSize);

  return {
    canvas: { width: canvasWidth, height: canvasHeight },
    gridSvg,
    labelsSvg,
    personSvg
  };
}
