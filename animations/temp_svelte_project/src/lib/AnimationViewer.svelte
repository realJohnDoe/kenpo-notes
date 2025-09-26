<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { initControls } from './controls'; // Omit .ts extension

  // Define interfaces for better type safety
  interface AnimationStep {
    anims?: any[]; // Refine this type if you have a specific structure for animations
    label?: {
      texts: string[];
      y: number;
      duration?: number;
    };
  }

  export let timelineData: AnimationStep[]; // Data parsed from YAML
  export let svgContent: string;   // Initial SVG content

  let mainTl: any; // anime.timeline instance
  let stepStartTimes: number[] = [];
  let labelEl: HTMLElement | null; // Reference to the label element

  onMount(() => {
    // Find the label element within the component's DOM
    labelEl = document.getElementById('stepLabel');

    mainTl = anime.timeline({autoplay:true, loop:false});

    let currentTimelineCursor = 0; // Tracks the end of the previous step's animations

    timelineData.forEach((step: AnimationStep, index: number) => {
      stepStartTimes.push(currentTimelineCursor); // Store start time of this step

      let stepDuration = 1000; // Default duration for person animations

      // Add person animations to the main timeline
      if (step.anims && step.anims.length > 0) {
        const firstAnimation = step.anims[0];
        stepDuration = firstAnimation.duration;
        mainTl.add(firstAnimation, currentTimelineCursor);
        for (let i = 1; i < step.anims.length; i++) {
          mainTl.add(step.anims[i], currentTimelineCursor);
        }
      }

      // Add label animations to the main timeline
      if (step.label && step.label.texts && step.label.texts.length > 0) {
        const timePerLabel = stepDuration / step.label.texts.length;
        const fadeDuration = 200;

        // Set position and text, then fade in for the first label
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

        // Loop through subsequent labels for the current step
        for (let i = 1; i < step.label.texts.length; i++) {
          const labelText = step.label.texts[i];
          const prevLabelStartTime = currentTimelineCursor + (i * timePerLabel);

          // Fade out previous label
          mainTl.add({
            targets: labelEl,
            opacity: 0,
            duration: fadeDuration,
            easing: 'linear',
            complete: () => { if (labelEl) labelEl.textContent = labelText; }
          }, prevLabelStartTime - fadeDuration);

          // Fade in new label
          mainTl.add({
            targets: labelEl,
            opacity: 1,
            duration: fadeDuration,
            easing: 'linear'
          }, prevLabelStartTime);
        }
      }

      // After all animations for a step, fade out the last label
      mainTl.add({
          targets: labelEl,
          opacity: 0,
          duration: 200,
          easing: 'linear'
      }, currentTimelineCursor + stepDuration - 200);

      currentTimelineCursor += stepDuration; // Advance the timeline for the next step
    });
    // Add the end time of the last step
    stepStartTimes.push(currentTimelineCursor);

    // Initialize controls
    if (labelEl) {
      initControls(mainTl, stepStartTimes, 0, labelEl);
    }
  });

  onDestroy(() => {
    // Clean up any anime.js instances if necessary
    if (mainTl) {
      mainTl.pause();
      mainTl.seek(0);
    }
  });
</script>

<div class="animation-container">
  {@html svgContent} <!-- Svelte's way to inject raw HTML/SVG -->

  <div id="controls" style="position: fixed; bottom: 20px; right: 20px;">
    <button id="prevBtn" class="control-btn">Prev</button>
    <button id="playPauseBtn" class="control-btn">Play</button>
    <button id="nextBtn" class="control-btn">Next</button>
  </div>
</div>
