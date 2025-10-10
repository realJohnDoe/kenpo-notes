import { stances, rotatePoint, directionToDegrees } from './kenpo-geometry';

// --- General Utility Functions (Relevant to both body and labels, or core calculations) ---

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

export function createBodyPartMovementAnim(targetId: string, fromPos: { x: number, y: number, rotate: number }, toPos: { x: number, y: number, rotate: number }, duration: number) {
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

// --- Body Animation Specific Functions ---

function createBodyPartAnimations(fromCoords: any, toCoords: any, stepAnimationDuration: number) {
    const stepAnims = [];
    stepAnims.push(createBodyPartMovementAnim('#leftFootGroup', fromCoords.leftFootGroup, toCoords.leftFootGroup, stepAnimationDuration));
    stepAnims.push(createBodyPartMovementAnim('#rightFootGroup', fromCoords.rightFootGroup, toCoords.rightFootGroup, stepAnimationDuration));
    stepAnims.push(createBodyPartMovementAnim('#cog', fromCoords.cogPointer, toCoords.cogPointer, stepAnimationDuration));
    return stepAnims;
}

// --- Label Animation Specific Functions ---

function calculateLabelYPosition(cogY: number, canvasHeight: number): number {
    const canvasCenterY = canvasHeight / 2;
    const topY = canvasHeight / 4;
    const bottomY = canvasHeight * 3 / 4;
    return cogY > canvasCenterY ? topY : bottomY;
}

function createLabelAnimations(toStep: any, stepIndex: number, labelY: number, stepAnimationDuration: number, fadeDuration: number, labelsData: { id: string; text: string; y: number; }[]) {
    const stepAnims = [];
    if (toStep.labels && Array.isArray(toStep.labels) && toStep.labels.length > 0) {
        const durationPerLabel = stepAnimationDuration / toStep.labels.length;

        toStep.labels.forEach((labelText: string, labelIndex: number) => {
            const labelId = toStep.labels.length === 1
                ? `step-${stepIndex + 1}-label`
                : `step-${stepIndex + 1}-label-${labelIndex}`;

            labelsData.push({
                id: labelId,
                text: labelText,
                y: labelY
            });

            const labelDelay = labelIndex * durationPerLabel;

            stepAnims.push({ 
                targets: `#${labelId}`,
                options: {
                    delay: labelDelay,
                    opacity: [
                        { to: 1, duration: fadeDuration, ease: 'linear' },
                        { to: 1, duration: durationPerLabel - fadeDuration + 1 },
                        { to: 0, duration: 1, ease: 'linear' }
                    ]
                }
            });
        });
    }
    return stepAnims;
}

// --- YAML Format Normalization Functions ---

export function normalizeStep(step: any): any {
    // Handle new stance format: { type: 'attention', direction: 1200, pivot: 'left' }
    if (step.stance && typeof step.stance === 'object') {
        const normalizedStep = { ...step };
        normalizedStep.stance = step.stance.type;
        normalizedStep.direction = step.stance.direction;
        if (step.stance.pivot) {
            normalizedStep.pivot = step.stance.pivot;
        }
        return normalizedStep;
    }
    
    // Handle label-only steps (no stance, stances, or body movement)
    if (!step.stance && !step.stances && (step.labels || step.label)) {
        // Convert single label to labels array
        if (step.label && !step.labels) {
            step.labels = [step.label];
        }
        // Create a "no-op" step that doesn't move the body but shows labels
        return {
            ...step,
            stance: null, // Special marker for label-only steps
            isLabelOnly: true
        };
    }

    // Handle multiple stances in one step
    if (step.stances && Array.isArray(step.stances)) {
        // For now, we'll return the step as-is and handle this in the main loop
        // We'll need to create multiple sub-steps from this
        return {
            ...step,
            isMultiStance: true
        };
    }

    // Handle single label field -> labels array conversion
    if (step.label && !step.labels) {
        step.labels = [step.label];
        delete step.label;
    }

    // Return step as-is for old format compatibility
    return step;
}

function expandMultiStanceStep(step: any, stepDuration: number): any[] {
    if (!step.isMultiStance || !step.stances) {
        return [step];
    }
    
    const subSteps = [];
    const durationPerStance = stepDuration / step.stances.length;
    
    step.stances.forEach((stance: any, index: number) => {
        const subStep = {
            stance: stance.type,
            direction: stance.direction,
            pivot: stance.pivot,
            duration: durationPerStance / 1000, // Convert to seconds for internal format
            // Only add labels to the first sub-step to span the whole duration
            ...(index === 0 && (step.labels || step.label) ? {
                labels: step.labels || [step.label]
            } : {})
        };
        subSteps.push(subStep);
    });
    
    return subSteps;
}

// --- Functions relevant to both (Or orchestrators) ---

function applyPivotLogic(nextConfig: any, lastConfig: any, pivot: string, fromCoords: any, canvasWidth: number, canvasHeight: number, unitSize: number) {
    nextConfig.offsetX = lastConfig.offsetX;
    nextConfig.offsetY = lastConfig.offsetY;

    if (pivot === 'left' || pivot === 'right') {
        const fromPivotCoords = (pivot === 'left') ? { cx: fromCoords.leftFootGroup.x, cy: fromCoords.leftFootGroup.y } : { cx: fromCoords.rightFootGroup.x, cy: fromCoords.rightFootGroup.y };
        const toStance = stances[nextConfig.stance];

        let toPivotMath = (pivot === 'left') ? toStance.leftFoot : toStance.rightFoot;

        const rotationDegrees = directionToDegrees(nextConfig.direction);
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
    return nextConfig;
}

// The user-defined data structure.
export type AnimationData = {
    startFrame: number;
    durationToEndFrame: number;
    durationAfterEndFrame: number;
    targets: { 
        target: string;
        cfg: any;
    }[];
};

export function generateAndComputeAnimationData(cfg: any, canvasWidth: number, canvasHeight: number, unitSize: number): { animationData: AnimationData[], labelsData: any[] } {
    const baseAnimationDuration = 1000;
    const fadeDuration = 200;
    const labelsData: { id: string; text: string; y: number; }[] = [];
    const animationDataList: AnimationData[] = [];
    let currentTimelineCursor = 0;

    // First, normalize all steps to handle new YAML format
    const normalizedSteps = cfg.steps.map(normalizeStep);
    
    // Expand multi-stance steps into multiple sub-steps
    const expandedSteps = [];
    for (let i = 0; i < normalizedSteps.length; i++) {
        const step = normalizedSteps[i];
        if (step.isMultiStance) {
            const stepDuration = baseAnimationDuration * (step.duration !== undefined ? step.duration : 1);
            const subSteps = expandMultiStanceStep(step, stepDuration);
            expandedSteps.push(...subSteps);
        } else {
            expandedSteps.push(step);
        }
    }

    if (expandedSteps.length > 1) {
        let lastConfig = { ...expandedSteps[0] };
        if (lastConfig.offsetX === undefined) lastConfig.offsetX = 0;
        if (lastConfig.offsetY === undefined) lastConfig.offsetY = 0;

        for (let i = 0; i < expandedSteps.length - 1; i++) {
            const toStep = expandedSteps[i + 1];
            const stepAnimationDuration = baseAnimationDuration * (toStep.duration !== undefined ? toStep.duration : 1);

            let stepAnims = [];
            let nextConfig = { ...toStep };
            let currentStepDuration = stepAnimationDuration;

            // Handle label-only steps (no body movement)
            if (toStep.isLabelOnly) {
                // For label-only steps, we don't move the body, just show labels
                // Use the last position for coordinates calculation
                const labelCoords = calculateShapeTransforms(lastConfig, canvasWidth, canvasHeight, unitSize);
                const labelY = calculateLabelYPosition(labelCoords.cog.cy, canvasHeight);
                stepAnims = stepAnims.concat(createLabelAnimations(toStep, i, labelY, stepAnimationDuration, fadeDuration, labelsData));
                // Don't update lastConfig for label-only steps
            } else {
                // Normal steps with body movement
                const fromCoords = calculateShapeTransforms(lastConfig, canvasWidth, canvasHeight, unitSize);
                nextConfig = applyPivotLogic(nextConfig, lastConfig, toStep.pivot, fromCoords, canvasWidth, canvasHeight, unitSize);
                const toCoords = calculateShapeTransforms(nextConfig, canvasWidth, canvasHeight, unitSize);

                stepAnims = stepAnims.concat(createBodyPartAnimations(fromCoords, toCoords, stepAnimationDuration));

                const labelY = calculateLabelYPosition(toCoords.cog.cy, canvasHeight);
                stepAnims = stepAnims.concat(createLabelAnimations(toStep, i, labelY, stepAnimationDuration, fadeDuration, labelsData));

                // Update lastConfig for next iteration
                lastConfig = nextConfig;
            }

            const bodyPartAnims = stepAnims.filter((anim: any) => anim.targets.startsWith('#') && !anim.targets.includes('label'));
            const labelAnims = stepAnims.filter((anim: any) => anim.targets.includes('label'));

            if (bodyPartAnims.length > 0) {
                currentStepDuration = bodyPartAnims[0].options.duration;
                animationDataList.push({
                    startFrame: currentTimelineCursor,
                    durationToEndFrame: currentStepDuration,
                    durationAfterEndFrame: 0,
                    targets: bodyPartAnims.map((anim: any) => ({ target: anim.targets, cfg: anim.options }))
                });
            }

            if (labelAnims.length > 0) {
                const durationPerLabel = currentStepDuration / labelAnims.length;
                for (const labelAnim of labelAnims) {
                    const labelTotalDuration = labelAnim.options.opacity.reduce((sum: number, p: any) => sum + p.duration, 0);
                    const delay = labelAnim.options.delay
                    labelAnim.options.delay = 0
                    animationDataList.push({
                        startFrame: currentTimelineCursor + delay,
                        durationToEndFrame: durationPerLabel,
                        durationAfterEndFrame: labelTotalDuration - durationPerLabel,
                        targets: [{ target: labelAnim.targets, cfg: labelAnim.options }]
                    });
                }
            }

            currentTimelineCursor += currentStepDuration;
        }
    }

    return { animationData: animationDataList, labelsData };
}