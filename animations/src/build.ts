import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve, parse } from "path";
import * as yaml from "yaml";

const directionToDegrees = (dir: number) => {
    const hours = Math.floor(dir / 100);
    const minutes = dir % 100;
    const decimalHours = hours + (minutes / 60);
    const normalizedHours = decimalHours === 12 ? 0 : decimalHours;
    return (normalizedHours / 12) * 360;
};

const stances: { [key: string]: { leftFoot: { x: number, y: number }, rightFoot: { x: number, y: number }, cog: { x: number, y: number }, leftFootRotation: number, rightFootRotation: number } } = {
    "attention": {
        leftFoot: { x: -0.5, y: 0 },
        rightFoot: { x: 0.5, y: 0 },
        cog: { x: 0, y: 0 },
        leftFootRotation: 0,
        rightFootRotation: 0
    },
    "right_neutral_bow": {
        leftFoot: { x: -0.5, y: -1 },
        rightFoot: { x: 0.5, y: 0 },
        cog: { x: 0, y: -0.5 },
        leftFootRotation: 1030,
        rightFootRotation: 1030
    },
    "left_neutral_bow": {
        leftFoot: { x: -0.5, y: 0 },
        rightFoot: { x: 0.5, y: -1 },
        cog: { x: 0, y: -0.5 },
        leftFootRotation: 130,
        rightFootRotation: 130
    },
    "right_cat": {
        leftFoot: { x: -0.5, y: 0 },
        rightFoot: { x: 0, y: 0.5 },
        cog: { x: -0.25, y: 0.25 },
        leftFootRotation: 1030,
        rightFootRotation: 1200
    }
};

function generatePersonShapes(personConfig: any, canvasWidth: number, canvasHeight: number, unit: number): string {
    const { stance, direction, offsetX = 0, offsetY = 0 } = personConfig;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    let shapesSvg = "";

    const rotationDegrees = directionToDegrees(direction);

    const currentStance = stances[stance] || stances["attention"]; // Default to attention
    const leftFootRotationDegrees = directionToDegrees(currentStance.leftFootRotation); // Retrieve from stance definition
    const rightFootRotationDegrees = directionToDegrees(currentStance.rightFootRotation);

    // Define base positions in mathematical units (relative to (0,0))
    let leftFootMathX = currentStance.leftFoot.x;
    let leftFootMathY = currentStance.leftFoot.y;
    let rightFootMathX = currentStance.rightFoot.x;
    let rightFootMathY = currentStance.rightFoot.y;
    let cogMathX = currentStance.cog.x;
    let cogMathY = currentStance.cog.y;

    // Convert mathematical coordinates to SVG pixel coordinates
    const toSvgX = (mathX: number) => (mathX + offsetX) * unit + centerX;
    const toSvgY = (mathY: number) => centerY - ((mathY + offsetY) * unit); // Flipped Y

    // Left Foot
    const leftFootSvgX = toSvgX(leftFootMathX);
    const leftFootSvgY = toSvgY(leftFootMathY);
    shapesSvg += `<circle id="leftFootCircle" cx="${leftFootSvgX}" cy="${leftFootSvgY}" r="5" fill="blue" />`;
    // Left Foot Pointer (relative to leftFootSvgX, leftFootSvgY)
    // Points are defined relative to the circle's center for rotation
    const leftPointerPoints = `-4,-5 4,-5 0,-15`; // Relative to circle center
    shapesSvg += `<polygon id="leftFootPointer" points="${leftPointerPoints}" fill="blue" transform="translate(${leftFootSvgX}, ${leftFootSvgY}) rotate(${rotationDegrees + leftFootRotationDegrees})" />`;


    // Right Foot
    const rightFootSvgX = toSvgX(rightFootMathX);
    const rightFootSvgY = toSvgY(rightFootMathY);
    shapesSvg += `<circle id="rightFootCircle" cx="${rightFootSvgX}" cy="${rightFootSvgY}" r="5" fill="blue" />`;
    // Right Foot Pointer
    const rightPointerPoints = `-4,-5 4,-5 0,-15`; // Relative to circle center
    shapesSvg += `<polygon id="rightFootPointer" points="${rightPointerPoints}" fill="blue" transform="translate(${rightFootSvgX}, ${rightFootSvgY}) rotate(${rotationDegrees + rightFootRotationDegrees})" />`;

    // Center of Gravity
    const cogSvgX = toSvgX(cogMathX);
    const cogSvgY = toSvgY(cogMathY);
    shapesSvg += `<circle id="cog" cx="${cogSvgX}" cy="${cogSvgY}" r="10" fill="red" />`;
    // CoG Pointer
    const cogPointerPoints = `-8,-10 8,-10 0,-30`; // Relative to circle center
    shapesSvg += `<polygon id="cogPointer" points="${cogPointerPoints}" fill="red" transform="translate(${cogSvgX}, ${cogSvgY}) rotate(${rotationDegrees})" />`;

    return shapesSvg;
}

