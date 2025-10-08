<script lang="ts">
    import { onMount } from 'svelte';
    import { svg, animate, createTimeline, stagger, utils, type AnimeTimelineInstance } from 'animejs';

    export let data;

    let tl: AnimeTimelineInstance;

    onMount(() => {
        console.log("Running test animation on / page (FIXED stepped/cursor add with original signature).");

        const steps = [
            {
                delay: 0, // Delay before this step starts
                anims: [
                    { target: '#views', params: { opacity: [0, 1], duration: 500, ease: 'linear' } },
                    {
                        target: '#count',
                        params: {
                            innerHTML: { from: 0 },
                            modifier: (v: number) => utils.round(v, 0).toLocaleString(),
                            duration: 2000,
                            ease: 'inOut(3)'
                        }
                    },
                    {
                        target: '#layer1',
                        params: {
                            translateX: [-10, 10], // Move 20 units horizontally around center
                            rotate: [0, 360],    // Rotate 360 degrees
                            duration: 2000,      // Longer duration for more noticeable movement
                            ease: 'inOutSine',
                            alternate: true
                        }
                    }
                ]
            },
            {
                delay: 500, // The 500ms gap that was missing
                anims: [
                    { target: '#views', params: { opacity: 0, duration: 1500, ease: 'linear' } }
                ]
            }
        ];

        tl = createTimeline({
            autoplay: false,
            loop: false, // Changed from true
            onComplete: () => {
                console.log('Timeline complete for +page.svelte');
            }
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
    
    .controls {
        margin-top: 1rem;
    }
    .centered-svg-wrapper {
        display: flex;
        justify-content: center; /* Centers horizontally */
        align-items: center;     /* Centers vertically */
        width: 100%;             /* Take full width of parent */
        height: 600px;           /* Or some appropriate height for the SVG */
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

    <div style="margin-top: 2rem;">
        <h2>Loaded SVG Animation Test</h2>
        <div class="centered-svg-wrapper">
            {@html data.svgContent}
        </div>
    </div>


