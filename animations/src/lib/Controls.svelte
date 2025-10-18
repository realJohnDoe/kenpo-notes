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

  const baseBtnClasses =
    'w-8 h-8 md:w-12 md:h-12 rounded-lg flex justify-center items-center cursor-pointer shadow-md transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-lg active:translate-y-0';
  const speedBtnClasses = 'text-xs md:text-sm font-medium';
  const activeSpeedBtnClasses =
    'bg-primary text-bg-light hover:bg-primary-muted active:bg-gray-600';

  const inactiveBtnClasses = 'text-text bg-bg-light hover:bg-bg-dark';
</script>

<div class="pointer-events-none fixed inset-0 flex items-center justify-center">
  <div
    class="pointer-events-auto relative"
    style="width: min(100vh, 100vw); height: min(100vh, 100vw);"
  >
    <!-- Speed Controls - Bottom Left -->
    <div class="absolute bottom-2 left-2 flex gap-3">
      <button
        class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 0.5
          ? activeSpeedBtnClasses
          : inactiveBtnClasses}"
        on:click={() => handleSpeedChange(0.5)}
      >
        0.5x
      </button>
      <button
        class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 1
          ? activeSpeedBtnClasses
          : inactiveBtnClasses}"
        on:click={() => handleSpeedChange(1)}
      >
        1x
      </button>
      <button
        class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 2
          ? activeSpeedBtnClasses
          : inactiveBtnClasses}"
        on:click={() => handleSpeedChange(2)}
      >
        2x
      </button>
    </div>

    <!-- Playback Controls - Bottom Right -->
    <div class="absolute right-2 bottom-2 flex gap-3">
      <button
        class="{baseBtnClasses} {inactiveBtnClasses}"
        on:click={handlePrev}
      >
        <SkipBack class="w-4 lg:w-6" />
      </button>
      <button
        class="{baseBtnClasses} {inactiveBtnClasses}"
        on:click={handleToggle}
      >
        {#if playerState === 'finished'}
          <RotateCcw class="w-4 lg:w-6" />
        {:else if playerState === 'paused'}
          <Play class="w-4 lg:w-6" />
        {:else}
          <Pause class="w-4 lg:w-6" />
        {/if}
      </button>
      <button
        class="{baseBtnClasses} {inactiveBtnClasses}"
        on:click={handleNext}
      >
        <SkipForward class="w-4 lg:w-6" />
      </button>
    </div>
  </div>
</div>
