export function directionToDegrees(direction: number): number {
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
    },
    "horse": {
        leftFoot: { x: -0.75, y: 0 },
        rightFoot: { x: 0.75, y: 0 },
        cog: { x: 0, y: 0 },
        leftFootRotation: 1200,
        rightFootRotation: 1200
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

export function rotatePoint(point: { x: number, y: number }, angle: number): { x: number, y: number } {
    const radians = (-angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const { x, y } = point;
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    return { x: newX, y: newY };
}