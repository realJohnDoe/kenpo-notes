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

  async function handlePrev() {
    if (animation) {
      playerState = await animation.goToPrevStep();
    }
  }

  async function handleNext() {
    if (animation) {
      playerState = await animation.goToNextStep();
    }
  }

  function handleComplete() {
    playerState = 'finished';
  }
</script>

<Animation bind:this={animation} {timelineData} {svgContent} onComplete={handleComplete} />
<Controls {playerState} on:togglePlayPause={handleTogglePlayPause} on:prev={handlePrev} on:next={handleNext} />
