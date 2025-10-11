import { stances, rotatePoint, directionToDegrees } from './kenpo-geometry';

// --- General Utility Functions (Relevant to both body and labels, or core calculations) ---

type CanvasDims = {
    width: number
    height: number
    unitSize: number
}

function calculateShapeTransforms(personConfig: any, canvasDims: CanvasDims) {
    const { stance, direction, offsetX = 0, offsetY = 0 } = personConfig;

    const centerX = canvasDims.width / 2;
    const centerY = canvasDims.height / 2;

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

    const toSvgX = (mathX: number) => (mathX + offsetX) * canvasDims.unitSize + centerX;
    const toSvgY = (mathY: number) => centerY - ((mathY + offsetY) * canvasDims.unitSize);

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
    const canvasDims = { width: canvasWidth, height: canvasHeight, unitSize: unit }
    const transforms = calculateShapeTransforms(personConfig, canvasDims);

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

// --- Step Conversion Functions ---

function convertLabelOnlyStepToAnimationData(
    step: LabelOnlyStep,
    stepIndex: number,
    lastConfig: any,
    baseAnimationDuration: number,
    fadeDuration: number,
    canvasDims: CanvasDims,
    labelsData: { id: string; text: string; y: number; }[]
): AnimationData[] {
    const stepAnimationDuration = baseAnimationDuration * step.duration;

    // Use the last position for coordinates calculation since this is label-only
    const labelCoords = calculateShapeTransforms(lastConfig, canvasDims);
    const labelY = calculateLabelYPosition(labelCoords.cog.cy, canvasDims.height);

    // Normalize labels
    const labels = step.labels || (step.label ? [step.label] : []);

    const stepAnims = createLabelAnimations({ labels }, stepIndex, labelY, stepAnimationDuration, fadeDuration, labelsData);

    // Convert label animations to AnimationData
    const result: AnimationData[] = [];
    const labelAnims = stepAnims.filter((anim: any) => anim.targets.includes('label'));

    if (labelAnims.length > 0) {
        const durationPerLabel = stepAnimationDuration / labelAnims.length;
        for (const labelAnim of labelAnims) {
            const labelTotalDuration = labelAnim.options.opacity.reduce((sum: number, p: any) => sum + p.duration, 0);
            const delay = labelAnim.options.delay;
            labelAnim.options.delay = 0;
            result.push({
                startFrame: delay, // Will be adjusted by caller
                durationToEndFrame: durationPerLabel,
                durationAfterEndFrame: labelTotalDuration - durationPerLabel,
                targets: [{ target: labelAnim.targets, cfg: labelAnim.options }]
            });
        }
    }

    return result;
}

function convertDefaultStepToAnimationData(
    step: DefaultStep,
    stepIndex: number,
    lastConfig: any,
    baseAnimationDuration: number,
    fadeDuration: number,
    canvasDims: CanvasDims,
    labelsData: { id: string; text: string; y: number; }[]
): { animationData: AnimationData[], newConfig: any } {
    const stepAnimationDuration = baseAnimationDuration * step.duration;


    const fromCoords = calculateShapeTransforms(lastConfig, canvasDims);

    // Create next config from stance
    let nextConfig = {
        stance: step.stance.type,
        direction: step.stance.direction,
        pivot: step.stance.pivot,
        offsetX: lastConfig.offsetX,
        offsetY: lastConfig.offsetY
    };

    nextConfig = applyPivotLogic(nextConfig, lastConfig, step.stance.pivot, fromCoords, canvasDims);
    const toCoords = calculateShapeTransforms(nextConfig, canvasDims);

    let stepAnims = [];
    stepAnims = stepAnims.concat(createBodyPartAnimations(fromCoords, toCoords, stepAnimationDuration));

    const labelY = calculateLabelYPosition(toCoords.cog.cy, canvasDims.height);
    stepAnims = stepAnims.concat(createLabelAnimations({ labels: step.labels }, stepIndex, labelY, stepAnimationDuration, fadeDuration, labelsData));

    const result: AnimationData[] = [];
    const bodyPartAnims = stepAnims.filter((anim: any) => anim.targets.startsWith('#') && !anim.targets.includes('label'));
    const labelAnims = stepAnims.filter((anim: any) => anim.targets.includes('label'));

    let currentStepDuration = stepAnimationDuration;
    if (bodyPartAnims.length > 0) {
        currentStepDuration = bodyPartAnims[0].options.duration;
        result.push({
            startFrame: 0, // Will be adjusted by caller
            durationToEndFrame: currentStepDuration,
            durationAfterEndFrame: 0,
            targets: bodyPartAnims.map((anim: any) => ({ target: anim.targets, cfg: anim.options }))
        });
    }

    if (labelAnims.length > 0) {
        const durationPerLabel = currentStepDuration / labelAnims.length;
        for (const labelAnim of labelAnims) {
            const labelTotalDuration = labelAnim.options.opacity.reduce((sum: number, p: any) => sum + p.duration, 0);
            const delay = labelAnim.options.delay;
            labelAnim.options.delay = 0;
            result.push({
                startFrame: delay, // Will be adjusted by caller
                durationToEndFrame: durationPerLabel,
                durationAfterEndFrame: labelTotalDuration - durationPerLabel,
                targets: [{ target: labelAnim.targets, cfg: labelAnim.options }]
            });
        }
    }

    return { animationData: result, newConfig: nextConfig };
}

function convertMultiStanceStepToAnimationData(
    step: MultiStanceStep,
    stepIndex: number,
    lastConfig: any,
    baseAnimationDuration: number,
    fadeDuration: number,
    canvasDims: CanvasDims,
    labelsData: { id: string; text: string; y: number; }[]
): { animationData: AnimationData[], newConfig: any } {
    const stepAnimationDuration = baseAnimationDuration * step.duration;
    const durationPerStance = stepAnimationDuration / step.stances.length;

    const result: AnimationData[] = [];
    let currentConfig = lastConfig;

    // Create a label animation that spans the full duration if there are labels
    const labels = step.labels || (step.label ? [step.label] : []);
    if (labels.length > 0) {
        // Use the first stance position for label positioning
        const fromCoords = calculateShapeTransforms(lastConfig, canvasDims);
        const firstStance = step.stances[0];
        let firstConfig = {
            stance: firstStance.type,
            direction: firstStance.direction,
            pivot: firstStance.pivot,
            offsetX: lastConfig.offsetX,
            offsetY: lastConfig.offsetY
        };
        firstConfig = applyPivotLogic(firstConfig, lastConfig, firstStance.pivot, fromCoords, canvasDims);
        const toCoords = calculateShapeTransforms(firstConfig, canvasDims);

        const labelY = calculateLabelYPosition(toCoords.cog.cy, canvasDims.height);
        const labelStepAnims = createLabelAnimations({ labels }, stepIndex, labelY, stepAnimationDuration, fadeDuration, labelsData);

        // Convert label animations to AnimationData
        const labelAnims = labelStepAnims.filter((anim: any) => anim.targets.includes('label'));
        if (labelAnims.length > 0) {
            const durationPerLabel = stepAnimationDuration / labelAnims.length;
            for (const labelAnim of labelAnims) {
                const labelTotalDuration = labelAnim.options.opacity.reduce((sum: number, p: any) => sum + p.duration, 0);
                const delay = labelAnim.options.delay;
                labelAnim.options.delay = 0;
                result.push({
                    startFrame: delay, // Will be adjusted by caller
                    durationToEndFrame: durationPerLabel,
                    durationAfterEndFrame: labelTotalDuration - durationPerLabel,
                    targets: [{ target: labelAnim.targets, cfg: labelAnim.options }]
                });
            }
        }
    }

    // Create body animations for each stance (without labels)
    for (let i = 0; i < step.stances.length; i++) {
        const stance = step.stances[i];
        const subStep: DefaultStep = {
            stance: stance,
            duration: durationPerStance / baseAnimationDuration, // Normalize back to duration factor
            labels: [] // No labels for individual sub-steps since we handled them above
        };

        const { animationData, newConfig } = convertDefaultStepToAnimationData(
            subStep, stepIndex + i, currentConfig, baseAnimationDuration, fadeDuration,
            canvasDims, labelsData
        );

        // Filter out any label animations from sub-steps (shouldn't have any anyway)
        const bodyOnlyAnimations = animationData.filter(anim =>
            anim.targets.some(t => !t.target.includes('label'))
        );

        result.push(...bodyOnlyAnimations);
        currentConfig = newConfig;
    }

    return { animationData: result, newConfig: currentConfig };
}

// --- Step Type Detection and Parsing ---

function parseStepFromYaml(rawStep: any): LabelOnlyStep | DefaultStep | MultiStanceStep {
    // Handle multi-stance steps
    if (rawStep.stances && Array.isArray(rawStep.stances)) {
        const stances: Stance[] = rawStep.stances.map((s: any) => ({
            type: s.type,
            direction: s.direction,
            pivot: s.pivot
        }));

        return {
            stances,
            duration: rawStep.duration !== undefined ? rawStep.duration : 1,
            label: rawStep.label,
            labels: rawStep.labels
        };
    }

    // Handle stance steps (either old or new format)
    if (rawStep.stance) {
        let stance: Stance;

        if (typeof rawStep.stance === 'object') {
            // New format: { type: 'attention', direction: 1200, pivot: 'left' }
            stance = {
                type: rawStep.stance.type,
                direction: rawStep.stance.direction,
                pivot: rawStep.stance.pivot
            };
        } else {
            // Old format: stance: 'attention' (with separate direction and pivot)
            stance = {
                type: rawStep.stance,
                direction: rawStep.direction || 1200,
                pivot: rawStep.pivot
            };
        }

        return {
            stance,
            duration: rawStep.duration !== undefined ? rawStep.duration : 1,
            labels: rawStep.labels
        };
    }

    // Handle label-only steps
    return {
        label: rawStep.label,
        labels: rawStep.labels,
        duration: rawStep.duration !== undefined ? rawStep.duration : 1
    };
}

// --- Functions relevant to both (Or orchestrators) ---

function applyPivotLogic(nextConfig: any, lastConfig: any, pivot: string, fromCoords: any, canvasDims: CanvasDims) {
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

        const centerX = canvasDims.width / 2;
        const centerY = canvasDims.height / 2;

        const toOffsetX = (fromPivotCoords.cx - centerX) / canvasDims.unitSize - toPivotMath.x;
        const toOffsetY = (centerY - fromPivotCoords.cy) / canvasDims.unitSize - toPivotMath.y;

        nextConfig.offsetX = toOffsetX;
        nextConfig.offsetY = toOffsetY;
    }
    return nextConfig;
}

