export const prerender = true;

import { readFileSync, readdirSync } from 'fs';
import * as yaml from 'yaml';
import { error } from '@sveltejs/kit';
import { resolve, parse } from 'path';
import {
  generateGrid,
  generateLabels,
  generateCenterMarker,
  generateVignette
} from '$lib/background-graphics';
import {
  generatePersonShapes,
  generateAnimationTimeline
} from '$lib/animation';

export function entries() {
    const ymlDir = resolve(process.cwd(), '../src');
    const files = readdirSync(ymlDir).filter(file => file.endsWith('.yml'));
    return files.map(file => ({ slug: parse(file).name }));
}

export function load({ params }) {
  try {
    const yamlPath = resolve(process.cwd(), '../src', `${params.slug}.yml`);
    const rawYaml = readFileSync(yamlPath, 'utf8');
    const cfg = yaml.parse(rawYaml);

    // This logic is copied from the old build.ts
    cfg.canvas = { width: 600, height: 600 };
    const unitSize = 60;
    const visualGridSize = 30;

    const gridElems = generateGrid(cfg.canvas.width, cfg.canvas.height, visualGridSize);
    const labelElems = generateLabels(cfg.canvas.width, cfg.canvas.height);
    const centerMarker = generateCenterMarker(cfg.canvas.width, cfg.canvas.height);
    const vignette = generateVignette(cfg.canvas.width, cfg.canvas.height);
    const initialPersonShapes = generatePersonShapes(cfg.steps[0], cfg.canvas.width, cfg.canvas.height, unitSize);

    const { timelineData, labelsData } = generateAnimationTimeline(cfg, cfg.canvas.width, cfg.canvas.height, unitSize);

    const labelElements = labelsData.map(label =>
        `<text id="${label.id}" x="50%" y="${label.y}" text-anchor="middle" opacity="0" font-size="20" fill="#333">${label.text}</text>`
    ).join('');

    const svgContent = `<svg width="${cfg.canvas.width}" height="${cfg.canvas.height}" viewBox="0 0 ${cfg.canvas.width} ${cfg.canvas.height}">${gridElems}${centerMarker}${vignette}${labelElems}${initialPersonShapes}${labelElements}</svg>`;

    return {
      title: cfg.title,
      svgContent,
      timelineData
    };

  } catch (e) {
    console.error(e); // Log the error for debugging
    throw error(404, `Animation '${params.slug}' not found`);
  }
}