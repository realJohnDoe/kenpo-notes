<script lang="ts">
  import { animate, createTimeline, type AnimeTimelineInstance } from 'animejs';
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let timelineData: any[]; // Using any[] for simplicity as structure is complex
  export let svgContent: string;
  export let onComplete: () => void = () => {};
  export let speed: number = 1; // New prop

  // State
  let mainTl: AnimeTimelineInstance; // anime.timeline instance
  let stepStartTimes: number[] = [];
  export let playerState: 'playing' | 'paused' | 'finished' = 'paused';

  // We need 2 steps more: One for because there is one more still frames than animation steps and
  // one more because we add a step in the end as the finished state.
  $: totalSteps = timelineData.length + 2; // Compute totalSteps internally

  // --- Resize and Scale Logic ---
  let viewportWidth: number = 0;
  let viewportHeight: number = 0;
  const intrinsicCanvasSize = 600;

  $: scale = (viewportWidth > 0 && viewportHeight > 0)
    ? Math.min(viewportWidth / intrinsicCanvasSize, viewportHeight / intrinsicCanvasSize)
    : 1;

  function handleResizeEvent() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
  }

  onMount(() => {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    window.addEventListener('resize', handleResizeEvent);

        mainTl = createTimeline({
          autoplay: false,
          loop: false,
          onComplete: () => {
            console.log('Timeline complete: setting playerState to finished');
            playerState = 'finished';
            onComplete();
          }
        });
        console.log(`Animation: Initializing mainTl. Setting playbackRate to ${speed}`);
        mainTl.playbackRate = speed;
    
        // --- Timeline Building Logic ---
        console.log("TimelineData received:", JSON.parse(JSON.stringify(timelineData)));

        let currentTimelineCursor = 0;
        timelineData.forEach((step: any) => {
            // 1. Add the delay for the current step, from the data generated in animation.ts
            currentTimelineCursor += step.delay || 0;

            stepStartTimes.push(currentTimelineCursor);
            let stepDuration = 0;

            if (step.anims && step.anims.length > 0) {
                // 2. Add all animations at the new cursor position
                step.anims.forEach((anim: any) => {
                    if (!document.querySelector(anim.targets)) {
                        console.warn(`Animation target not found in DOM: "${anim.targets}"`);
                    }
                    mainTl.add(anim, currentTimelineCursor);
                });
                // 3. Calculate the duration of this step (the longest animation)
                stepDuration = Math.max(0, ...step.anims.map(a => a.duration || 0));
            }

            // 4. Advance the cursor by the duration of the step
            currentTimelineCursor += stepDuration;
        });
        stepStartTimes.push(currentTimelineCursor);

        console.log("Timeline object after adding animations:", mainTl);

        goToStep(0);
      });
    
      onDestroy(() => {
        if (mainTl) {
          mainTl.pause();
        }
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleResizeEvent);
        }
      });
    
  // --- Control Functions ---
  const getStepIndexFromTime = (time: number): number => {
    // Handle case where time is exactly at the end of the timeline
    if (time >= mainTl.duration) {
      return totalSteps - 1; // Return the index of the last step
    }

    for (let i = 0; i < stepStartTimes.length; i++) {
      if (time >= stepStartTimes[i] && (i === stepStartTimes.length - 1 || time < stepStartTimes[i+1])) {
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
        ease: 'inOutSine',
        onUpdate: () => {
            mainTl.seek(proxy.currentTime);
            // Explicitly reset completed status after seeking
            if (mainTl.completed) {
                console.log(`goToStep update: mainTl.completed was true, setting to false.`);
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
            console.log(`goToStep complete. playerState changed from '${oldState}' to '${playerState}'`);
        }
    });
  };

  export const togglePlayPause = () => {
    console.log(`togglePlayPause called. Current state: ${playerState}, timeline completed: ${mainTl.completed}`);
    if (playerState === 'playing') {
      mainTl.pause();
      playerState = 'paused';
    } else { // paused or finished
      if (mainTl.completed) {
        console.log('Timeline was complete, restarting.');
        mainTl.restart();
      } else {
        mainTl.play();
      }
      console.log(`togglePlayPause: Animation started/restarted with playbackRate: ${mainTl.playbackRate}`);
      playerState = 'playing';
    }
    console.log(`togglePlayPause finished. New state: ${playerState}`);
    return playerState;
  };

  export const goToPrevStep = () => {
    console.log(`goToPrevStep called. Current state: ${playerState}, currentTime: ${mainTl.currentTime}`);
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx - 1;
    
    // Ensure targetStepIdx is not less than 0
    if (targetStepIdx < 0) {
      targetStepIdx = 0;
    }
    console.log(`goToPrevStep currentIdx: ${currentIdx}, targetStepIdx: ${targetStepIdx}`);
    goToStep(targetStepIdx);
  };

  export const goToNextStep = () => {
    console.log(`goToNextStep called. Current state: ${playerState}, currentTime: ${mainTl.currentTime}`);
    if (playerState === 'finished') {
      console.log('goToNextStep: player is finished, doing nothing.');
      return;
    }
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx + 1;

    console.log(`goToNextStep currentIdx: ${currentIdx}, targetStepIdx: ${targetStepIdx}`);
    goToStep(targetStepIdx);
  };
</script>

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

<div class="animation-container">
  <div class="scaled-svg-wrapper" style="transform: scale({scale}); transform-origin: center center;">
    {@html svgContent}
  </div>
</div>
