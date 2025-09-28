function directionToDegrees(direction: number): number {
    const hour = Math.floor(direction / 100);
    const minute = direction % 100;
    const degrees = (hour * 30 + minute / 2) % 360;
    return degrees;
}

// Helper function to mirror rotation values
const mirrorRotation = (dir: number): number => {
    const hours = Math.floor(dir / 100);
    const minutes = dir % 100;
    const decimalHours = hours + (minutes / 60);

    // Normalize to 0-12 range, where 12 becomes 0
    const normalizedDecimalHours = decimalHours === 12 ? 0 : decimalHours;

    // Mirror across the 12/6 axis (Y-axis)
    let mirroredNormalizedDecimalHours = (12 - normalizedDecimalHours);
    if (mirroredNormalizedDecimalHours === 12) {
        mirroredNormalizedDecimalHours = 0; // Handle 12 becoming 0
    } else if (mirroredNormalizedDecimalHours < 0) {
        mirroredNormalizedDecimalHours += 12; // Handle negative results for 0
    }

    const mirroredHours = Math.floor(mirroredNormalizedDecimalHours);
    const mirroredMinutes = Math.round((mirroredNormalizedDecimalHours - mirroredHours) * 60);

    // Special handling for 0 hours to be 1200
    if (mirroredHours === 0 && mirroredMinutes === 0) {
        return 1200;
    }

    return mirroredHours * 100 + mirroredMinutes;
};

// Helper function to mirror a stance definition
const mirrorStance = (rightStance: { leftFoot: { x: number, y: number }, rightFoot: { x: number, y: number }, cog: { x: number, y: number }, leftFootRotation: number, rightFootRotation: number }): { leftFoot: { x: number, y: number }, rightFoot: { x: number, y: number }, cog: { x: number, y: number }, leftFootRotation: number, rightFootRotation: number } => {
    return {
        leftFoot: { x: -rightStance.rightFoot.x, y: rightStance.rightFoot.y },
        rightFoot: { x: -rightStance.leftFoot.x, y: rightStance.leftFoot.y },
        cog: { x: -rightStance.cog.x, y: rightStance.cog.y },
        leftFootRotation: mirrorRotation(rightStance.rightFootRotation),
        rightFootRotation: mirrorRotation(rightStance.leftFootRotation)
    };
};

// Explicitly define right-sided stances and symmetrical stances
const explicitStances: { [key: string]: { leftFoot: { x: number, y: number }, rightFoot: { x: number, y: number }, cog: { x: number, y: number }, leftFootRotation: number, rightFootRotation: number } } = {
    "attention": {
        leftFoot: { x: -0.5, y: 0 },
        rightFoot: { x: 0.5, y: 0 },
        cog: { x: 0, y: 0 },
        leftFootRotation: 1200,
        rightFootRotation: 1200
    },
    "right_neutral": {
        leftFoot: { x: -0.5, y: -1 },
        rightFoot: { x: 0.5, y: 0 },
        cog: { x: 0, y: -0.5 },
        leftFootRotation: 1030,
        rightFootRotation: 1030
    },
    "right_cat": {
        leftFoot: { x: -0.5, y: 0 },
        rightFoot: { x: 0, y: 0.5 },
        cog: { x: -0.25, y: 0.25 },
        leftFootRotation: 1030,
        rightFootRotation: 1200
    },
    "right_forward": {
        leftFoot: { x: -0.5, y: -1 },
        rightFoot: { x: 0.5, y: 0 },
        cog: { x: 0, y: -0.5 },
        leftFootRotation: 1200,
        rightFootRotation: 1030
    }
};

// Generate left-sided stances by mirroring the right-sided ones
export const stances: { [key: string]: { leftFoot: { x: number, y: number }, rightFoot: { x: number, y: number }, cog: { x: number, y: number }, leftFootRotation: number, rightFootRotation: number } } = { ...explicitStances };

