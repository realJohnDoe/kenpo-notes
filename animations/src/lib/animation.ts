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
import { stances } from './kenpo-geometry';
import { processLabelAnimationsToAnimationData } from './label-animation';

export * from './animation-types';
export {
  createBodyPartMovementAnim,
  generatePersonShapes
} from './body-animation';

export type DefaultStep = {
  stance: Stance;
  duration: number;
  labels?: string[];
};

export type LabelOnlyStep = {
  labels?: string[];
  duration: number;
};

export type MultiStanceStep = {
  stances: Stance[];
  duration: number;
  labels?: string[];
};

const STEP_KEYS = new Set([
  'stance',
  'stances',
  'direction',
  'pivot',
  'duration',
  'label',
  'labels',
  'offsetX',
  'offsetY'
]);

function checkStance(type: unknown, where: string): string {
  if (typeof type !== 'string' || !(type in stances)) {
    throw new Error(`${where}: unknown stance ${JSON.stringify(type)}`);
  }
  return type;
}

function parseStanceFromYaml(raw: any, where: string): Stance {
  const obj = typeof raw === 'object' ? raw : { type: raw };
  return {
    type: checkStance(obj.type, where),
    direction: obj.direction,
    pivot: obj.pivot
  };
}

function parseStepFromYaml(
  rawStep: any,
  index: number
): LabelOnlyStep | DefaultStep | MultiStanceStep {
  const where = `step ${index}`;
  for (const key of Object.keys(rawStep ?? {})) {
    if (!STEP_KEYS.has(key)) throw new Error(`${where}: unknown key "${key}"`);
  }
  const duration = rawStep.duration !== undefined ? rawStep.duration : 1;
  const labels: string[] | undefined =
    rawStep.labels ?? (rawStep.label ? [rawStep.label] : undefined);

  if (Array.isArray(rawStep.stances)) {
    return {
      stances: rawStep.stances.map((s: any) => parseStanceFromYaml(s, where)),
      duration,
      labels
    };
  }

  if (rawStep.stance) {
    const stance = parseStanceFromYaml(rawStep.stance, where);
    if (typeof rawStep.stance !== 'object') {
      stance.direction = rawStep.direction || 1200;
      stance.pivot = rawStep.pivot;
    }
    return { stance, duration, labels };
  }

  return { labels, duration };
}

/** Validates a form file; the single source of its initial person config. */
export function parseForm(cfg: any): {
  initialConfig: PersonConfig;
  steps: (LabelOnlyStep | DefaultStep | MultiStanceStep)[];
} {
  const rawSteps: any[] = cfg?.steps;
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    throw new Error('form has no steps');
  }
  const steps = rawSteps.map((raw, i) => parseStepFromYaml(raw, i));
  const first = rawSteps[0];
  return {
    initialConfig: {
      stance: first.stance?.type || first.stance || 'attention',
      direction: first.stance?.direction || first.direction || 1200,
      offsetX: first.offsetX || 0,
      offsetY: first.offsetY || 0
    },
    steps
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
  const labels = step.labels || [];

  return processLabelAnimationsToAnimationData(
    labels,
    stepIndex,
    coords.cogPointer.y,
    stepAnimationDuration,
    context.fadeDuration,
    context.canvasDims,
    context.labelsData,
    stepAnimationDuration
  );
}

function convertDefaultStepToAnimationData(
  step: DefaultStep,
  stepIndex: number,
  lastConfig: PersonConfig,
  context: AnimationContext
): { animationData: AnimationData[]; newConfig: PersonConfig } {
  const stepAnimationDuration = context.baseAnimationDuration * step.duration;

  const {
    animationData: bodyAnimationData,
    newConfig,
    toCoords
  } = processBodyAnimationsToAnimationData(
    step.stance,
    lastConfig,
    stepAnimationDuration,
    context.canvasDims
  );

  const bodyDuration =
    bodyAnimationData.length > 0
      ? bodyAnimationData[0].durationToEndFrame
      : stepAnimationDuration;

  const labelAnimationData = processLabelAnimationsToAnimationData(
    step.labels,
    stepIndex,
    toCoords.cogPointer.y,
    stepAnimationDuration,
    context.fadeDuration,
    context.canvasDims,
    context.labelsData,
    bodyDuration
  );

  const animationData = [...bodyAnimationData, ...labelAnimationData];

  return { animationData, newConfig };
}

