<script lang="ts">
  import anime from 'animejs';
  import { onMount, onDestroy } from 'svelte';
  import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-svelte';

  // Props
  export let timelineData: any[]; // Using any[] for simplicity as structure is complex
  export let svgContent: string;

  // State
  let mainTl: any; // anime.timeline instance
  let stepStartTimes: number[] = [];
  let labelEl: HTMLElement | null;
  let playerState: 'playing' | 'paused' | 'finished' = 'paused';

  // --- Resize and Scale Logic (unchanged) ---
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
      }
    });

    // --- Timeline Building Logic (unchanged) ---
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
    for (let i = 0; i < stepStartTimes.length - 1; i++) {
      if (time >= stepStartTimes[i] && time < stepStartTimes[i+1]) {
        return i;
      }
    }
    if (time >= stepStartTimes[stepStartTimes.length - 1]) {
      return stepStartTimes.length - 2;
    }
    return 0;
  };

  const goToStep = (index: number) => {
    let targetTime: number;
    if (index >= 0 && index < stepStartTimes.length - 1) {
      targetTime = stepStartTimes[index];
    } else if (index === stepStartTimes.length - 1) {
      targetTime = mainTl.duration;
    } else {
      return;
    }

    // Pause the timeline if it's playing before we seek.
    if (playerState === 'playing') {
        mainTl.pause();
    }

    // Directly seek and update the state.
    mainTl.seek(targetTime);
    if (targetTime >= mainTl.duration) {
        playerState = 'finished';
    } else {
        playerState = 'paused';
    }

    // Logic to handle label visibility when stepping
    if (index > 0) {
      const step = timelineData[index - 1];
      if (labelEl && step && step.label && step.label.texts) {
        labelEl.textContent = step.label.texts[step.label.texts.length - 1];
        anime.set(labelEl, { opacity: 1 });
      } else if (labelEl) {
        anime.set(labelEl, { opacity: 0 });
      }
    } else if (labelEl) { // index is 0
      anime.set(labelEl, { opacity: 0 });
    }
  };

  const togglePlayPause = () => {
    if (playerState === 'paused') {
      mainTl.play();
      playerState = 'playing';
    } else if (playerState === 'playing') {
      mainTl.pause();
      playerState = 'paused';
    } else if (playerState === 'finished') {
      mainTl.restart();
      playerState = 'playing';
    }
  };

  const goToPrevStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    if (playerState === 'finished' || mainTl.currentTime === stepStartTimes[currentIdx]) {
      goToStep(currentIdx - 1);
    }
    else {
      goToStep(currentIdx);
    }
  };

  const goToNextStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    goToStep(currentIdx + 1);
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

  <div id="controls" style="position: fixed; bottom: 20px; right: 20px;">
    <button class="control-btn" on:click={goToPrevStep}>
      <SkipBack />
    </button>
    <button class="control-btn" on:click={togglePlayPause}>
      {#if playerState === 'finished'}
        <RotateCcw />
      {:else if playerState === 'paused'}
        <Play />
      {:else}
        <Pause />
      {/if}
    </button>
    <button class="control-btn" on:click={goToNextStep}>
      <SkipForward />
    </button>
  </div>
</div>