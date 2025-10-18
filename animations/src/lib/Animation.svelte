<script lang="ts">
  import { animate, createTimeline } from 'animejs';
  import { onMount, onDestroy } from 'svelte';
  import type { AnimationData } from './animation';

  // Props
  export let animationData: AnimationData[] = [];
  if (!animationData) {
    animationData = [];
  }
  export let svgContent: string;
  export let onComplete: () => void = () => {};
  export let labelsData: any[] = []; // Accept labelsData prop

  // State
  let mainTl: any; // anime.timeline instance
  let stepStartTimes: number[] = [];
  export let playerState: 'playing' | 'paused' | 'finished' = 'paused';
  export let playbackSpeed: number = 1; // Default speed is 1x

  // We need 2 steps more: One for because there is one more still frames than animation steps and
  // one more because we add a step in the end as the finished state.
  $: totalSteps = stepStartTimes.length + 1;

  const canvasHeight = 600; // Hardcoded, but used for calculations

  let screenWidth: number;
  let screenHeight: number;

  $: svgRenderedSize = Math.min(screenWidth, screenHeight);
  $: verticalOffset = (screenHeight - svgRenderedSize) / 2;

  onMount(() => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      screenWidth = window.innerWidth;
      screenHeight = window.innerHeight;
    });

    mainTl = createTimeline({ 
      autoplay: false, 
      loop: false,
      onComplete: () => {
        console.log('Timeline complete: setting playerState to finished');
        playerState = 'finished';
        onComplete();
      }
    });

    // --- Timeline Building Logic ---
    animationData.forEach((animData) => {
      animData.targets.forEach((targetAnim) => {
        mainTl.add(targetAnim.target, targetAnim.cfg, animData.startFrame);
      });
    });
    console.log(`Timeline duration: ${mainTl.duration}`);

    const allNavigablePoints = new Set<number>();

    // Add all startFrames
    animationData.forEach(ad => allNavigablePoints.add(ad.startFrame));

    // Add end of last animation
    if (animationData.length > 0) {
        const lastAnim = animationData[animationData.length - 1];
        const endOfLastAnim = lastAnim.startFrame + lastAnim.durationToEndFrame;
        allNavigablePoints.add(endOfLastAnim);
    }

    // Add mainTl.duration
    allNavigablePoints.add(mainTl.duration);

    stepStartTimes = [...allNavigablePoints].sort((a, b) => a - b);
    console.log('stepStartTimes', stepStartTimes);
    
    goToStep(0);
  });

  onDestroy(() => {
    if (mainTl) {
      mainTl.pause();
    }
  });

  // --- Control Functions ---
  const getStepIndexFromTime = (time: number): number => {
    // Handle case where time is exactly at the end of the timeline
    if (time >= mainTl.duration) {
      return stepStartTimes.length - 1; // Return the index of the finished state
    }

    for (let i = 0; i < stepStartTimes.length; i++) {
      if (time >= stepStartTimes[i] && (i === stepStartTimes.length - 1 || time < stepStartTimes[i+1])) {
        return i;
      }
    }
    return 0; // Should not be reached for valid times within the timeline
  };

  export const goToStep = (index: number) => {
    console.log(`goToStep called with index: ${index}`);
    let targetTime: number;
    if (index >= 0 && index < stepStartTimes.length) {
      targetTime = stepStartTimes[index];
    } else if (index === stepStartTimes.length) {
      targetTime = mainTl.duration;
    } else {
      console.log('goToStep returned early: invalid index');
      return;
    }
    console.log(`goToStep targetTime: ${targetTime}`);

    if (playerState === 'playing') {
        mainTl.pause();
    }
    

    const proxy = { currentTime: mainTl.currentTime };
    animate(proxy, {
        currentTime: targetTime,
        duration: 300, // 300ms for a smooth transition
        ease: 'easeInOutSine',
        onUpdate: () => {
            mainTl.seek(proxy.currentTime);
            // Explicitly reset completed status after seeking
            if (mainTl.completed) {
                console.log(`goToStep update: mainTl.completed was true, setting to false.`);
                mainTl.completed = false;
            }
        },
        onComplete: () => {
            const oldState = playerState;
            if (targetTime >= mainTl.duration) {
                playerState = 'finished';
            } else {
                playerState = 'paused';
            }
            console.log(`goToStep complete. playerState changed from '${oldState}' to '${playerState}'`);
        }
    });
  };

  export const togglePlayPause = () => {
    console.log(`togglePlayPause called. Current state: ${playerState}, timeline completed: ${mainTl.completed}`);
    if (playerState === 'playing') {
      mainTl.pause();
      playerState = 'paused';
    } else { // paused or finished
      if (playerState === 'finished') { // If finished, always restart
        console.log('Player state is finished, restarting.');
        mainTl.restart();
      } else { // paused
        mainTl.play();
      }
      playerState = 'playing';
    }
    console.log(`togglePlayPause finished. New state: ${playerState}`);
    return playerState;
  };

  export const goToPrevStep = () => {
    console.log(`goToPrevStep called. Current state: ${playerState}, currentTime: ${mainTl.currentTime}`);
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx - 1;
    
    // Ensure targetStepIdx is not less than 0
    if (targetStepIdx < 0) {
      targetStepIdx = 0;
    }
    console.log(`goToPrevStep currentIdx: ${currentIdx}, targetStepIdx: ${targetStepIdx}`);
    goToStep(targetStepIdx);
  };

  export const goToNextStep = () => {
    console.log(`goToNextStep called. Current state: ${playerState}, currentTime: ${mainTl.currentTime}`);
    if (playerState === 'finished') {
      console.log('goToNextStep: player is finished, doing nothing.');
      return;
    }
    const currentIdx = getStepIndexFromTime(mainTl.currentTime);
    let targetStepIdx = currentIdx + 1;

    // If targetStepIdx exceeds the last keyframe, go to the finished state
    if (targetStepIdx > stepStartTimes.length) {
        targetStepIdx = stepStartTimes.length; // Index of the finished state
    }
    
    // ...
    goToStep(targetStepIdx);
    // NEW: If playerState is finished, reset mainTl.completed before seeking
    if (targetStepIdx == stepStartTimes.length - 1) {
        console.log('goToStep: Resetting mainTl.completed to false before seeking from finished state.');
        mainTl.completed = false;
    }
  };

  export const setPlaybackSpeed = (speed: number) => {
    console.log(`setPlaybackSpeed called with speed: ${speed}`);
    playbackSpeed = speed;
    if (mainTl) {
      // Store current progress as ratio
      const currentProgress = mainTl.currentTime / mainTl.duration;
      
      // Update the timeline's speed
      mainTl.speed = speed;
      
      console.log(`Playback speed changed to ${speed}x`);
    }
  };
</script>

<style>
  .animation-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    /* background-color: rgba(255, 0, 0, 0.2); */
  }
  .scaled-svg-wrapper {
    width: 100%;
    height: 100%;
  }

  /* Label styles moved from +page.svelte */

  .labels-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(100vw, 100vh);
    height: min(100vw, 100vh);
    pointer-events: none;
    z-index: 1;
    /* background-color: rgba(0, 255, 0, 0.2); */
  }
</style>

<div class="animation-container">
  <div class="scaled-svg-wrapper">
    {@html svgContent}
  </div>

  {#if labelsData && labelsData.length > 0}
    <div class="labels-container">
      {#each labelsData as label}
        <div class="label-wrapper" style="position: absolute; top: {label.y * (svgRenderedSize / canvasHeight)}px; left: 0; right: 0; display: flex; justify-content: center; transform: translateY(-50%); pointer-events: none;">
          <div id={label.id} class="bg-text-muted text-bg-light pt-1 pb-2 px-4 rounded-md text-2xl md:text-4xl max-w-full text-center whitespace-pre-wrap leading-normal" style="opacity: 0;">
            {label.text}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>