<script lang="ts">
  import anime from 'animejs';
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let timelineData: any[]; // Using any[] for simplicity as structure is complex
  export let svgContent: string;
  export let onComplete: () => void = () => {};

  // State
  let mainTl: any; // anime.timeline instance
  let stepStartTimes: number[] = [];
  let labelEl: HTMLElement | null;
  let playerState: 'playing' | 'paused' | 'finished' = 'paused';

  $: totalSteps = timelineData.length + 1; // Compute totalSteps internally

  // --- Resize and Scale Logic ---
  let viewportWidth: number = 0;
  let viewportHeight: number = 0;
  const intrinsicCanvasSize = 600;

  $: scale = (viewportWidth > 0 && viewportHeight > 0)
    ? Math.min(viewportWidth / intrinsicCanvasSize, viewportHeight / intrinsicCanvasSize)
    : 1;

  onMount(() => {
    labelEl = document.getElementById('stepLabel');
    
    if (labelEl) {
      anime.set(labelEl, { opacity: 0, y: -9999 }); // Hide and move off-screen initially
    }
    
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
    });

    mainTl = anime.timeline({ 
      autoplay: false, 
      loop: false,
      complete: () => {
        playerState = 'finished';
        onComplete();
      }
    });

    // --- Timeline Building Logic ---
    let currentTimelineCursor = 0;
    const fadeDuration = 200; // Define fadeDuration once
    timelineData.forEach((step: any) => {
      stepStartTimes.push(currentTimelineCursor);
      let stepDuration = 0; // Initialize stepDuration to 0

      if (step.anims && step.anims.length > 0) {
        // All animations in a step now have the same duration
        stepDuration = step.anims[0].duration;
        step.anims.forEach((anim: any) => {
          mainTl.add(anim, currentTimelineCursor);
        });
      }

      if (step.label && step.label.texts && step.label.texts.length > 0) {
        const labelText = step.label.texts[0]; // Only one label per step now
        const labelDuration = step.label.duration; // Use the duration from the label object

        // Add label animation
        mainTl.add({
          targets: labelEl,
          y: step.label.y,
          duration: 1, // Instantaneous position change
          begin: () => { if (labelEl) labelEl.textContent = labelText; }
        }, currentTimelineCursor);
        mainTl.add({
          targets: labelEl,
          opacity: 1,
          duration: fadeDuration,
          easing: 'linear'
        }, currentTimelineCursor);
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
  });

  // --- Control Functions ---
  const getStepIndexFromTime = (time: number): number => {
    // Handle case where time is exactly at the end of the timeline
    if (time >= mainTl.duration) {
      return totalSteps - 1; // Return the index of the last step
    }

    for (let i = 0; i < stepStartTimes.length - 1; i++) {
      if (time >= stepStartTimes[i] && time < stepStartTimes[i+1]) {
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

    // Clear label immediately
    if (labelEl) {
      labelEl.textContent = '';
      anime.set(labelEl, { opacity: 0 });
    }

    const proxy = { currentTime: mainTl.currentTime };
    anime({
        targets: proxy,
        currentTime: targetTime,
        duration: 300, // 300ms for a smooth transition
        easing: 'easeInOutSine',
        update: () => {
            mainTl.seek(proxy.currentTime);
            // Explicitly reset completed status after seeking
            if (mainTl.completed) {
                mainTl.completed = false;
            }
        },
        complete: () => {
            if (targetTime >= mainTl.duration) {
                playerState = 'finished';
            } else {
                playerState = 'paused';
            }
            // After seeking, if the target step has a label, display it.
            // The timeline's label animation should handle the fade in/out.
            if (index < timelineData.length) { // Ensure index is within bounds of timelineData
                const step = timelineData[index];
                if (labelEl && step && step.label && step.label.texts && step.label.texts.length > 0) {
                    labelEl.textContent = step.label.texts[0];
                    // Ensure opacity is 1 when stepping to a labeled frame
                    anime.set(labelEl, { opacity: 1 });
                }
            }
        }
    });
  };

  export const togglePlayPause = () => {
    if (playerState === 'playing') {
      mainTl.pause();
      playerState = 'paused';
    } else { // paused or finished
      if (mainTl.completed) {
        mainTl.restart();
        // Explicitly reset label state when restarting from a completed animation
        if (labelEl) {
          labelEl.textContent = '';
          anime.set(labelEl, { opacity: 0 });
        }
      } else {
        mainTl.play();
      }
      playerState = 'playing';
    }
    return playerState;
  };

  export const goToPrevStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx;

    if (playerState === 'finished') {
      targetStepIdx = totalSteps - 2; // Go to the second to last step
    } else {
      targetStepIdx = currentIdx - 1;
    }
    
    // Ensure targetStepIdx is not less than 0
    if (targetStepIdx < 0) {
      targetStepIdx = 0;
    }
    goToStep(targetStepIdx);
  };

  export const goToNextStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx + 1;

    // Allow going one step beyond the last animation to represent the 'finished' state
    if (targetStepIdx > totalSteps) { // Changed condition
      targetStepIdx = totalSteps; // Changed to totalSteps
    }
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
