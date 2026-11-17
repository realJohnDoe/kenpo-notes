export const prerender = true;

import { error } from '@sveltejs/kit';
import {
  DEFAULT_CANVAS_DIMS,
  generateAndComputeAnimationData,
  parseForm,
  generatePersonShapes
} from '#lib/animation.ts';
import {
  generateGrid,
  generateLabels,
  generateCenterMarker,
  generateVignette
} from '#lib/background-graphics.ts';
import { existsSync, readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

// Use process.cwd() for consistent path resolution in both dev and build
const baseDir = process.cwd();
const animationDir = join(baseDir, 'static/forms');
const assetsDir = join(baseDir, 'static');

function readSvgContent(filename: string) {
  const svgPath = join(assetsDir, filename);
  try {
    return readFileSync(svgPath, 'utf-8');
  } catch (e) {
    console.error(`Error reading SVG file: ${svgPath}`, e);
    return '';
  }
}

export function load({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const filePath = join(animationDir, `${slug}.yml`);

  try {
    const fileContents = readFileSync(filePath, 'utf-8');
    const data = parse(fileContents);

    const rightFootSvg = readSvgContent('right_foot.svg');
    const headSvg = readSvgContent('head.svg');

    const canvasWidth = 600;
    const canvasHeight = 600;
    const gridUnitSize = 30;

    const { initialConfig: personConfig } = parseForm(data);

    const personShapes = generatePersonShapes(
      personConfig,
      DEFAULT_CANVAS_DIMS,
      rightFootSvg,
      headSvg
    );
    const grid = generateGrid(canvasWidth, canvasHeight, gridUnitSize);
    const labels = generateLabels(canvasWidth, canvasHeight);
    const centerMarker = generateCenterMarker(canvasWidth, canvasHeight);
    const vignette = generateVignette(canvasWidth, canvasHeight);

    const svgContent = `
<svg width="100%" height="100%" viewBox="0 0 ${canvasWidth} ${canvasHeight}" class="bg-bg-light">
    <g id="grid" class="stroke-bg-dark">
        ${grid}
    </g>
    <g id="center-marker">
        ${centerMarker}
    </g>
    ${vignette}
    <g id="person">
        ${personShapes}
    </g>
    <g id="labels">
        ${labels}
    </g>
</svg>`;

    const { animationData, labelsData } = generateAndComputeAnimationData(
      data,
      DEFAULT_CANVAS_DIMS
    );

    return {
      slug,
      animationData,
      svgContent,
      labelsData
    };
  } catch (e) {
    if (!existsSync(filePath)) {
      throw error(404, `Could not find animation for ${slug}`);
    }
    throw new Error(`Invalid form ${slug}.yml: ${(e as Error).message}`);
  }
}