// Helper to get shape coordinates for animation
function getPersonShapeCoordinates(personConfig: any, canvasWidth: number, canvasHeight: number, unit: number) {
    const { stance, direction, offsetX = 0, offsetY = 0 } = personConfig;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const rotationDegrees = directionToDegrees(direction);

    const currentStance = stances[stance] || stances["attention"];
    const leftFootRotationDegrees = directionToDegrees(currentStance.leftFootRotation);
    const rightFootRotationDegrees = directionToDegrees(currentStance.rightFootRotation);

    const toSvgX = (mathX: number) => (mathX + offsetX) * unit + centerX;
    const toSvgY = (mathY: number) => centerY - ((mathY + offsetY) * unit); // Flipped Y

    const leftFootSvgX = toSvgX(currentStance.leftFoot.x);
    const leftFootSvgY = toSvgY(currentStance.leftFoot.y);
    const rightFootSvgX = toSvgX(currentStance.rightFoot.x);
    const rightFootSvgY = toSvgY(currentStance.rightFoot.y);
    const cogSvgX = toSvgX(currentStance.cog.x);
    const cogSvgY = toSvgY(currentStance.cog.y);

    return {
        leftFootCircle: { cx: leftFootSvgX, cy: leftFootSvgY },
        leftFootPointer: { x: leftFootSvgX, y: leftFootSvgY, rotate: rotationDegrees + leftFootRotationDegrees },
        rightFootCircle: { cx: rightFootSvgX, cy: rightFootSvgY },
        rightFootPointer: { x: rightFootSvgX, y: rightFootSvgY, rotate: rotationDegrees + rightFootRotationDegrees },
        cog: { cx: cogSvgX, cy: cogSvgY },
        cogPointer: { x: cogSvgX, y: cogSvgY, rotate: rotationDegrees }
    };
}



function createCircleAnim(targetId: string, fromPos: {cx: number, cy: number}, toPos: {cx: number, cy: number}) {
    return {
        targets: targetId,
        cx: [fromPos.cx, toPos.cx],
        cy: [fromPos.cy, toPos.cy],
        duration: 1000,
        easing: 'easeInOutSine'
    };
}

function createPointerAnim(targetId: string, fromPos: {x: number, y: number, rotate: number}, toPos: {x: number, y: number, rotate: number}) {
    let diff = toPos.rotate - fromPos.rotate;
    if (diff > 180) { diff -= 360; }
    else if (diff < -180) { diff += 360; }

    return {
        targets: targetId,
        translateX: [fromPos.x, toPos.x],
        translateY: [fromPos.y, toPos.y],
        rotate: `+=${diff}`,
        duration: 1000,
        easing: 'easeInOutSine'
    };
}

function generateGrid(canvasWidth: number, canvasHeight: number, gridSize: number): string {
    const xOffset = 0.5 * gridSize;
    const gridColor = "#e0e0e0";
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let gridElems = "";

    for (let i = 0; i <= Math.ceil(centerX / gridSize); i++) {
        let xPos = centerX + (i * gridSize) + xOffset;
        if (xPos < canvasWidth) {
            gridElems += `<line x1="${xPos}" y1="0" x2="${xPos}" y2="${canvasHeight}" stroke="${gridColor}" stroke-width="1" />`;
        }
        let xNeg = centerX - (i * gridSize) - xOffset;
        if (xNeg > 0) {
            gridElems += `<line x1="${xNeg}" y1="0" x2="${xNeg}" y2="${canvasHeight}" stroke="${gridColor}" stroke-width="1" />`;
        }
    }

    for (let i = 0; i <= Math.ceil(centerY / gridSize); i++) {
        if (i === 0) {
            gridElems += `<line x1="0" y1="${centerY}" x2="${canvasWidth}" y2="${centerY}" stroke="${gridColor}" stroke-width="1" />`;
            continue;
        }
        let yPos = centerY - (i * gridSize);
        if (yPos > 0) {
            gridElems += `<line x1="0" y1="${yPos}" x2="${canvasWidth}" y2="${yPos}" stroke="${gridColor}" stroke-width="1" />`;
        }
        let yNeg = centerY + (i * gridSize);
        if (yNeg < canvasHeight) {
            gridElems += `<line x1="0" y1="${yNeg}" x2="${canvasWidth}" y2="${yNeg}" stroke="${gridColor}" stroke-width="1" />`;
        }
    }
    return gridElems;
}

function generateLabels(canvasWidth: number, canvasHeight: number): string {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let labelElems = "";
    labelElems += `<text x="${centerX}" y="20" text-anchor="middle" class="txt">1200</text>`;
    labelElems += `<text x="${canvasWidth - 20}" y="${centerY}" text-anchor="end" dominant-baseline="middle" class="txt">300</text>`;
    labelElems += `<text x="20" y="${centerY}" text-anchor="start" dominant-baseline="middle" class="txt">900</text>`;
    labelElems += `<text x="${centerX}" y="${canvasHeight - 20}" text-anchor="middle" dominant-baseline="hanging" class="txt">600</text>`;
    return labelElems;
}

