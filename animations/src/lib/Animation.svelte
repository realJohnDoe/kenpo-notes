<script lang="ts">
  import { animate, createTimeline, type Timeline } from 'animejs';
  import { onMount, onDestroy } from 'svelte';
  import type { AnimationData } from './animation';
  import type { LabelData } from './animation-types';

  type PlayerState = 'playing' | 'paused' | 'finished';

  let {
    animationData = [],
    svgContent,
    labelsData = [],
    playerState = $bindable('paused'),
    playbackSpeed = $bindable(1)
  }: {
    animationData?: AnimationData[];
    svgContent: string;
    labelsData?: LabelData[];
    playerState?: PlayerState;
    playbackSpeed?: number;
  } = $props();

  let mainTl: Timeline;
  let stepStartTimes = $state<number[]>([]);

  const canvasHeight = 600; // Hardcoded, but used for calculations

  let screenWidth = $state(0);
  let screenHeight = $state(0);

  const svgRenderedSize = $derived(Math.min(screenWidth, screenHeight));

  onMount(() => {
    mainTl = createTimeline({
      autoplay: false,
      loop: false,
      onComplete: () => {
        playerState = 'finished';
      }
    });

    // --- Timeline Building Logic ---
    animationData.forEach((animData) => {
      animData.targets.forEach((targetAnim) => {
        mainTl.add(targetAnim.target, targetAnim.cfg, animData.startFrame);
      });
    });

    const allNavigablePoints = new Set<number>();

    // Add all startFrames
    animationData.forEach((ad) => allNavigablePoints.add(ad.startFrame));

    // Add end of last animation
    if (animationData.length > 0) {
      const lastAnim = animationData[animationData.length - 1];
      const endOfLastAnim = lastAnim.startFrame + lastAnim.durationToEndFrame;
      allNavigablePoints.add(endOfLastAnim);
    }

    // Add mainTl.duration
    allNavigablePoints.add(mainTl.duration);

    stepStartTimes = [...allNavigablePoints].sort((a, b) => a - b);

    goToStep(0);
  });

  onDestroy(() => {
    if (mainTl) {
      mainTl.pause();
    }
  });

  // --- Control Functions ---
  const getStepIndexFromTime = (time: number): number => {
    // Handle case where time is exactly at the end of the timeline
    if (time >= mainTl.duration) {
      return stepStartTimes.length - 1; // Return the index of the finished state
    }

    for (let i = 0; i < stepStartTimes.length; i++) {
      if (
        time >= stepStartTimes[i] &&
        (i === stepStartTimes.length - 1 || time < stepStartTimes[i + 1])
      ) {
        return i;
      }
    }
    return 0; // Should not be reached for valid times within the timeline
  };

  export const goToStep = (index: number) => {
    let targetTime: number;
    if (index >= 0 && index < stepStartTimes.length) {
      targetTime = stepStartTimes[index];
    } else if (index === stepStartTimes.length) {
      targetTime = mainTl.duration;
    } else {
      return;
    }

    if (playerState === 'playing') {
      mainTl.pause();
    }

    const proxy = { currentTime: mainTl.currentTime };
    animate(proxy, {
      currentTime: targetTime,
      duration: 300, // 300ms for a smooth transition
      ease: 'easeInOutSine',
      onUpdate: () => {
        mainTl.seek(proxy.currentTime);
        // Explicitly reset completed status after seeking
        if (mainTl.completed) {
          mainTl.completed = false;
        }
      },
      onComplete: () => {
        if (targetTime >= mainTl.duration) {
          playerState = 'finished';
        } else {
          playerState = 'paused';
        }
      }
    });
  };

  export const togglePlayPause = () => {
    if (playerState === 'playing') {
      mainTl.pause();
      playerState = 'paused';
    } else {
      // paused or finished
      if (playerState === 'finished') {
        // If finished, always restart
        mainTl.restart();
      } else {
        // paused
        mainTl.play();
      }
      playerState = 'playing';
    }
    return playerState;
  };

  export const goToPrevStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx - 1;

    // Ensure targetStepIdx is not less than 0
    if (targetStepIdx < 0) {
      targetStepIdx = 0;
    }
    goToStep(targetStepIdx);
  };

  export const goToNextStep = () => {
    if (playerState === 'finished') {
      return;
    }
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx + 1;

    // If targetStepIdx exceeds the last keyframe, go to the finished state
    if (targetStepIdx > stepStartTimes.length) {
      targetStepIdx = stepStartTimes.length; // Index of the finished state
    }

    // ...
    goToStep(targetStepIdx);
    // NEW: If playerState is finished, reset mainTl.completed before seeking
    if (targetStepIdx == stepStartTimes.length - 1) {
      mainTl.completed = false;
    }
  };

  export const setPlaybackSpeed = (speed: number) => {
    playbackSpeed = speed;
    if (mainTl) {
      mainTl.speed = speed;
    }
  };
</script>

<svelte:window bind:innerWidth={screenWidth} bind:innerHeight={screenHeight} />

<div class="relative h-screen w-screen overflow-hidden">
  <div class="h-full w-full">
    {@html svgContent}
  </div>

  {#if labelsData && labelsData.length > 0}
    <div
      class="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[min(100vw,100vh)] w-[min(100vw,100vh)] -translate-x-1/2 -translate-y-1/2"
    >
      {#each labelsData as label}
        <div
          class="label-wrapper"
          style="position: absolute; top: {label.y *
            (svgRenderedSize /
              canvasHeight)}px; left: 0; right: 0; display: flex; justify-content: center; transform: translateY(-50%); pointer-events: none;"
        >
          <div
            id={label.id}
            class="bg-text-muted text-bg-light max-w-full rounded-md px-2 py-1 text-center text-base leading-normal whitespace-pre-wrap lg:px-4 lg:text-3xl"
            style="opacity: 0;"
          >
            {label.text}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