for (const key in explicitStances) {
    if (key.startsWith("right_")) {
        const leftKey = key.replace("right_", "left_");
        stances[leftKey] = mirrorStance(explicitStances[key]);
    }
}

function rotatePoint(point: { x: number, y: number }, angle: number): { x: number, y: number } {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const { x, y } = point;
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    return { x: newX, y: newY };
}

export function generatePersonShapes(personConfig: any, canvasWidth: number, canvasHeight: number, unit: number): string {
    const { stance, direction, offsetX = 0, offsetY = 0 } = personConfig;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    let shapesSvg = "";

    const rotationDegrees = directionToDegrees(direction);

    const currentStance = stances[stance] || stances["attention"];

    let leftFoot = currentStance.leftFoot;
    let rightFoot = currentStance.rightFoot;
    let cog = currentStance.cog;

    if (rotationDegrees !== 0) {
        leftFoot = rotatePoint(leftFoot, rotationDegrees);
        rightFoot = rotatePoint(rightFoot, rotationDegrees);
        cog = rotatePoint(cog, rotationDegrees);
    }

    const leftFootRotationDegrees = directionToDegrees(currentStance.leftFootRotation);
    const rightFootRotationDegrees = directionToDegrees(currentStance.rightFootRotation);

    const toSvgX = (mathX: number) => (mathX + offsetX) * unit + centerX;
    const toSvgY = (mathY: number) => centerY - ((mathY + offsetY) * unit);

    const leftFootSvgX = toSvgX(leftFoot.x);
    const leftFootSvgY = toSvgY(leftFoot.y);
    const rightFootSvgX = toSvgX(rightFoot.x);
    const rightFootSvgY = toSvgY(rightFoot.y);

    // Left Foot Group
    shapesSvg += `<g id="leftFootGroup" transform="translate(${leftFootSvgX}, ${leftFootSvgY}) rotate(${rotationDegrees + leftFootRotationDegrees})">
        <circle cx="0" cy="0" r="5" fill="blue" />
        <polygon points="-4,-5 4,-5 0,-15" fill="blue" />
        <text x="10" y="0" dominant-baseline="middle" text-anchor="start" font-size="10" fill="black">L</text>
    </g>`;

    // Right Foot Group
    shapesSvg += `<g id="rightFootGroup" transform="translate(${rightFootSvgX}, ${rightFootSvgY}) rotate(${rotationDegrees + rightFootRotationDegrees})">
        <circle cx="0" cy="0" r="5" fill="blue" />
        <polygon points="-4,-5 4,-5 0,-15" fill="blue" />
        <text x="10" y="0" dominant-baseline="middle" text-anchor="start" font-size="10" fill="black">R</text>
    </g>`;

    // Center of Gravity
    const cogSvgX = toSvgX(cog.x);
    const cogSvgY = toSvgY(cog.y);
    shapesSvg += `<circle id="cog" cx="${cogSvgX}" cy="${cogSvgY}" r="10" fill="red" />`;
    const cogPointerPoints = `-8,-10 8,-10 0,-30`;
    shapesSvg += `<polygon id="cogPointer" points="${cogPointerPoints}" fill="red" transform="translate(${cogSvgX}, ${cogSvgY}) rotate(${rotationDegrees})" />`;

    return shapesSvg;
}

