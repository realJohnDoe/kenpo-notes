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

  const baseBtnClasses = 'w-12 h-12 rounded-lg border border-gray-200 bg-white text-gray-800 flex justify-center items-center cursor-pointer shadow-md transition-all duration-200 ease-in-out hover:bg-gray-100 hover:-translate-y-px hover:shadow-lg active:bg-gray-200 active:translate-y-0';
  const speedBtnClasses = 'text-sm font-medium';
  const activeSpeedBtnClasses = 'bg-gray-700 text-white border-gray-700 hover:bg-gray-700';
</script>

<!-- Speed Controls - Bottom Left -->
<div class="flex gap-3" style="position: fixed; bottom: 20px; left: 20px;">
  <button
    class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 0.5 ? activeSpeedBtnClasses : ''}"
    on:click={() => handleSpeedChange(0.5)}
  >
    0.5x
  </button>
  <button
    class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 1 ? activeSpeedBtnClasses : ''}"
    on:click={() => handleSpeedChange(1)}
  >
    1x
  </button>
  <button
    class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 2 ? activeSpeedBtnClasses : ''}"
    on:click={() => handleSpeedChange(2)}
  >
    2x
  </button>
</div>

<!-- Playback Controls - Bottom Right -->
<div class="flex gap-3" style="position: fixed; bottom: 20px; right: 20px;">
  <button class="{baseBtnClasses}" on:click={handlePrev}>
    <SkipBack />
  </button>
  <button class="{baseBtnClasses}" on:click={handleToggle}>
    {#if playerState === 'finished'}
      <RotateCcw />
    {:else if playerState === 'paused'}
      <Play />
    {:else}
      <Pause />
    {/if}
  </button>
  <button class="{baseBtnClasses}" on:click={handleNext}>
    <SkipForward />
  </button>
</div>
