<script lang="ts">
    import { onMount } from 'svelte';
    import { svg, animate, createTimeline, stagger, utils, type AnimeTimelineInstance } from 'animejs';

    let tl: AnimeTimelineInstance;

    onMount(() => {
        console.log("Running test animation on / page.");

        const line = svg.createDrawable('line');

        tl = createTimeline({
          loop: true,
          autoplay: false, // Changed from implicit true to false
          defaults: {
            ease: 'inOut(3)',
            duration: 2000,
          }
        })
        .add('#views', {
          opacity: [0, 1],
          duration: 500,
        }, 0)
        .add('#b', {
          x: [0, 0],
          width: [0, 900],
        }, 0)
        .add('#count', {
          innerHTML: { from:  0 },
          modifier: (v: number) => utils.round(v, 0).toLocaleString(),
        }, '<<')
        .add('#b', {
          x: 900,
          width: 0,
          duration: 1500,
        }, '+=500')
        .add('#views', {
          opacity: 0,
          duration: 1500,
        }, '<<');
    });
</script>

<style>
    #views {
        font-family: sans-serif;
        font-size: 2em;
    }
    #count {
        font-family: monospace;
        font-size: 3em;
    }
    svg {
        margin-top: 20px;
    }
    .controls {
        margin-top: 1rem;
    }
</style>

<h1>Animation Test Page (on root)</h1>

<div class="controls">
    <button on:click={() => tl.play()}>Play</button>
    <button on:click={() => tl.pause()}>Pause</button>
    <button on:click={() => tl.restart()}>Restart</button>
</div>

<div id="views">Views</div>
<div id="count">0</div>
<svg width="1000" height="100">
    <line x1="0" y1="50" x2="1000" y2="50" stroke="black" stroke-width="2"/>
    <rect id="b" x="0" y="10" width="0" height="30" fill="cornflowerblue" />
</svg>
