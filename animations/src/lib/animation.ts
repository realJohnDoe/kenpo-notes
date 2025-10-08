import { log } from 'console';
import { stances, rotatePoint, directionToDegrees } from './kenpo-geometry';

function calculateShapeTransforms(personConfig: any, canvasWidth: number, canvasHeight: number, unit: number) {
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

    const leftFootTotalRotation = (rotationDegrees + leftFootRotationDegrees) % 360;
    const rightFootTotalRotation = (rotationDegrees + rightFootRotationDegrees) % 360;

    return {
        leftFootGroup: { x: leftFootSvgX, y: leftFootSvgY, rotate: leftFootTotalRotation },
        rightFootGroup: { x: rightFootSvgX, y: rightFootSvgY, rotate: rightFootTotalRotation },
        cog: { cx: cogSvgX, cy: cogSvgY },
        cogPointer: { x: cogSvgX, y: cogSvgY, rotate: rotationDegrees }
    };
}

export function generatePersonShapes(personConfig: any, canvasWidth: number, canvasHeight: number, unit: number, rightFootSvgContent: string, headSvgContent: string): string {
    const transforms = calculateShapeTransforms(personConfig, canvasWidth, canvasHeight, unit);

    let shapesSvg = "";

    const svgSizeInPixels = 100
    const scaleFactor = 0.4;

    // Adjust translation to map the visual center of the SVG to the foot's coordinate
    const svgOffsetX = - svgSizeInPixels / 2;
    const svgOffsetY = -svgSizeInPixels / 2;

    // Left Foot Group
    shapesSvg += `<g id="leftFootGroup" transform="translate(${transforms.leftFootGroup.x}, ${transforms.leftFootGroup.y}) rotate(${transforms.leftFootGroup.rotate})">
        <g transform="scale(${scaleFactor}, ${scaleFactor}) scale(-1, 1) translate(${svgOffsetX}, ${svgOffsetY})"> <!-- Corrected order for mirroring -->
            ${rightFootSvgContent}
        </g>
    </g>`;

    // Right Foot Group
    shapesSvg += `<g id="rightFootGroup" transform="translate(${transforms.rightFootGroup.x}, ${transforms.rightFootGroup.y}) rotate(${transforms.rightFootGroup.rotate})">
        <g transform="scale(${scaleFactor}, ${scaleFactor}) translate(${svgOffsetX}, ${svgOffsetY})">
            ${rightFootSvgContent}
        </g>
    </g>`;

    const headScaleFactor = 0.6;

    // Center of Gravity (new)
    shapesSvg += `<g id="cog" transform="translate(${transforms.cog.cx}, ${transforms.cog.cy}) rotate(${transforms.cogPointer.rotate})">
        <g transform="scale(${headScaleFactor}, ${headScaleFactor}) translate(${svgOffsetX}, ${svgOffsetY})">
            ${headSvgContent}
        </g>
    </g>`;

    return shapesSvg;
}

export function createCircleAnim(targetId: string, fromPos: { cx: number, cy: number }, toPos: { cx: number, cy: number }, duration: number) {
    return {
        targets: targetId,
        options: {
            cx: [fromPos.cx, toPos.cx],
            cy: [fromPos.cy, toPos.cy],
            duration: duration,
            ease: 'easeInOutSine'
        }
    };
}

export function createPointerAnim(targetId: string, fromPos: { x: number, y: number, rotate: number }, toPos: { x: number, y: number, rotate: number }, duration: number) {
    let diff = toPos.rotate - fromPos.rotate;
    if (diff > 180) { diff -= 360; }
    else if (diff < -180) { diff += 360; }

    return {
        targets: targetId,
        options: {
            translateX: [fromPos.x, toPos.x],
            translateY: [fromPos.y, toPos.y],
            rotate: `+=${diff}`,
            duration: duration,
            ease: 'easeInOutSine'
        }
    };
}

export function generateAnimationTimeline(cfg: any, canvasWidth: number, canvasHeight: number, unitSize: number): { timelineData: any[], labelsData: any[] } {
    const baseAnimationDuration = 1000; // Define base duration here
    const fadeDuration = 200;
    const timelineData = [];
    const labelsData: { id: string; text: string; y: number; }[] = [];
    if (cfg.steps.length > 1) {
        let lastConfig = { ...cfg.steps[0] };
        if (lastConfig.offsetX === undefined) lastConfig.offsetX = 0;
        if (lastConfig.offsetY === undefined) lastConfig.offsetY = 0;

        for (let i = 0; i < cfg.steps.length - 1; i++) {
            const fromCoords = calculateShapeTransforms(lastConfig, canvasWidth, canvasHeight, unitSize);

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

            const toCoords = calculateShapeTransforms(nextConfig, canvasWidth, canvasHeight, unitSize);

            const stepAnims = [];

            stepAnims.push(createPointerAnim('#leftFootGroup', fromCoords.leftFootGroup, toCoords.leftFootGroup, stepAnimationDuration));
            stepAnims.push(createPointerAnim('#rightFootGroup', fromCoords.rightFootGroup, toCoords.rightFootGroup, stepAnimationDuration));
            stepAnims.push(createPointerAnim('#cog', fromCoords.cogPointer, toCoords.cogPointer, stepAnimationDuration));

            const cogY = toCoords.cog.cy;
            const canvasCenterY = canvasHeight / 2;
            const topY = 150;
            const bottomY = 450;
            const labelY = cogY > canvasCenterY ? topY : bottomY;

            if (toStep.labels && Array.isArray(toStep.labels) && toStep.labels.length > 0) {
                const durationPerLabel = stepAnimationDuration / toStep.labels.length;

                toStep.labels.forEach((labelText: string, labelIndex: number) => {
                    const labelId = toStep.labels.length === 1
                        ? `step-${i + 1}-label`
                        : `step-${i + 1}-label-${labelIndex}`;

                    labelsData.push({
                        id: labelId,
                        text: labelText,
                        y: labelY
                    });

                    const labelDelay = labelIndex * durationPerLabel;
                    // Ensure total animation time fits within the allocated time
                    const totalLabelDuration = Math.min(durationPerLabel, stepAnimationDuration - labelDelay);
                    const holdDuration = Math.max(0, totalLabelDuration - 2 * fadeDuration);
                    const actualFadeDuration = Math.min(fadeDuration, totalLabelDuration / 2);

                    stepAnims.push({
                        targets: `#${labelId}`,
                        options: {
                            delay: labelDelay,
                            opacity: [
                                { to: 1, duration: actualFadeDuration, ease: 'linear' },
                                { to: 1, duration: holdDuration },
                                { to: 0, duration: actualFadeDuration, ease: 'linear' }
                            ]
                        }
                    });
                });
            }
            timelineData.push({
                anims: stepAnims,
                label: null
            });

            lastConfig = nextConfig;
        }
    }
    return { timelineData, labelsData };
}