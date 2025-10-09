<script lang="ts">
  import { animate, createTimeline } from 'animejs';
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let timelineData: any[]; // Using any[] for simplicity as structure is complex
  export let svgContent: string;
  export let onComplete: () => void = () => {};

  // State
  let mainTl: any; // anime.timeline instance
  let stepStartTimes: number[] = [];
  export let playerState: 'playing' | 'paused' | 'finished' = 'paused';
  export let playbackSpeed: number = 1; // Default speed is 1x

  // We need 2 steps more: One for because there is one more still frames than animation steps and
  // one more because we add a step in the end as the finished state.
  $: totalSteps = timelineData.length + 2; // Compute totalSteps internally

  // --- Resize and Scale Logic ---
  let viewportWidth: number = 0;
  let viewportHeight: number = 0;
  const intrinsicCanvasSize = 600;

  $: scale =
    viewportWidth > 0 && viewportHeight > 0
      ? Math.min(
          viewportWidth / intrinsicCanvasSize,
          viewportHeight / intrinsicCanvasSize
        )
      : 1;

  onMount(() => {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
    });

    mainTl = createTimeline({
      autoplay: false,
      loop: false,
      onComplete: () => {
        console.log('Timeline complete: setting playerState to finished');
        playerState = 'finished';
        onComplete();
      }
    });

    // --- Timeline Building Logic ---
    let currentTimelineCursor = 0;
    timelineData.forEach((step: any) => {
      stepStartTimes.push(currentTimelineCursor);
      let stepDuration = 0; // Initialize stepDuration to 0

      if (step.anims && step.anims.length > 0) {
        // All animations in a step now have the same duration
        stepDuration = step.anims[0].options
          ? step.anims[0].options.duration
          : step.anims[0].duration;
        step.anims.forEach((anim: any) => {
          // v4 API: targets as first param, options as second param
          mainTl.add(anim.targets, anim.options, currentTimelineCursor);
        });
      }
      currentTimelineCursor += stepDuration; // Use the actual stepDuration
    });
    stepStartTimes.push(currentTimelineCursor);
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
      return totalSteps - 1; // Return the index of the last step
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
    console.log(`goToStep called with index: ${index}`);
    let targetTime: number;
    if (index >= 0 && index < stepStartTimes.length) {
      targetTime = stepStartTimes[index];
    } else if (index === stepStartTimes.length) {
      targetTime = mainTl.duration;
    } else {
      console.log('goToStep returned early: invalid index');
      return;
    }
    console.log(`goToStep targetTime: ${targetTime}`);

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
          console.log(
            `goToStep update: mainTl.completed was true, setting to false.`
          );
          mainTl.completed = false;
        }
      },
      onComplete: () => {
        const oldState = playerState;
        if (targetTime >= mainTl.duration) {
          playerState = 'finished';
        } else {
          playerState = 'paused';
        }
        console.log(
          `goToStep complete. playerState changed from '${oldState}' to '${playerState}'`
        );
      }
    });
  };

  export const togglePlayPause = () => {
    console.log(
      `togglePlayPause called. Current state: ${playerState}, timeline completed: ${mainTl.completed}`
    );
    if (playerState === 'playing') {
      mainTl.pause();
      playerState = 'paused';
    } else {
      // paused or finished
      if (mainTl.completed) {
        console.log('Timeline was complete, restarting.');
        mainTl.restart();
      } else {
        mainTl.play();
      }
      playerState = 'playing';
    }
    console.log(`togglePlayPause finished. New state: ${playerState}`);
    return playerState;
  };

  export const goToPrevStep = () => {
    console.log(
      `goToPrevStep called. Current state: ${playerState}, currentTime: ${mainTl.currentTime}`
    );
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx - 1;

    // Ensure targetStepIdx is not less than 0
    if (targetStepIdx < 0) {
      targetStepIdx = 0;
    }
    console.log(
      `goToPrevStep currentIdx: ${currentIdx}, targetStepIdx: ${targetStepIdx}`
    );
    goToStep(targetStepIdx);
  };

  export const goToNextStep = () => {
    console.log(
      `goToNextStep called. Current state: ${playerState}, currentTime: ${mainTl.currentTime}`
    );
    if (playerState === 'finished') {
      console.log('goToNextStep: player is finished, doing nothing.');
      return;
    }
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx + 1;

    console.log(
      `goToNextStep currentIdx: ${currentIdx}, targetStepIdx: ${targetStepIdx}`
    );
    goToStep(targetStepIdx);
  };

  export const setPlaybackSpeed = (speed: number) => {
    console.log(`setPlaybackSpeed called with speed: ${speed}`);
    playbackSpeed = speed;
    if (mainTl) {
      // Store current progress as ratio
      const currentProgress = mainTl.currentTime / mainTl.duration;

      // Update the timeline's speed
      mainTl.speed = speed;

      console.log(`Playback speed changed to ${speed}x`);
    }
  };
</script>

<div class="animation-container">
  <div
    class="scaled-svg-wrapper"
    style="transform: scale({scale}); transform-origin: center center;"
  >
    {@html svgContent}
  </div>
</div>

<style>
  .animation-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    overflow: hidden; /* Hide any overflow from scaling */
  }
  .scaled-svg-wrapper {
    /* The SVG itself has viewBox, so it will scale within this wrapper */
    /* We apply the transform here */
  }
</style>