// --- Type Definitions ---

export type Stance = {
    type: string; // e.g., 'right_neutral', 'left_neutral', 'right_forward', etc.
    direction: number; // e.g., 1200, 130, 300, 430, 600, etc.
    pivot?: 'right' | 'left';
};

export type LabelOnlyStep = {
    label?: string;
    labels?: string[];
    duration: number;
};

export type DefaultStep = {
    stance: Stance;
    duration: number;
    labels?: string[];
};

export type MultiStanceStep = {
    stances: Stance[];
    duration: number;
    label?: string;
    labels?: string[];
};

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

    const canvasDims = { width: canvasWidth, height: canvasHeight, unitSize: unitSize }

    if (cfg.steps.length > 1) {
        // Parse first step to get initial configuration
        const firstStepRaw = cfg.steps[0];
        let lastConfig = {
            stance: firstStepRaw.stance?.type || firstStepRaw.stance || 'attention',
            direction: firstStepRaw.stance?.direction || firstStepRaw.direction || 1200,
            offsetX: firstStepRaw.offsetX || 0,
            offsetY: firstStepRaw.offsetY || 0
        };

        // Process each step after the first one
        for (let i = 1; i < cfg.steps.length; i++) {
            const rawStep = cfg.steps[i];
            const parsedStep = parseStepFromYaml(rawStep);

            let stepAnimationData: AnimationData[] = [];
            let stepDuration = baseAnimationDuration * parsedStep.duration;

            // Determine step type and convert accordingly
            if ('stances' in parsedStep) {
                // Multi-stance step
                const result = convertMultiStanceStepToAnimationData(
                    parsedStep, i - 1, lastConfig, baseAnimationDuration, fadeDuration,
                    canvasDims, labelsData
                );
                stepAnimationData = result.animationData;
                lastConfig = result.newConfig;

                // For multi-stance steps, we need to handle timing specially
                // Expected order: first body, label, second body...
                let bodyAnimCounter = 0;
                const durationPerStance = stepDuration / parsedStep.stances.length;

                // Separate body and label animations
                const bodyAnimations = stepAnimationData.filter(anim =>
                    anim.targets.some(t => !t.target.includes('label'))
                );
                const labelAnimations = stepAnimationData.filter(anim =>
                    anim.targets.some(t => t.target.includes('label'))
                );

                // Add first body animation 
                if (bodyAnimations.length > 0) {
                    const firstBodyAnim = bodyAnimations[0];
                    firstBodyAnim.startFrame += currentTimelineCursor;
                    animationDataList.push(firstBodyAnim);
                }

                // Add label animations (start at beginning)
                labelAnimations.forEach(animData => {
                    animData.startFrame += currentTimelineCursor;
                    animationDataList.push(animData);
                });

                // Add remaining body animations (with staggered timing)
                for (let i = 1; i < bodyAnimations.length; i++) {
                    const bodyAnim = bodyAnimations[i];
                    bodyAnim.startFrame += currentTimelineCursor + (i * durationPerStance);
                    animationDataList.push(bodyAnim);
                }

            } else if ('stance' in parsedStep) {
                // Default step with stance
                const result = convertDefaultStepToAnimationData(
                    parsedStep, i - 1, lastConfig, baseAnimationDuration, fadeDuration,
                    canvasDims, labelsData
                );
                stepAnimationData = result.animationData;
                lastConfig = result.newConfig;

                // Adjust start frames and add to final list
                stepAnimationData.forEach(animData => {
                    animData.startFrame += currentTimelineCursor;
                    animationDataList.push(animData);
                });

            } else {
                // Label-only step
                stepAnimationData = convertLabelOnlyStepToAnimationData(
                    parsedStep, i - 1, lastConfig, baseAnimationDuration, fadeDuration,
                    canvasDims, labelsData
                );
                // Don't update lastConfig for label-only steps

                // Adjust start frames and add to final list
                stepAnimationData.forEach(animData => {
                    animData.startFrame += currentTimelineCursor;
                    animationDataList.push(animData);
                });
            }

            // Update timeline cursor - for all step types, advance by the full step duration
            currentTimelineCursor += stepDuration;
        }
    }

    return { animationData: animationDataList, labelsData };
}