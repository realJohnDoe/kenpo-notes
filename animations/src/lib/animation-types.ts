export type CanvasDims = {
    width: number;
    height: number;
    feetDistance: number;
};

export const DEFAULT_CANVAS_DIMS: CanvasDims = {
    width: 600,
    height: 600,
    feetDistance: 60
};

export type PersonConfig = {
    stance: string;
    direction: number;
    offsetX?: number;
    offsetY?: number;
    pivot?: 'right' | 'left';
};

export type BodyPartPosition = {
    x: number;
    y: number;
    rotate: number;
};

export type Point = {
    cx: number;
    cy: number;
};

export type ShapeTransforms = {
    leftFootGroup: BodyPartPosition;
    rightFootGroup: BodyPartPosition;
    cog: Point;
    cogPointer: BodyPartPosition;
};

export type LabelData = {
    id: string;
    text: string;
    y: number;
};

export type AnimationData = {
    startFrame: number;
    durationToEndFrame: number;
    durationAfterEndFrame: number;
    targets: {
        target: string;
        cfg: any;
    }[];
};

export type BodyAnimationResult = {
    animationData: AnimationData[];
    newConfig: PersonConfig;
    toCoords: ShapeTransforms;
};

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

export type BodyPartMovementAnimation = {
    targets: string;
    options: {
        translateX: number[];
        translateY: number[];
        rotate: string;
        duration: number;
        ease: string;
    };
};

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

export type StepAnimation = BodyPartMovementAnimation | LabelAnimation;

export function isBodyPartAnim(anim: StepAnimation): anim is BodyPartMovementAnimation {
    return 'duration' in anim.options;
}

export function isLabelAnim(anim: StepAnimation): anim is LabelAnimation {
    return 'opacity' in anim.options;
}

export type Stance = {
    type: string;
    direction: number;
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
