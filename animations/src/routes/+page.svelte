<script lang="ts">
    import { onMount } from 'svelte';
    import { svg, animate, createTimeline, stagger, utils, type AnimeTimelineInstance } from 'animejs';

    let tl: AnimeTimelineInstance;

    onMount(() => {
        console.log("Running test animation on / page (FIXED stepped/cursor add with original signature).");

        const steps = [
            {
                delay: 0, // Delay before this step starts
                anims: [
                    { target: '#views', params: { opacity: [0, 1], duration: 500, ease: 'linear' } },
                    { target: '#b', params: { x: [0, 0], width: [0, 900], duration: 2000, ease: 'inOut(3)' } },
                    {
                        target: '#count',
                        params: {
                            innerHTML: { from: 0 },
                            modifier: (v: number) => utils.round(v, 0).toLocaleString(),
                            duration: 2000,
                            ease: 'inOut(3)'
                        }
                    }
                ]
            },
            {
                delay: 500, // The 500ms gap that was missing
                anims: [
                    { target: '#b', params: { x: 900, width: 0, duration: 1500, ease: 'inOut(3)' } },
                    { target: '#views', params: { opacity: 0, duration: 1500, ease: 'linear' } }
                ]
            }
        ];

        tl = createTimeline({
            loop: true,
            autoplay: false,
        });

        let currentTimelineCursor = 0;
        steps.forEach(step => {
            currentTimelineCursor += step.delay || 0;

            let stepDuration = 0;
            if (step.anims && step.anims.length > 0) {
                step.anims.forEach(anim => {
                    // Using the original add(target, params, offset) signature
                    tl.add(anim.target, anim.params, currentTimelineCursor);
                });
                stepDuration = Math.max(...step.anims.map(a => a.params.duration || 0));
            }

            currentTimelineCursor += stepDuration;
        });
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
