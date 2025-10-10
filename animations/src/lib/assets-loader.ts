// Central loader for all assets
import headSvg from './assets/head.svg?raw';
import rightFootSvg from './assets/right_foot.svg?raw';

import delayedSwordYml from './data/delayed-sword.yml';
import fiveSwordsYml from './data/five-swords.yml';
import longForm2Yml from './data/long-form-2.yml';
import shortForm1Yml from './data/short-form-1.yml';
import testSimpleRotationYml from './data/test-simple-rotation.yml';

// SVG assets
export const svgAssets = {
  'head.svg': headSvg,
  'right_foot.svg': rightFootSvg
};

// YAML data
export const yamlData = {
  'delayed-sword': delayedSwordYml,
  'five-swords': fiveSwordsYml,
  'long-form-2': longForm2Yml,
  'short-form-1': shortForm1Yml,
  'test-simple-rotation': testSimpleRotationYml
};

export function getSvgContent(filename: string): string {
  return svgAssets[filename as keyof typeof svgAssets] || '';
}

export function getYamlData(slug: string): any {
  return yamlData[slug as keyof typeof yamlData];
}