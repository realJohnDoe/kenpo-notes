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
      playerState = animation.getPlayerState();
    }
  }

  function handleNext() {
    if (animation) {
      animation.goToNextStep();
      playerState = animation.getPlayerState();
    }
  }
</script>

<Animation bind:this={animation} {timelineData} {svgContent} />
<Controls {playerState} on:togglePlayPause={handleTogglePlayPause} on:prev={handlePrev} on:next={handleNext} />
