export const prerender = true;

import { error } from '@sveltejs/kit';
import {
  generateAndComputeAnimationData,
  generatePersonShapes
} from '$lib/animation';
import {
  generateGrid,
  generateLabels,
  generateCenterMarker,
  generateVignette
} from '$lib/background-graphics';
import { readFileSync } from 'fs';
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
    const personUnitSize = 60;

    const firstStep = data.steps[0];
    const personConfig = {
      stance: firstStep.stance?.type || firstStep.stance || 'attention',
      direction: firstStep.stance?.direction || firstStep.direction || 1200,
      offsetX: firstStep.offsetX || 0,
      offsetY: firstStep.offsetY || 0
    };

    const personShapes = generatePersonShapes(
      personConfig,
      canvasWidth,
      canvasHeight,
      personUnitSize,
      rightFootSvg,
      headSvg
    );
    const grid = generateGrid(canvasWidth, canvasHeight, gridUnitSize);
    const labels = generateLabels(canvasWidth, canvasHeight);
    const centerMarker = generateCenterMarker(canvasWidth, canvasHeight);
    const vignette = generateVignette(canvasWidth, canvasHeight);

    const svgContent = `
<svg width="100%" height="100%" viewBox="0 0 ${canvasWidth} ${canvasHeight}" style="background-color: white;">
    <g id="grid">
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
      canvasWidth,
      canvasHeight,
      personUnitSize
    );

    return {
      slug,
      animationData,
      svgContent,
      labelsData
    };
  } catch (e) {
    console.error(e);
    throw error(404, `Could not find animation for ${slug}`);
  }
}