// Helper to get shape coordinates for animation
export function getPersonShapeCoordinates(personConfig: any, canvasWidth: number, canvasHeight: number, unit: number) {
    const { stance, direction, offsetX = 0, offsetY = 0 } = personConfig;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const rotationDegrees = directionToDegrees(direction);

    const currentStance = stances[stance] || stances["attention"];

    let leftFoot = currentStance.leftFoot;
    let rightFoot = currentStance.rightFoot;
    let cog = currentStance.cog;

    if (rotationDegrees !== 0) {
        leftFoot = rotatePoint(leftFoot, rotationDegrees);
        rightFoot = rotatePoint(rightFoot, rotationDegrees);
        cog = rotatePoint(cog, rotationDegrees);
    }

    const leftFootRotationDegrees = directionToDegrees(currentStance.leftFootRotation);
    const rightFootRotationDegrees = directionToDegrees(currentStance.rightFootRotation);

    const toSvgX = (mathX: number) => (mathX + offsetX) * unit + centerX;
    const toSvgY = (mathY: number) => centerY - ((mathY + offsetY) * unit);

    const leftFootSvgX = toSvgX(leftFoot.x);
    const leftFootSvgY = toSvgY(leftFoot.y);
    const rightFootSvgX = toSvgX(rightFoot.x);
    const rightFootSvgY = toSvgY(rightFoot.y);
    const cogSvgX = toSvgX(cog.x);
    const cogSvgY = toSvgY(cog.y);

    return {
        leftFootGroup: { x: leftFootSvgX, y: leftFootSvgY, rotate: rotationDegrees + leftFootRotationDegrees },
        rightFootGroup: { x: rightFootSvgX, y: rightFootSvgY, rotate: rotationDegrees + rightFootRotationDegrees },
        cog: { cx: cogSvgX, cy: cogSvgY },
        cogPointer: { x: cogSvgX, y: cogSvgY, rotate: rotationDegrees }
    };
}

export function createCircleAnim(targetId: string, fromPos: { cx: number, cy: number }, toPos: { cx: number, cy: number }, duration: number) {
    return {
        targets: targetId,
        cx: [fromPos.cx, toPos.cx],
        cy: [fromPos.cy, toPos.cy],
        duration: duration,
        easing: 'easeInOutSine'
    };
}

export function createPointerAnim(targetId: string, fromPos: { x: number, y: number, rotate: number }, toPos: { x: number, y: number, rotate: number }, duration: number) {
    let diff = toPos.rotate - fromPos.rotate;
    if (diff > 180) { diff -= 360; }
    else if (diff < -180) { diff += 360; }

    return {
        targets: targetId,
        translateX: [fromPos.x, toPos.x],
        translateY: [fromPos.y, toPos.y],
        rotate: `+=${diff}`,
        duration: duration,
        easing: 'easeInOutSine'
    };
}

