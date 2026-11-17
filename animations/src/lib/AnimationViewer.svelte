<script lang="ts">
  import Animation from './Animation.svelte';
  import Controls from './Controls.svelte';
  import type { AnimationData } from './animation';
  import type { LabelData } from './animation-types';

  let {
    animationData,
    svgContent,
    labelsData
  }: {
    animationData: AnimationData[];
    svgContent: string;
    labelsData: LabelData[];
  } = $props();

  let animation: Animation | undefined = $state();
  let playerState: 'playing' | 'paused' | 'finished' = $state('paused');
  let playbackSpeed = $state(1);
</script>

<Animation
  bind:this={animation}
  bind:playerState
  bind:playbackSpeed
  {animationData}
  {svgContent}
  {labelsData}
/>
<Controls
  {playerState}
  {playbackSpeed}
  onTogglePlayPause={() => animation?.togglePlayPause()}
  onPrev={() => animation?.goToPrevStep()}
  onNext={() => animation?.goToNextStep()}
  onSpeedChange={(speed) => animation?.setPlaybackSpeed(speed)}
/>
