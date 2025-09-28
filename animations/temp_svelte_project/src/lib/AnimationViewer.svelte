<script lang="ts">
  import Animation from './Animation.svelte';
  import Controls from './Controls.svelte';

  export let timelineData: any[];
  export let svgContent: string;

  let animation: Animation;
  let playerState: 'playing' | 'paused' | 'finished' = 'paused';

  function handleTogglePlayPause() {
    if (animation) {
      playerState = animation.togglePlayPause();
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
    playerState = 'finished';
  }
</script>

<Animation bind:this={animation} {timelineData} {svgContent} onComplete={handleComplete} />
<Controls {playerState} on:togglePlayPause={handleTogglePlayPause} on:prev={handlePrev} on:next={handleNext} />
