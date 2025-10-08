// Debug script to test label timing logic
import { readFileSync } from 'fs';
import * as yaml from 'yaml';
import { resolve } from 'path';
import { generateAnimationTimeline } from './animations/src/lib/animation.ts';

const yamlPath = './animations/src/long-form-2.yml';
const rawYaml = readFileSync(yamlPath, 'utf8');
const cfg = yaml.parse(rawYaml);

cfg.canvas = { width: 600, height: 600 };
const unitSize = 60;

console.log('Analyzing long-form-2.yml...');
console.log(`Total steps: ${cfg.steps.length}`);

// Find steps around step 10 that have labels
cfg.steps.forEach((step, index) => {
  if (step.labels && index >= 8 && index <= 15) {
    console.log(`Step ${index + 1}:`, {
      stance: step.stance,
      duration: step.duration || 1,
      labelCount: step.labels.length,
      labels: step.labels
    });
  }
});

const { timelineData, labelsData } = generateAnimationTimeline(cfg, cfg.canvas.width, cfg.canvas.height, unitSize);

console.log('\nLabel timing analysis:');
labelsData.forEach((label, index) => {
  if (index < 20) { // Show first 20 labels
    console.log(`Label ${index + 1}: ${label.id} - "${label.text}"`);
  }
});

console.log('\nAnimation timeline data (first 15 steps):');
timelineData.slice(0, 15).forEach((step, index) => {
  const labelAnims = step.anims.filter(anim => anim.targets.includes('label'));
  if (labelAnims.length > 0) {
    console.log(`Step ${index + 1} label animations:`, labelAnims.length);
    labelAnims.forEach(anim => {
      console.log(`  - Target: ${anim.targets}, Delay: ${anim.options.delay}, Opacity: ${JSON.stringify(anim.options.opacity)}`);
    });
  }
});