<script lang="ts">
  import anime from 'animejs';
  import { onMount, onDestroy } from 'svelte';
  import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-svelte';

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
  let isAtEnd = false;

  onMount(() => {
    labelEl = document.getElementById('stepLabel');
    mainTl = anime.timeline({ 
      autoplay: false, 
      loop: false,
      update: () => {
        paused = mainTl.paused;
        isAtEnd = mainTl.currentTime >= mainTl.duration;
      },
      complete: () => {
        isAtEnd = true; // Ensure isAtEnd is true when animation completes
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
      mainTl.seek(0);
    }
  });

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
        if (index > 0) {
          const step = timelineData[index - 1];
          if (labelEl && step && step.label && step.label.texts) {
            labelEl.textContent = step.label.texts[step.label.texts.length - 1];
            anime({ targets: labelEl, opacity: 1, duration: 50, easing: 'linear' });
          } else if (labelEl) {
            anime({ targets: labelEl, opacity: 0, duration: 50, easing: 'linear' });
          }
        } else if (labelEl) { // index is 0
          anime({ targets: labelEl, opacity: 0, duration: 50, easing: 'linear' });
        }
      }
    });
  };

  const togglePlayPause = () => {
    if (isAtEnd) {
      mainTl.restart();
      isAtEnd = false; // Reset isAtEnd when restarting
      paused = false; // Immediately set paused to false
    } else if (mainTl.paused) {
      mainTl.play();
      paused = false; // Immediately set paused to false
    } else {
      mainTl.pause();
      paused = true; // Immediately set paused to true
    }
  };

  const goToPrevStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    if (mainTl.currentTime === stepStartTimes[currentIdx]) {
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

<div class="animation-container">
  {@html svgContent}

  <div id="controls" style="position: fixed; bottom: 20px; right: 20px;">
    <button class="control-btn" on:click={goToPrevStep}>
      <SkipBack />
    </button>
    <button class="control-btn" on:click={togglePlayPause}>
      {#if isAtEnd}
        <RotateCcw />
      {:else if paused}
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