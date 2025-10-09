import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { generateAnimationTimeline } from './animation';

// The user-defined data structure.
type AnimationData = {
  startFrame: number;
  durationToEndFrame: number;
  durationAfterEndFrame: number;
  targets: {
    target: string;
    cfg: any;
  }[];
};

function computeAnimationData(timelineData: any[]): AnimationData[] {
  const animationDataList: AnimationData[] = [];
  let currentTimelineCursor = 0;

  for (const step of timelineData) {
    let stepDuration = 0;
    if (step.anims && step.anims.length > 0) {
      // All animations in a step now have the same duration, except for labels
      const bodyPartAnims = step.anims.filter((anim: any) => anim.targets.startsWith('#') && !anim.targets.includes('label'));
      if (bodyPartAnims.length > 0) {
        stepDuration = bodyPartAnims[0].options.duration;
      }
    }

    const targets = step.anims.map((anim: any) => ({
      target: anim.targets,
      cfg: anim.options,
    }));

    let durationAfterEndFrame = 0;
    const labelAnims = step.anims.filter((anim: any) => anim.targets.includes('label'));
    if (labelAnims.length > 0) {
        const lastOpacityKeyframe = labelAnims[0].options.opacity[labelAnims[0].options.opacity.length - 1];
        if (lastOpacityKeyframe.to === 0) {
            durationAfterEndFrame = lastOpacityKeyframe.duration;
        }
    }

    animationDataList.push({
      startFrame: currentTimelineCursor,
      durationToEndFrame: stepDuration,
      durationAfterEndFrame: durationAfterEndFrame,
      targets: targets,
    });

    currentTimelineCursor += stepDuration;
  }

  return animationDataList;
}

describe('computeAnimationData', () => {
  it('should compute animation data for delayed-sword', () => {
    const file = fs.readFileSync('src/delayed-sword.yml', 'utf8');
    const cfg = yaml.parse(file);

    const { timelineData } = generateAnimationTimeline(cfg, 600, 600, 1);
    const animationData = computeAnimationData(timelineData);

    console.log(JSON.stringify(animationData, null, 2));

    expect(animationData).toHaveLength(3);

    expect(animationData[0].startFrame).toBe(0);
    expect(animationData[0].durationToEndFrame).toBe(1000);
    expect(animationData[0].durationAfterEndFrame).toBe(1);
    expect(animationData[0].targets).toHaveLength(4);

    expect(animationData[1].startFrame).toBe(1000);
    expect(animationData[1].durationToEndFrame).toBe(500);
    expect(animationData[1].durationAfterEndFrame).toBe(0);
    expect(animationData[1].targets).toHaveLength(3);

    expect(animationData[2].startFrame).toBe(1500);
    expect(animationData[2].durationToEndFrame).toBe(1500);
    expect(animationData[2].durationAfterEndFrame).toBe(1);
    expect(animationData[2].targets).toHaveLength(5);
  });
});