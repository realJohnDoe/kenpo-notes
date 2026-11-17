<script lang="ts">
  import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    RotateCcw
  } from '@lucide/svelte';

  type PlayerState = 'playing' | 'paused' | 'finished';

  let {
    playerState,
    playbackSpeed,
    onPrev,
    onTogglePlayPause,
    onNext,
    onSpeedChange
  }: {
    playerState: PlayerState;
    playbackSpeed: number;
    onPrev: () => void;
    onTogglePlayPause: () => void;
    onNext: () => void;
    onSpeedChange: (speed: number) => void;
  } = $props();

  const baseBtnClasses =
    'w-8 h-8 lg:w-12 lg:h-12 rounded-lg flex justify-center items-center cursor-pointer shadow-md transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-lg active:translate-y-0';
  const speedBtnClasses = 'text-xs lg:text-lg font-semibold';
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
        onclick={() => onSpeedChange(0.5)}
      >
        0.5x
      </button>
      <button
        class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 1
          ? activeSpeedBtnClasses
          : inactiveBtnClasses}"
        onclick={() => onSpeedChange(1)}
      >
        1x
      </button>
      <button
        class="{baseBtnClasses} {speedBtnClasses} {playbackSpeed === 2
          ? activeSpeedBtnClasses
          : inactiveBtnClasses}"
        onclick={() => onSpeedChange(2)}
      >
        2x
      </button>
    </div>

    <!-- Playback Controls - Bottom Right -->
    <div class="absolute right-2 bottom-2 flex gap-3">
      <button class="{baseBtnClasses} {inactiveBtnClasses}" onclick={onPrev}>
        <SkipBack class="w-4 lg:w-6" />
      </button>
      <button
        class="{baseBtnClasses} {playerState === 'playing'
          ? activeSpeedBtnClasses
          : inactiveBtnClasses}"
        onclick={onTogglePlayPause}
      >
        {#if playerState === 'finished'}
          <RotateCcw class="w-4 lg:w-6" />
        {:else if playerState === 'paused'}
          <Play class="w-4 lg:w-6" />
        {:else}
          <Pause class="w-4 lg:w-6" />
        {/if}
      </button>
      <button class="{baseBtnClasses} {inactiveBtnClasses}" onclick={onNext}>
        <SkipForward class="w-4 lg:w-6" />
      </button>
    </div>
  </div>
</div>
