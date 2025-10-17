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

  const baseBtnClasses = 'w-12 h-12 rounded-lg flex justify-center items-center cursor-pointer shadow-md transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-lg active:translate-y-0';
  const speedBtnClasses = 'text-sm font-medium';
  const activeSpeedBtnClasses = 'bg-primary text-bg-light hover:bg-primary-muted active:bg-gray-600';
  const inactiveBtnClasses = 'text-text bg-bg-light hover:bg-bg active:bg-gray-200';
</script>

<!-- Speed Controls - Bottom Left -->
<div class="flex gap-3" style="position: fixed; bottom: 20px; left: 20px;">
  <button
    class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 0.5 ? activeSpeedBtnClasses : inactiveBtnClasses}"
    on:click={() => handleSpeedChange(0.5)}
  >
    0.5x
  </button>
  <button
    class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 1 ? activeSpeedBtnClasses : inactiveBtnClasses}"
    on:click={() => handleSpeedChange(1)}
  >
    1x
  </button>
  <button
    class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 2 ? activeSpeedBtnClasses : inactiveBtnClasses}"
    on:click={() => handleSpeedChange(2)}
  >
    2x
  </button>
</div>

<!-- Playback Controls - Bottom Right -->
<div class="flex gap-3" style="position: fixed; bottom: 20px; right: 20px;">
  <button class="{baseBtnClasses} {inactiveBtnClasses}" on:click={handlePrev}>
    <SkipBack />
  </button>
  <button class="{baseBtnClasses} {inactiveBtnClasses}" on:click={handleToggle}>
    {#if playerState === 'finished'}
      <RotateCcw />
    {:else if playerState === 'paused'}
      <Play />
    {:else}
      <Pause />
    {/if}
  </button>
  <button class="{baseBtnClasses} {inactiveBtnClasses}" on:click={handleNext}>
    <SkipForward />
  </button>
</div>
