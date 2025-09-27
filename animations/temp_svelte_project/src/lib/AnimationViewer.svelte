<script lang="ts">
  import anime from 'animejs';
  import { onMount, onDestroy } from 'svelte';
  import { Play, Pause, SkipBack, SkipForward } from 'lucide-svelte';

  // Define interfaces for better type safety
  interface AnimationStep {
    anims?: any[];
    label?: {
      texts: string[];
      y: number;
      duration?: number;
    };
  }

  export let timelineData: AnimationStep[];
  export let svgContent: string;

  let mainTl: any; // anime.timeline instance
  let stepStartTimes: number[] = [];
  let labelEl: HTMLElement | null;
  let paused = true;

  onMount(() => {
    labelEl = document.getElementById('stepLabel');
    mainTl = anime.timeline({ 
      autoplay: false, 
      loop: false,
      update: () => {
        paused = mainTl.paused;
      }
    });

    let currentTimelineCursor = 0;

    timelineData.forEach((step: AnimationStep) => {
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
          translateY: step.label.y,
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

      mainTl.add({
          targets: labelEl,
          opacity: 0,
          duration: 200,
          easing: 'linear'
      }, currentTimelineCursor + stepDuration - 200);

      currentTimelineCursor += stepDuration;
    });

    stepStartTimes.push(currentTimelineCursor);
    goToStep(0);
  });

  onDestroy(() => {
    if (mainTl) {
      mainTl.pause();
      mainTl.seek(0);
    }
  });

  function getStepIndexFromTime(time: number): number {
    for (let i = 0; i < stepStartTimes.length - 1; i++) {
      if (time >= stepStartTimes[i] && time < stepStartTimes[i+1]) {
        return i;
      }
    }
    if (time >= stepStartTimes[stepStartTimes.length - 1]) {
      return stepStartTimes.length - 2;
    }
    return 0;
  }

  function goToStep(index: number) {
    let targetTime: number;
    if (index >= 0 && index < stepStartTimes.length - 1) {
      targetTime = stepStartTimes[index];
    } else if (index === stepStartTimes.length - 1) {
      targetTime = mainTl.duration;
    } else {
      return;
    }

    const seekProgress = { value: mainTl.currentTime };
    anime({
      targets: seekProgress,
      value: targetTime,
      duration: Math.abs(targetTime - mainTl.currentTime) * 0.1,
      easing: 'linear',
      update: () => {
        mainTl.seek(seekProgress.value);
      },
      complete: () => {
        if (!mainTl.paused) {
          mainTl.pause();
        }
      }
    });
  }

  function togglePlayPause() {
    if (mainTl.paused) {
      mainTl.play();
    } else {
      mainTl.pause();
    }
    paused = mainTl.paused;
  }

  function goToPrevStep() {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    if (mainTl.currentTime === stepStartTimes[currentIdx]) {
      goToStep(currentIdx - 1);
    } else {
      goToStep(currentIdx);
    }
  }

  function goToNextStep() {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    goToStep(currentIdx + 1);
  }
</script>

<div class="animation-container">
  {@html svgContent}

  <div id="controls" style="position: fixed; bottom: 20px; right: 20px;">
    <button class="control-btn" on:click={goToPrevStep}>
      <SkipBack />
    </button>
    <button class="control-btn" on:click={togglePlayPause}>
      {#if paused}
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