<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-svelte';

  export let playerState: 'playing' | 'paused' | 'finished' = 'paused';
  export let playbackSpeed: number = 1;

  const dispatch = createEventDispatcher();

  const handlePrev = () => dispatch('prev');
  const handleToggle = () => dispatch('togglePlayPause');
  const handleNext = () => dispatch('next');
  const handleSpeedChange = (speed: number) => dispatch('speedChange', speed);
</script>

<!-- Speed Controls - Bottom Left -->
<div id="speed-controls" style="position: fixed; bottom: 20px; left: 20px;">
  <button
    class="speed-btn {playbackSpeed === 0.5 ? 'active' : ''}"
    on:click={() => handleSpeedChange(0.5)}
  >
    0.5x
  </button>
  <button
    class="speed-btn {playbackSpeed === 1 ? 'active' : ''}"
    on:click={() => handleSpeedChange(1)}
  >
    1x
  </button>
  <button
    class="speed-btn {playbackSpeed === 2 ? 'active' : ''}"
    on:click={() => handleSpeedChange(2)}
  >
    2x
  </button>
</div>

<!-- Playback Controls - Bottom Right -->
<div id="controls" style="position: fixed; bottom: 20px; right: 20px;">
  <button class="control-btn" on:click={handlePrev}>
    <SkipBack />
  </button>
  <button class="control-btn" on:click={handleToggle}>
    {#if playerState === 'finished'}
      <RotateCcw />
    {:else if playerState === 'paused'}
      <Play />
    {:else}
      <Pause />
    {/if}
  </button>
  <button class="control-btn" on:click={handleNext}>
    <SkipForward />
  </button>
</div>
