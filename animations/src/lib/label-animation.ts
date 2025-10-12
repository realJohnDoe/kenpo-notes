import type {
    AnimationData,
    LabelData,
    CanvasDims
} from './animation-types';

function calculateLabelYPosition(cogY: number, canvasHeight: number): number {
    const canvasCenterY = canvasHeight / 2;
    const topY = canvasHeight * 1 / 3;
    const bottomY = canvasHeight * 2 / 3;
    return cogY > canvasCenterY ? topY : bottomY;
}

export type LabelAnimation = {
    targets: string;
    options: {
        delay: number;
        opacity: {
            to: number;
            duration: number;
            ease: 'linear';
        }[];
    };
};

function createLabelAnimations(toStep: any, stepIndex: number, labelY: number, stepAnimationDuration: number, fadeDuration: number, labelsData: LabelData[]): LabelAnimation[] {
    const stepAnims: LabelAnimation[] = [];
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
                        { to: 1, duration: durationPerLabel - fadeDuration + 1, ease: 'linear' },
                        { to: 0, duration: 1, ease: 'linear' }
                    ]
                }
            });
        });
    }
    return stepAnims;
}

export function processLabelAnimationsToAnimationData(
    labels: string[] | undefined,
    stepIndex: number,
    cogY: number,
    stepAnimationDuration: number,
    fadeDuration: number,
    canvasDims: CanvasDims,
    labelsData: LabelData[],
    labelCycleDuration: number
): AnimationData[] {
    if (!labels || labels.length === 0) return [];

    const labelY = calculateLabelYPosition(cogY, canvasDims.height);
    const labelAnims = createLabelAnimations({ labels }, stepIndex, labelY, stepAnimationDuration, fadeDuration, labelsData);

    const result: AnimationData[] = [];
    if (labelAnims.length > 0) {
        const durationPerLabel = labelCycleDuration / labelAnims.length;
        for (const labelAnim of labelAnims) {
            const labelTotalDuration = labelAnim.options.opacity.reduce((sum, p) => sum + p.duration, 0);
            const delay = labelAnim.options.delay;
            labelAnim.options.delay = 0;
            result.push({
                startFrame: delay,
                durationToEndFrame: durationPerLabel,
                durationAfterEndFrame: labelTotalDuration - durationPerLabel,
                targets: [{ target: labelAnim.targets, cfg: labelAnim.options }]
            });
        }
    }
    return result;
}