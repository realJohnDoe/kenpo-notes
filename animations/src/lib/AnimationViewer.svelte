<script lang="ts">
  import Animation from './Animation.svelte';
  import Controls from './Controls.svelte';
  import type { AnimationData } from './animation';

  export let animationData: AnimationData[];
  export let svgContent: string;
  export let labelsData: any[]; // Add labelsData prop

  let animation: Animation;
  let playerState: 'playing' | 'paused' | 'finished' = 'paused';
  let playbackSpeed: number = 1;

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

  function handleSpeedChange(event: CustomEvent<number>) {
    const speed = event.detail;
    playbackSpeed = speed;
    if (animation) {
      animation.setPlaybackSpeed(speed);
    }
  }

  function handleComplete() {
    // playerState is updated via bind:playerState in Animation component
  }
</script>

<Animation
  bind:this={animation}
  bind:playerState
  bind:playbackSpeed
  {animationData}
  {svgContent}
  {labelsData}
  onComplete={handleComplete}
/>
<Controls
  {playerState}
  {playbackSpeed}
  on:togglePlayPause={handleTogglePlayPause}
  on:prev={handlePrev}
  on:next={handleNext}
  on:speedChange={handleSpeedChange}
/>
