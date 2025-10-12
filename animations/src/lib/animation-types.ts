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

export type Stance = {
    type: string;
    direction: number;
    pivot?: 'right' | 'left';
};