function generateAnimationTimeline(cfg: any, canvasWidth: number, canvasHeight: number, gridSize: number): any[] {
    const timelineData = [];
    if (cfg.steps.length > 1) {
        let lastConfig = { ...cfg.steps[0].person };
        if (lastConfig.offsetX === undefined) lastConfig.offsetX = 0;
        if (lastConfig.offsetY === undefined) lastConfig.offsetY = 0;

        for (let i = 0; i < cfg.steps.length - 1; i++) {
            const fromCoords = getPersonShapeCoordinates(lastConfig, canvasWidth, canvasHeight, gridSize);

            const toStep = cfg.steps[i + 1];
            const pivot = toStep.person.pivot;
            
            let nextConfig = { ...toStep.person };
            nextConfig.offsetX = lastConfig.offsetX;
            nextConfig.offsetY = lastConfig.offsetY;

            if (pivot === 'left' || pivot === 'right') {
                const fromPivotCoords = (pivot === 'left') ? fromCoords.leftFootCircle : fromCoords.rightFootCircle;
                const toStance = stances[toStep.person.stance];
                const toPivotMath = (pivot === 'left') ? toStance.leftFoot : toStance.rightFoot;

                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;
                const unit = gridSize;

                const toOffsetX = (fromPivotCoords.cx - centerX) / unit - toPivotMath.x;
                const toOffsetY = (centerY - fromPivotCoords.cy) / unit - toPivotMath.y;

                nextConfig.offsetX = toOffsetX;
                nextConfig.offsetY = toOffsetY;
            }
            
            const toCoords = getPersonShapeCoordinates(nextConfig, canvasWidth, canvasHeight, gridSize);
            
            const stepAnims = [];

            stepAnims.push(createCircleAnim('#leftFootCircle', fromCoords.leftFootCircle, toCoords.leftFootCircle));
            stepAnims.push(createCircleAnim('#rightFootCircle', fromCoords.rightFootCircle, toCoords.rightFootCircle));
            stepAnims.push(createCircleAnim('#cog', fromCoords.cog, toCoords.cog));

            stepAnims.push(createPointerAnim('#leftFootPointer', fromCoords.leftFootPointer, toCoords.leftFootPointer));
            stepAnims.push(createPointerAnim('#rightFootPointer', fromCoords.rightFootPointer, toCoords.rightFootPointer));
            stepAnims.push(createPointerAnim('#cogPointer', fromCoords.cogPointer, toCoords.cogPointer));

            timelineData.push(stepAnims);

            lastConfig = nextConfig;
        }
    }
    return timelineData;
}

function buildAndWriteHtml(cfg: any, svgContent: string, timelineData: any[], distDir: string, yamlPath: string) {
    const baseHtmlPath = resolve(__dirname, "../src/base.html");
    let htmlContent = readFileSync(baseHtmlPath, "utf8");

    htmlContent = htmlContent.replace("{{TITLE}}", cfg.title);
    htmlContent = htmlContent.replace("{{SVG_CONTENT}}", svgContent);
    htmlContent = htmlContent.replace("{{TIMELINE_JSON}}", JSON.stringify(timelineData, null, 2));

    const outPath = resolve(distDir, `${parse(yamlPath).name}.html`);
    writeFileSync(outPath, htmlContent);
    console.log(`✅ Generated ${outPath}`);
}

// --- Main script ---

// Load YAML
const yamlPath = resolve(__dirname, "../src/delayed-sword.yml");
const rawYaml = readFileSync(yamlPath, "utf8");
const cfg = yaml.parse(rawYaml);

// Set canvas size
cfg.canvas.width = 600;
cfg.canvas.height = 600;

// Grid parameters
const gridSize = 60;

// Generate SVG parts
const gridElems = generateGrid(cfg.canvas.width, cfg.canvas.height, gridSize);
const labelElems = generateLabels(cfg.canvas.width, cfg.canvas.height);
const initialPersonShapes = generatePersonShapes(cfg.steps[0].person, cfg.canvas.width, cfg.canvas.height, gridSize);
const svgContent = `<svg viewBox="0 0 ${cfg.canvas.width} ${cfg.canvas.height}">${gridElems}${labelElems}${initialPersonShapes}</svg>`;

// Create dist dir
const distDir = resolve(__dirname, "../dist");
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

// Generate animation data
const timelineData = generateAnimationTimeline(cfg, cfg.canvas.width, cfg.canvas.height, gridSize);

// Build and write the final HTML
buildAndWriteHtml(cfg, svgContent, timelineData, distDir, yamlPath);

// Copy Anime.js
const animeSrc = resolve(__dirname, "../node_modules/animejs/lib/anime.js");
copyFileSync(animeSrc, resolve(distDir, "anime.js"));