export function generateGrid(canvasWidth: number, canvasHeight: number, gridSize: number): string {
    const gridColor = "#e0e0e0";
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let gridElems = "";

    // Vertical lines
    for (let i = 0; i <= Math.ceil(centerX / gridSize); i++) {
        // Positive side from center
        let xPos = centerX + (i * gridSize);
        if (xPos < canvasWidth) {
            gridElems += `<line x1="${xPos}" y1="0" x2="${xPos}" y2="${canvasHeight}" stroke="${gridColor}" stroke-width="1" />`;
        }
        // Negative side from center (don't redraw center line)
        if (i > 0) {
            let xNeg = centerX - (i * gridSize);
            if (xNeg > 0) {
                gridElems += `<line x1="${xNeg}" y1="0" x2="${xNeg}" y2="${canvasHeight}" stroke="${gridColor}" stroke-width="1" />`;
            }
        }
    }

    // Horizontal lines
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

export function generateLabels(canvasWidth: number, canvasHeight: number): string {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let labelElems = "";
    labelElems += `<text x="${centerX}" y="20" text-anchor="middle" class="txt">1200 ⬆️</text>`;
    labelElems += `<text x="${canvasWidth - 20}" y="${centerY}" text-anchor="end" dominant-baseline="middle" class="txt">300 ➡️</text>`;
    labelElems += `<text x="20" y="${centerY}" text-anchor="start" dominant-baseline="middle" class="txt">⬅️ 900</text>`;
    labelElems += `<text x="${centerX}" y="${canvasHeight - 20}" text-anchor="middle" dominant-baseline="hanging" class="txt">600 ⬇️</text>`;
    return labelElems;
}

export function generateCenterMarker(canvasWidth: number, canvasHeight: number): string {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    return `<circle cx="${centerX}" cy="${centerY}" r="5" fill="gray" />`;
}

export function generateVignette(canvasWidth: number, canvasHeight: number): string {
    return `
        <defs>
            <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="50%">
                <stop offset="30%" stop-color="white" stop-opacity="0" />
                <stop offset="100%" stop-color="white" stop-opacity="1" />
            </radialGradient>
        </defs>
        <rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" fill="url(#vignetteGradient)" />
    `;
}

export function generateAnimationTimeline(cfg: any, canvasWidth: number, canvasHeight: number, unitSize: number): any[] {
    const baseAnimationDuration = 1000; // Define base duration here
    const timelineData = [];
    if (cfg.steps.length > 1) {
        let lastConfig = { ...cfg.steps[0] };
        if (lastConfig.offsetX === undefined) lastConfig.offsetX = 0;
        if (lastConfig.offsetY === undefined) lastConfig.offsetY = 0;

        for (let i = 0; i < cfg.steps.length - 1; i++) {
            const fromCoords = getPersonShapeCoordinates(lastConfig, canvasWidth, canvasHeight, unitSize);

            const toStep = cfg.steps[i + 1];
            const pivot = toStep.pivot;

            let nextConfig = { ...toStep };
            nextConfig.offsetX = lastConfig.offsetX;
            nextConfig.offsetY = lastConfig.offsetY;

            // Calculate actual duration for this step
            const stepAnimationDuration = baseAnimationDuration * (toStep.duration !== undefined ? toStep.duration : 1);

            if (pivot === 'left' || pivot === 'right') {
                const fromPivotCoords = (pivot === 'left') ? { cx: fromCoords.leftFootGroup.x, cy: fromCoords.leftFootGroup.y } : { cx: fromCoords.rightFootGroup.x, cy: fromCoords.rightFootGroup.y };
                const toStance = stances[toStep.stance];
                
                let toPivotMath = (pivot === 'left') ? toStance.leftFoot : toStance.rightFoot;

                const rotationDegrees = directionToDegrees(toStep.direction);
                if (rotationDegrees !== 0) {
                    toPivotMath = rotatePoint(toPivotMath, rotationDegrees);
                }

                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;
                const unit = unitSize;

                const toOffsetX = (fromPivotCoords.cx - centerX) / unit - toPivotMath.x;
                const toOffsetY = (centerY - fromPivotCoords.cy) / unit - toPivotMath.y;

                nextConfig.offsetX = toOffsetX;
                nextConfig.offsetY = toOffsetY;
            }

            const toCoords = getPersonShapeCoordinates(nextConfig, canvasWidth, canvasHeight, unitSize);

            const stepAnims = [];

            stepAnims.push(createPointerAnim('#leftFootGroup', fromCoords.leftFootGroup, toCoords.leftFootGroup, stepAnimationDuration));
            stepAnims.push(createPointerAnim('#rightFootGroup', fromCoords.rightFootGroup, toCoords.rightFootGroup, stepAnimationDuration));
            stepAnims.push(createCircleAnim('#cog', fromCoords.cog, toCoords.cog, stepAnimationDuration));
            stepAnims.push(createPointerAnim('#cogPointer', fromCoords.cogPointer, toCoords.cogPointer, stepAnimationDuration));

            let labelInfo = null;
            if (toStep.labels && Array.isArray(toStep.labels)) {
                const cogY = toCoords.cog.cy;
                const canvasCenterY = canvasHeight / 2;
                const topY = 150;
                const bottomY = 450;
                labelInfo = {
                    texts: toStep.labels,
                    y: cogY > canvasCenterY ? topY : bottomY,
                    duration: stepAnimationDuration
                };
            }

            timelineData.push({ anims: stepAnims, label: labelInfo });

            lastConfig = nextConfig;
        }
    }
    return timelineData;
}