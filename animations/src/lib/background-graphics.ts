export function generateGrid(canvasWidth: number, canvasHeight: number, gridSize: number): string {
    const gridColor = "#e0e0e0";
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let gridElems = "";

    // Vertical lines
    for (let i = 0; i <= Math.ceil(centerX / gridSize); i++) {
        // Positive side from center
        let xPos = centerX + (i * gridSize);
        if (xPos < canvasWidth) {
            gridElems += `<line x1="${xPos}" y1="0" x2="${xPos}" y2="${canvasHeight}" stroke="${gridColor}" stroke-width="1" />`;
        }
        // Negative side from center (don't redraw center line)
        if (i > 0) {
            let xNeg = centerX - (i * gridSize);
            if (xNeg > 0) {
                gridElems += `<line x1="${xNeg}" y1="0" x2="${xNeg}" y2="${canvasHeight}" stroke="${gridColor}" stroke-width="1" />`;
            }
        }
    }

    // Horizontal lines
    for (let i = 0; i <= Math.ceil(centerY / gridSize); i++) {
        if (i === 0) {
            gridElems += `<line x1="0" y1="${centerY}" x2="${canvasWidth}" y2="${centerY}" stroke="${gridColor}" stroke-width="1" />`;
            continue;
        }
        let yPos = centerY - (i * gridSize);
        if (yPos > 0) {
            gridElems += `<line x1="0" y1="${yPos}" x2="${canvasWidth}" y2="${yPos}" stroke="${gridColor}" stroke-width="1" />`;
        }
        let yNeg = centerY + (i * gridSize);
        if (yNeg < canvasHeight) {
            gridElems += `<line x1="0" y1="${yNeg}" x2="${canvasWidth}" y2="${yNeg}" stroke="${gridColor}" stroke-width="1" />`;
        }
    }
    return gridElems;
}

export function generateLabels(canvasWidth: number, canvasHeight: number): string {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let labelElems = "";
    labelElems += `<text x="${centerX}" y="20" text-anchor="middle" class="txt">1200 ⬆️</text>`;
    labelElems += `<text x="${canvasWidth - 20}" y="${centerY}" text-anchor="end" dominant-baseline="middle" class="txt">300 ➡️</text>`;
    labelElems += `<text x="20" y="${centerY}" text-anchor="start" dominant-baseline="middle" class="txt">⬅️ 900</text>`;
    labelElems += `<text x="${centerX}" y="${canvasHeight - 20}" text-anchor="middle" dominant-baseline="hanging" class="txt">600 ⬇️</text>`;
    return labelElems;
}

export function generateCenterMarker(canvasWidth: number, canvasHeight: number): string {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    return `<circle cx="${centerX}" cy="${centerY}" r="5" fill="gray" />`;
}

export function generateVignette(canvasWidth: number, canvasHeight: number): string {
    return `
        <defs>
            <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="50%">
                <stop offset="30%" stop-color="white" stop-opacity="0" />
                <stop offset="100%" stop-color="white" stop-opacity="1" />
            </radialGradient>
        </defs>
        <rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" fill="url(#vignetteGradient)" />
    `;
}