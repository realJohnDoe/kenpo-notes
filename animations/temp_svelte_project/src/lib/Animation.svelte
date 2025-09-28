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

  // --- Resize and Scale Logic ---
  let viewportWidth: number = 0;
  let viewportHeight: number = 0;
  let scale: number = 1;
  const intrinsicCanvasSize = 600;

  function calculateScale() {
    if (viewportWidth > 0 && viewportHeight > 0) {
      scale = Math.min(viewportWidth / intrinsicCanvasSize, viewportHeight / intrinsicCanvasSize);
    } else {
      scale = 1;
    }
  }

  function handleResize() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    calculateScale();
  }

  // --- Lifecycle ---
  onMount(() => {
    labelEl = document.getElementById('stepLabel');
    
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    calculateScale();
    window.addEventListener('resize', handleResize);

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
    timelineData.forEach((step: any) => {
      stepStartTimes.push(currentTimelineCursor);
      let stepDuration = 1000;
      if (step.anims && step.anims.length > 0) {
        const firstAnimation = step.anims[0];
        stepDuration = firstAnimation.duration;
        mainTl.add(firstAnimation, currentTimelineCursor);
        for (let i = 1; i < step.anims.length; i++) {
          mainTl.add(step.anims[i], currentTimelineCursor);
        }
      }
      if (step.label && step.label.texts && step.label.texts.length > 0) {
        const timePerLabel = stepDuration / step.label.texts.length;
        const fadeDuration = 200;
        mainTl.add({
          targets: labelEl,
          y: step.label.y,
          duration: 1,
          begin: () => { if (labelEl && step.label) labelEl.textContent = step.label.texts[0]; }
        }, currentTimelineCursor);
        mainTl.add({
          targets: labelEl,
          opacity: 1,
          duration: fadeDuration,
          easing: 'linear'
        }, currentTimelineCursor);
        for (let i = 1; i < step.label.texts.length; i++) {
          const labelText = step.label.texts[i];
          const prevLabelStartTime = currentTimelineCursor + (i * timePerLabel);
          mainTl.add({
            targets: labelEl,
            opacity: 0,
            duration: fadeDuration,
            easing: 'linear',
            complete: () => { if (labelEl) labelEl.textContent = labelText; }
          }, prevLabelStartTime - fadeDuration);
          mainTl.add({
            targets: labelEl,
            opacity: 1,
            duration: fadeDuration,
            easing: 'linear'
          }, prevLabelStartTime);
        }
      }
      currentTimelineCursor += stepDuration;
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
    console.log('getStepIndexFromTime called with time:', time);
    // Handle case where time is exactly at the end of the timeline
    if (time >= mainTl.duration) {
      console.log('getStepIndexFromTime: time >= mainTl.duration, returning:', timelineData.length - 1);
      return timelineData.length - 1; // Return the index of the last step
    }

    for (let i = 0; i < stepStartTimes.length - 1; i++) {
      if (time >= stepStartTimes[i] && time < stepStartTimes[i+1]) {
        console.log('getStepIndexFromTime: time in range, returning:', i);
        return i;
      }
    }
    console.log('getStepIndexFromTime: returning 0 (default)');
    return 0; // Should not be reached for valid times within the timeline
  };

  export const goToStep = (index: number) => {
    console.log('goToStep called with index:', index);
    let targetTime: number;
    if (index >= 0 && index < stepStartTimes.length - 1) {
      targetTime = stepStartTimes[index];
    } else if (index === stepStartTimes.length - 1) {
      targetTime = mainTl.duration;
    } else {
      return;
    }

    if (playerState === 'playing') {
        mainTl.pause();
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
        }
    });

    if (index > 0) {
      const step = timelineData[index - 1];
      if (labelEl && step && step.label && step.label.texts) {
        labelEl.textContent = step.label.texts[step.label.texts.length - 1];
        // Ensure opacity is reset so timeline animations can fade it in
        anime.set(labelEl, { opacity: 0 }); // Changed to 0
      } else if (labelEl) {
        anime.set(labelEl, { opacity: 0 });
      }
    } else if (labelEl) { // index is 0
      anime.set(labelEl, { opacity: 0 });
    }
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
    console.log('goToPrevStep: currentIdx:', currentIdx, 'mainTl.currentTime:', mainTl.currentTime, 'timelineData.length:', timelineData.length);

    if (playerState === 'finished') {
      targetStepIdx = timelineData.length - 2; // Go to the second to last step
    } else {
      targetStepIdx = currentIdx - 1;
    }
    
    // Ensure targetStepIdx is not less than 0
    if (targetStepIdx < 0) {
      targetStepIdx = 0;
    }
    console.log('goToPrevStep: calling goToStep with targetStepIdx:', targetStepIdx);
    goToStep(targetStepIdx);
  };

  export const goToNextStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx + 1;
    console.log('goToNextStep: currentIdx:', currentIdx, 'mainTl.currentTime:', mainTl.currentTime, 'timelineData.length:', timelineData.length);

    // Ensure targetStepIdx does not exceed the last step
    if (targetStepIdx >= timelineData.length) {
      targetStepIdx = timelineData.length - 1;
    }
    console.log('goToNextStep: calling goToStep with targetStepIdx:', targetStepIdx);
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
