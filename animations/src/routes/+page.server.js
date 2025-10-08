import fs from 'fs';
import path from 'path';

export const prerender = true;

export function load() {
    const canvasWidth = 600;
    const canvasHeight = 600;

    const headSvgPath = path.resolve('src', 'head.svg');
    let rawHeadSvgContent = fs.readFileSync(headSvgPath, 'utf8');

    // Extract content of <g id="layer1"> from head.svg
    const layer1ContentMatch = rawHeadSvgContent.match(/<g[^>]*id="layer1"[^>]*>([\s\S]*?)<\/g>/);
    let extractedHeadContent = '';
    if (layer1ContentMatch && layer1ContentMatch[1]) {
        extractedHeadContent = layer1ContentMatch[1];
    } else {
        console.warn("Could not find <g id='layer1'> in head.svg. Using full content as fallback.");
        extractedHeadContent = rawHeadSvgContent; // Fallback
    }

    // Calculate translation and scale to center the head
    const headSvgViewBoxWidth = 26.458333; // Original viewBox width of head.svg
    const headSvgViewBoxHeight = 26.458333; // Original viewBox height of head.svg
    const scaleFactor = 10; // Scale up the head

    const translateX = (canvasWidth / 2) - (headSvgViewBoxWidth * scaleFactor / 2);
    const translateY = (canvasHeight / 2) - (headSvgViewBoxHeight * scaleFactor / 2);

    // Wrap the extracted head content in a <g> element with transform for centering and scaling
    const headContentWithTransform = `<g id="layer1" transform="translate(${translateX}, ${translateY}) scale(${scaleFactor})">${extractedHeadContent}</g>`;

    const svgContent = `<svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">${headContentWithTransform}</svg>`;

    console.log("Generated SVG Content:\n", svgContent);
    return {
        svgContent
    };
}