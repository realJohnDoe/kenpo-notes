import fs from 'fs';
import path from 'path';

export const prerender = true;

export function load() {
    const svgPath = path.resolve('src', 'head.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    return {
        svgContent
    };
}