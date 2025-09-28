<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-svelte';

  export let playerState: 'playing' | 'paused' | 'finished' = 'paused';

  const dispatch = createEventDispatcher();

  const handlePrev = () => dispatch('prev');
  const handleToggle = () => dispatch('togglePlayPause');
  const handleNext = () => dispatch('next');
</script>

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
