<script lang="ts">
  import Animation from './Animation.svelte';
  import Controls from './Controls.svelte';
  import type { AnimationData } from './animation';

  export let animationData: AnimationData[];
  export let svgContent: string;

  let animation: Animation;
  let playerState: 'playing' | 'paused' | 'finished' = 'paused';

  function handleTogglePlayPause() {
    if (animation) {
      animation.togglePlayPause();
    }
  }

  function handlePrev() {
    if (animation) {
      animation.goToPrevStep();
    }
  }

  function handleNext() {
    if (animation) {
      animation.goToNextStep();
    }
  }

  function handleComplete() {
    // playerState is updated via bind:playerState in Animation component
  }
</script>

<Animation bind:this={animation} bind:playerState={playerState} {animationData} {svgContent} onComplete={handleComplete} />
<Controls {playerState} on:togglePlayPause={handleTogglePlayPause} on:prev={handlePrev} on:next={handleNext} />