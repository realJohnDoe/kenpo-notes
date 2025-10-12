import { stances, rotatePoint, directionToDegrees } from './kenpo-geometry';
import type {
    PersonConfig,
    CanvasDims,
    BodyPartPosition,
    AnimationData,
    Stance
} from './animation-types';

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

export function calculateShapeTransforms(personConfig: PersonConfig, canvasDims: CanvasDims): ShapeTransforms {
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

    const toSvgX = (mathX: number) => (mathX + offsetX) * canvasDims.feetDistance + centerX;
    const toSvgY = (mathY: number) => centerY - ((mathY + offsetY) * canvasDims.feetDistance);

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

export function applyPivotLogic(nextConfig: PersonConfig, lastConfig: PersonConfig, pivot: 'right' | 'left' | undefined, fromCoords: ShapeTransforms, canvasDims: CanvasDims) {
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

        const toOffsetX = (fromPivotCoords.cx - centerX) / canvasDims.feetDistance - toPivotMath.x;
        const toOffsetY = (centerY - fromPivotCoords.cy) / canvasDims.feetDistance - toPivotMath.y;

        nextConfig.offsetX = toOffsetX;
        nextConfig.offsetY = toOffsetY;
    }
    return nextConfig;
}

export function generatePersonShapes(personConfig: PersonConfig, canvasDims: CanvasDims, rightFootSvgContent: string, headSvgContent: string): string {
    const transforms = calculateShapeTransforms(personConfig, canvasDims);

    let shapesSvg = "";

    const svgSizeInPixels = 100
    const scaleFactor = 0.4;

    const svgOffsetX = - svgSizeInPixels / 2;
    const svgOffsetY = -svgSizeInPixels / 2;

    shapesSvg += `<g id="leftFootGroup" transform="translate(${transforms.leftFootGroup.x}, ${transforms.leftFootGroup.y}) rotate(${transforms.leftFootGroup.rotate})">
        <g transform="scale(${scaleFactor}, ${scaleFactor}) scale(-1, 1) translate(${svgOffsetX}, ${svgOffsetY})">
            ${rightFootSvgContent}
        </g>
    </g>`;

    shapesSvg += `<g id="rightFootGroup" transform="translate(${transforms.rightFootGroup.x}, ${transforms.rightFootGroup.y}) rotate(${transforms.rightFootGroup.rotate})">
        <g transform="scale(${scaleFactor}, ${scaleFactor}) translate(${svgOffsetX}, ${svgOffsetY})">
            ${rightFootSvgContent}
        </g>
    </g>`;

    const headScaleFactor = 0.6;

    shapesSvg += `<g id="cog" transform="translate(${transforms.cog.cx}, ${transforms.cog.cy}) rotate(${transforms.cogPointer.rotate})">
        <g transform="scale(${headScaleFactor}, ${headScaleFactor}) translate(${svgOffsetX}, ${svgOffsetY})">
            ${headSvgContent}
        </g>
    </g>`;

    return shapesSvg;
}

export function createBodyPartMovementAnim(targetId: string, fromPos: BodyPartPosition, toPos: BodyPartPosition, duration: number): BodyPartMovementAnimation {
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

function createBodyPartAnimations(fromCoords: ShapeTransforms, toCoords: ShapeTransforms, stepAnimationDuration: number): BodyPartMovementAnimation[] {
    const stepAnims: BodyPartMovementAnimation[] = [];
    stepAnims.push(createBodyPartMovementAnim('#leftFootGroup', fromCoords.leftFootGroup, toCoords.leftFootGroup, stepAnimationDuration));
    stepAnims.push(createBodyPartMovementAnim('#rightFootGroup', fromCoords.rightFootGroup, toCoords.rightFootGroup, stepAnimationDuration));
    stepAnims.push(createBodyPartMovementAnim('#cog', fromCoords.cogPointer, toCoords.cogPointer, stepAnimationDuration));
    return stepAnims;
}

export type BodyAnimationResult = {
    animationData: AnimationData[];
    newConfig: PersonConfig;
    toCoords: ShapeTransforms;
};


export function processBodyAnimationsToAnimationData(
    stance: Stance,
    lastConfig: PersonConfig,
    stepAnimationDuration: number,
    canvasDims: CanvasDims
): BodyAnimationResult {
    const fromCoords = calculateShapeTransforms(lastConfig, canvasDims);

    let nextConfig: PersonConfig = {
        stance: stance.type,
        direction: stance.direction,
        pivot: stance.pivot,
        offsetX: lastConfig.offsetX,
        offsetY: lastConfig.offsetY
    };
    nextConfig = applyPivotLogic(nextConfig, lastConfig, stance.pivot, fromCoords, canvasDims);

    const toCoords = calculateShapeTransforms(nextConfig, canvasDims);

    const bodyPartAnims = createBodyPartAnimations(fromCoords, toCoords, stepAnimationDuration);

    const result: AnimationData[] = [];
    if (bodyPartAnims.length > 0) {
        const duration = bodyPartAnims[0].options.duration;
        result.push({
            startFrame: 0,
            durationToEndFrame: duration,
            durationAfterEndFrame: 0,
            targets: bodyPartAnims.map((anim) => ({ target: anim.targets, cfg: anim.options }))
        });
    }

    return { animationData: result, newConfig: nextConfig, toCoords };
}