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
        console.log('Animation: mainTl completed, playerState:', playerState);
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
    console.log('Animation: onMount finished, playerState:', playerState);
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

  export const getPlayerState = () => playerState;

  export const goToStep = (index: number) => {
    console.log('Animation: goToStep called, index:', index, 'playerState:', playerState, 'mainTl.completed:', mainTl.completed);
    return new Promise<'playing' | 'paused' | 'finished'>((resolve) => {
        let targetTime: number;
        if (index >= 0 && index < stepStartTimes.length - 1) {
          targetTime = stepStartTimes[index];
        } else if (index === stepStartTimes.length - 1) {
          targetTime = mainTl.duration;
        } else {
          resolve(playerState);
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
                console.log('Animation: goToStep complete, playerState:', playerState, 'mainTl.completed:', mainTl.completed);
                resolve(playerState);
            }
        });

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
    });
  };

  export const togglePlayPause = () => {
    console.log('Animation: togglePlayPause called, playerState:', playerState, 'mainTl.completed:', mainTl.completed);
    if (playerState === 'playing') {
      mainTl.pause();
      playerState = 'paused';
      console.log('Animation: togglePlayPause -> paused, playerState:', playerState);
    } else { // paused or finished
      if (mainTl.completed) {
        mainTl.restart();
        console.log('Animation: togglePlayPause -> restart, playerState:', playerState);
      } else {
        mainTl.play();
        console.log('Animation: togglePlayPause -> play, playerState:', playerState);
      }
      playerState = 'playing';
      console.log('Animation: togglePlayPause -> playing, playerState:', playerState);
    }
    return playerState;
  };

  export const goToPrevStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    if (playerState === 'finished' || mainTl.currentTime === stepStartTimes[currentIdx]) {
      return goToStep(currentIdx - 1);
    }
    else {
      return goToStep(currentIdx);
    }
  };

  export const goToNextStep = () => {
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    return goToStep(currentIdx + 1);
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
