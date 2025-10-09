import { error } from '@sveltejs/kit';
import { generateAnimationTimeline, generatePersonShapes, computeAnimationData } from '$lib/animation.ts';
import { generateGrid, generateLabels, generateCenterMarker, generateVignette } from '$lib/background-graphics.ts';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import path from 'path';

const animationDir = path.resolve('src');

function readSvgContent(filename) {
    const svgPath = path.join(animationDir, filename);
    try {
        return readFileSync(svgPath, 'utf-8');
    } catch (e) {
        console.error(`Error reading SVG file: ${svgPath}`, e);
        return '';
    }
}

export function load({ params }) {
    const { slug } = params;
    const filePath = path.join(animationDir, `${slug}.yml`);

    try {
        const fileContents = readFileSync(filePath, 'utf-8');
        const data = load(fileContents);

        const rightFootSvg = readSvgContent('right_foot.svg');
        const headSvg = readSvgContent('head.svg');

        const canvasWidth = 600;
        const canvasHeight = 600;
        const gridUnitSize = 30;
        const personUnitSize = 60;

        const personShapes = generatePersonShapes(data.steps[0], canvasWidth, canvasHeight, personUnitSize, rightFootSvg, headSvg);
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
    <g id="person">
        ${personShapes}
    </g>
    ${vignette}
    <g id="labels">
        ${labels}
    </g>
</svg>`;

        const { timelineData, labelsData } = generateAnimationTimeline(data, canvasWidth, canvasHeight, personUnitSize);
        const animationData = computeAnimationData(timelineData);

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