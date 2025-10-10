import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { generateAndComputeAnimationData } from './animation';

describe('computeAnimationData', () => {
  it('should compute animation data for delayed-sword', () => {
    const file = fs.readFileSync('src/forms/delayed-sword.yml', 'utf8');
    const cfg = yaml.parse(file);

    const { animationData, labelsData } = generateAndComputeAnimationData(cfg, 600, 600, 1);

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

  it('should compute animation data for long-form-2', () => {
    const file = fs.readFileSync('src/forms/long-form-2.yml', 'utf8');
    const cfg = yaml.parse(file);

    const { animationData, labelsData } = generateAndComputeAnimationData(cfg, 600, 600, 60); // Use personUnitSize = 60

    // console.log(JSON.stringify(animationData, null, 2)); // Uncomment to inspect

    expect(animationData.length).toBeGreaterThan(5); // Should have multiple animations

    // Check the first label entry (from YAML step 2)
    const firstLabelAnim = animationData.find(anim => 
      anim.targets.some(target => target.target.includes('label'))
    );
    expect(firstLabelAnim).toBeDefined();
    expect(firstLabelAnim!.durationAfterEndFrame).toBe(2);
  });

  it('should compute animation data for new format', () => {
    const file = fs.readFileSync('src/forms/test-new-format.yml', 'utf8');
    const cfg = yaml.parse(file);

    const { animationData, labelsData } = generateAndComputeAnimationData(cfg, 600, 600, 60);

    console.log(JSON.stringify(animationData, null, 2));

    // Should have:
    // 1. Body animation from attention to right_neutral (step 1)
    // 2. Label animation for step 1 
    // 3. Label-only animation for step 2 (no body movement)
    // 4. Two body animations for multi-stance step 3 (each half duration)  
    // 5. Label animation for step 3
    expect(animationData.length).toBeGreaterThan(0);
    
    // First body animation should be from attention to right_neutral
    expect(animationData[0].startFrame).toBe(0);
    expect(animationData[0].durationToEndFrame).toBe(500); // 0.5 * 1000
    
    // Should have a label-only step that doesn't move the body
    const labelOnlyAnimations = animationData.filter(anim => 
      anim.targets.some(target => target.target.includes('label'))
    );
    expect(labelOnlyAnimations.length).toBeGreaterThan(0);
  });
});