function convertMultiStanceStepToAnimationData(
  step: MultiStanceStep,
  stepIndex: number,
  lastConfig: PersonConfig,
  context: AnimationContext
): { animationData: AnimationData[]; newConfig: PersonConfig } {
  const stepAnimationDuration = context.baseAnimationDuration * step.duration;

  const result: AnimationData[] = [];
  let currentConfig: PersonConfig = lastConfig;

  const labels = step.labels || [];
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
    firstConfig = applyPivotLogic(
      firstConfig,
      lastConfig,
      firstStance.pivot,
      fromCoords,
      context.canvasDims
    );
    const toCoords = calculateShapeTransforms(firstConfig, context.canvasDims);

    const labelAnimationData = processLabelAnimationsToAnimationData(
      labels,
      stepIndex,
      toCoords.cogPointer.y,
      stepAnimationDuration,
      context.fadeDuration,
      context.canvasDims,
      context.labelsData,
      stepAnimationDuration
    );
    result.push(...labelAnimationData);
  }

  const durationPerStance = stepAnimationDuration / step.stances.length;
  for (let i = 0; i < step.stances.length; i++) {
    const stance = step.stances[i];

    const { animationData: bodyAnimationData, newConfig } =
      processBodyAnimationsToAnimationData(
        stance,
        currentConfig,
        durationPerStance,
        context.canvasDims
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

export function generateAndComputeAnimationData(
  cfg: any,
  canvasDims: CanvasDims
): ComputedAnimation {
  const baseAnimationDuration = 1000;
  const fadeDuration = 200;
  const labelsData: LabelData[] = [];
  const animationDataList: AnimationData[] = [];
  let currentTimelineCursor = 0;

  const { initialConfig, steps } = parseForm(cfg);

  if (steps.length > 1) {
    let lastConfig: PersonConfig = initialConfig;

    const context: AnimationContext = {
      baseAnimationDuration,
      fadeDuration,
      canvasDims,
      labelsData
    };

    for (let i = 1; i < steps.length; i++) {
      const parsedStep = steps[i];

      let stepAnimationData: AnimationData[] = [];
      let stepDuration = context.baseAnimationDuration * parsedStep.duration;

      if ('stances' in parsedStep) {
        const result = convertMultiStanceStepToAnimationData(
          parsedStep,
          i - 1,
          lastConfig,
          context
        );
        stepAnimationData = result.animationData;
        lastConfig = result.newConfig;

        const durationPerStance = stepDuration / parsedStep.stances.length;

        const bodyAnimations = stepAnimationData.filter((anim) =>
          anim.targets.some((t) => !t.target.includes('label'))
        );
        const labelAnimations = stepAnimationData.filter((anim) =>
          anim.targets.some((t) => t.target.includes('label'))
        );

        if (bodyAnimations.length > 0) {
          const firstBodyAnim = bodyAnimations[0];
          firstBodyAnim.startFrame += currentTimelineCursor;
          animationDataList.push(firstBodyAnim);
        }

        labelAnimations.forEach((animData) => {
          animData.startFrame += currentTimelineCursor;
          animationDataList.push(animData);
        });

        for (let j = 1; j < bodyAnimations.length; j++) {
          const bodyAnim = bodyAnimations[j];
          bodyAnim.startFrame += currentTimelineCursor + j * durationPerStance;
          animationDataList.push(bodyAnim);
        }
      } else if ('stance' in parsedStep) {
        const result = convertDefaultStepToAnimationData(
          parsedStep,
          i - 1,
          lastConfig,
          context
        );
        stepAnimationData = result.animationData;
        lastConfig = result.newConfig;

        stepAnimationData.forEach((animData) => {
          animData.startFrame += currentTimelineCursor;
          animationDataList.push(animData);
        });
      } else {
        stepAnimationData = convertLabelOnlyStepToAnimationData(
          parsedStep,
          i - 1,
          lastConfig,
          context
        );

        stepAnimationData.forEach((animData) => {
          animData.startFrame += currentTimelineCursor;
          animationDataList.push(animData);
        });
      }

      currentTimelineCursor += stepDuration;
    }
  }

  return { animationData: animationDataList, labelsData };
}
