import type {
    CanvasDims,
    PersonConfig,
    LabelData,
    AnimationData,
    Stance
} from './animation-types';
import {
    calculateShapeTransforms,
    applyPivotLogic,
    processBodyAnimationsToAnimationData
} from './body-animation';
import { processLabelAnimationsToAnimationData } from './label-animation';

export * from './animation-types';
export { createBodyPartMovementAnim, generatePersonShapes } from './body-animation';

export type DefaultStep = {
    stance: Stance;
    duration: number;
    labels?: string[];
};

export type LabelOnlyStep = {
    label?: string;
    labels?: string[];
    duration: number;
};

export type MultiStanceStep = {
    stances: Stance[];
    duration: number;
    label?: string;
    labels?: string[];
};

function parseStepFromYaml(rawStep: any): LabelOnlyStep | DefaultStep | MultiStanceStep {
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

    if (rawStep.stance) {
        let stance: Stance;

        if (typeof rawStep.stance === 'object') {
            stance = {
                type: rawStep.stance.type,
                direction: rawStep.stance.direction,
                pivot: rawStep.stance.pivot
            };
        } else {
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

    return {
        label: rawStep.label,
        labels: rawStep.labels,
        duration: rawStep.duration !== undefined ? rawStep.duration : 1
    };
}

function convertLabelOnlyStepToAnimationData(
    step: LabelOnlyStep,
    stepIndex: number,
    lastConfig: PersonConfig,
    context: AnimationContext
): AnimationData[] {
    const stepAnimationDuration = context.baseAnimationDuration * step.duration;

    const coords = calculateShapeTransforms(lastConfig, context.canvasDims);
    const labels = step.labels || (step.label ? [step.label] : []);

    return processLabelAnimationsToAnimationData(
        labels, stepIndex, coords.cogPointer.y, stepAnimationDuration, context.fadeDuration, context.canvasDims, context.labelsData, stepAnimationDuration
    );
}

function convertDefaultStepToAnimationData(
    step: DefaultStep,
    stepIndex: number,
    lastConfig: PersonConfig,
    context: AnimationContext
): { animationData: AnimationData[], newConfig: PersonConfig } {
    const stepAnimationDuration = context.baseAnimationDuration * step.duration;

    const { animationData: bodyAnimationData, newConfig, toCoords } = processBodyAnimationsToAnimationData(
        step.stance, lastConfig, stepAnimationDuration, context.canvasDims
    );

    const bodyDuration = bodyAnimationData.length > 0 ? bodyAnimationData[0].durationToEndFrame : stepAnimationDuration;

    const labelAnimationData = processLabelAnimationsToAnimationData(
        step.labels, stepIndex, toCoords.cogPointer.y, stepAnimationDuration, context.fadeDuration, context.canvasDims, context.labelsData, bodyDuration
    );

    const animationData = [...bodyAnimationData, ...labelAnimationData];

    return { animationData, newConfig };
}

function convertMultiStanceStepToAnimationData(
    step: MultiStanceStep,
    stepIndex: number,
    lastConfig: PersonConfig,
    context: AnimationContext
): { animationData: AnimationData[], newConfig: PersonConfig } {
    const stepAnimationDuration = context.baseAnimationDuration * step.duration;

    const result: AnimationData[] = [];
    let currentConfig: PersonConfig = lastConfig;

    const labels = step.labels || (step.label ? [step.label] : []);
    if (labels.length > 0) {
        const fromCoords = calculateShapeTransforms(lastConfig, context.canvasDims);
        const firstStance = step.stances[0];
        let firstConfig: PersonConfig = {
            stance: firstStance.type,
            direction: firstStance.direction,
            pivot: firstStance.pivot,
            offsetX: lastConfig.offsetX,
            offsetY: lastConfig.offsetY
        };
        firstConfig = applyPivotLogic(firstConfig, lastConfig, firstStance.pivot, fromCoords, context.canvasDims);
        const toCoords = calculateShapeTransforms(firstConfig, context.canvasDims);

        const labelAnimationData = processLabelAnimationsToAnimationData(
            labels, stepIndex, toCoords.cogPointer.y, stepAnimationDuration, context.fadeDuration, context.canvasDims, context.labelsData, stepAnimationDuration
        );
        result.push(...labelAnimationData);
    }

    const durationPerStance = stepAnimationDuration / step.stances.length;
    for (let i = 0; i < step.stances.length; i++) {
        const stance = step.stances[i];

        const { animationData: bodyAnimationData, newConfig } = processBodyAnimationsToAnimationData(
            stance, currentConfig, durationPerStance, context.canvasDims
        );

        result.push(...bodyAnimationData);
        currentConfig = newConfig;
    }

    return { animationData: result, newConfig: currentConfig };
}

export type ComputedAnimation = {
    animationData: AnimationData[];
    labelsData: LabelData[];
};

export type AnimationContext = {
    baseAnimationDuration: number;
    fadeDuration: number;
    canvasDims: CanvasDims;
    labelsData: LabelData[];
};

export function generateAndComputeAnimationData(cfg: any, canvasDims: CanvasDims): ComputedAnimation {
    const baseAnimationDuration = 1000;
    const fadeDuration = 200;
    const labelsData: LabelData[] = [];
    const animationDataList: AnimationData[] = [];
    let currentTimelineCursor = 0;

    if (cfg.steps.length > 1) {
        const firstStepRaw = cfg.steps[0];
        let lastConfig: PersonConfig = {
            stance: firstStepRaw.stance?.type || firstStepRaw.stance || 'attention',
            direction: firstStepRaw.stance?.direction || firstStepRaw.direction || 1200,
            offsetX: firstStepRaw.offsetX || 0,
            offsetY: firstStepRaw.offsetY || 0
        };

        const context: AnimationContext = {
            baseAnimationDuration,
            fadeDuration,
            canvasDims,
            labelsData
        };

        for (let i = 1; i < cfg.steps.length; i++) {
            const rawStep = cfg.steps[i];
            const parsedStep = parseStepFromYaml(rawStep);

            let stepAnimationData: AnimationData[] = [];
            let stepDuration = context.baseAnimationDuration * parsedStep.duration;

            if ('stances' in parsedStep) {
                const result = convertMultiStanceStepToAnimationData(
                    parsedStep, i - 1, lastConfig, context
                );
                stepAnimationData = result.animationData;
                lastConfig = result.newConfig;

                const durationPerStance = stepDuration / parsedStep.stances.length;

                const bodyAnimations = stepAnimationData.filter(anim =>
                    anim.targets.some(t => !t.target.includes('label'))
                );
                const labelAnimations = stepAnimationData.filter(anim =>
                    anim.targets.some(t => t.target.includes('label'))
                );

                if (bodyAnimations.length > 0) {
                    const firstBodyAnim = bodyAnimations[0];
                    firstBodyAnim.startFrame += currentTimelineCursor;
                    animationDataList.push(firstBodyAnim);
                }

                labelAnimations.forEach(animData => {
                    animData.startFrame += currentTimelineCursor;
                    animationDataList.push(animData);
                });

                for (let j = 1; j < bodyAnimations.length; j++) {
                    const bodyAnim = bodyAnimations[j];
                    bodyAnim.startFrame += currentTimelineCursor + (j * durationPerStance);
                    animationDataList.push(bodyAnim);
                }

            } else if ('stance' in parsedStep) {
                const result = convertDefaultStepToAnimationData(
                    parsedStep, i - 1, lastConfig, context
                );
                stepAnimationData = result.animationData;
                lastConfig = result.newConfig;

                stepAnimationData.forEach(animData => {
                    animData.startFrame += currentTimelineCursor;
                    animationDataList.push(animData);
                });

            } else {
                stepAnimationData = convertLabelOnlyStepToAnimationData(
                    parsedStep, i - 1, lastConfig, context
                );

                stepAnimationData.forEach(animData => {
                    animData.startFrame += currentTimelineCursor;
                    animationDataList.push(animData);
                });
            }

            currentTimelineCursor += stepDuration;
        }
    }

    return { animationData: animationDataList, labelsData };
}