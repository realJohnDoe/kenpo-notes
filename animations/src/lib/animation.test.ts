import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { generateAnimationTimeline, computeAnimationData } from './animation';

describe('computeAnimationData', () => {
  it('should compute animation data for delayed-sword', () => {
    const file = fs.readFileSync('src/delayed-sword.yml', 'utf8');
    const cfg = yaml.parse(file);

    const { timelineData } = generateAnimationTimeline(cfg, 600, 600, 1);
    const animationData = computeAnimationData(timelineData);

    console.log(JSON.stringify(animationData, null, 2));

    expect(animationData).toHaveLength(6);

    // Step 1: Body: Right Neutral
    expect(animationData[0].startFrame).toBe(0);
    expect(animationData[0].durationToEndFrame).toBe(1000);
    expect(animationData[0].durationAfterEndFrame).toBe(0);
    expect(animationData[0].targets).toHaveLength(3);

    // Step 1: Label: Right Inward Block
    expect(animationData[1].startFrame).toBe(0);
    expect(animationData[1].durationToEndFrame).toBe(1000);
    expect(animationData[1].durationAfterEndFrame).toBe(2);
    expect(animationData[1].targets).toHaveLength(1);

    // Step 2: Body: Cat
    expect(animationData[2].startFrame).toBe(1000);
    expect(animationData[2].durationToEndFrame).toBe(500);
    expect(animationData[2].durationAfterEndFrame).toBe(0);
    expect(animationData[2].targets).toHaveLength(3);

    // Step 3: Body: Right Neutral
    expect(animationData[3].startFrame).toBe(1500);
    expect(animationData[3].durationToEndFrame).toBe(1500);
    expect(animationData[3].durationAfterEndFrame).toBe(0);
    expect(animationData[3].targets).toHaveLength(3);

    // Step 3: Label 1: Right Front Kick
    expect(animationData[4].startFrame).toBe(1500);
    expect(animationData[4].durationToEndFrame).toBe(750);
    expect(animationData[4].durationAfterEndFrame).toBe(2);
    expect(animationData[4].targets).toHaveLength(1);

    // Step 3: Label 2: Right Outward Handsword
    expect(animationData[5].startFrame).toBe(2250);
    expect(animationData[5].durationToEndFrame).toBe(750);
    expect(animationData[5].durationAfterEndFrame).toBe(2);
    expect(animationData[5].targets).toHaveLength(1);
  });
});
