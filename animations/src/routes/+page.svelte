<script lang="ts">
  import { animate, createTimeline } from 'animejs';
  import { onMount } from 'svelte';

  onMount(() => {
    const tl = createTimeline({
      autoplay: true
    });

    tl.add(
      '.card',
      {
        x: '15rem',
        duration: 500,
        ease: 'easeOutExpo'
      },
      0
    )
      .add(
        '.card',
        {
          rotate: '1turn',
          duration: 500,
          ease: 'easeOutExpo'
        },
        500
      )
      .add(
        '.card',
        {
          filter: 'blur(15px)',
          duration: 500,
          ease: 'easeOutExpo'
        },
        1000
      );
  });
</script>

<h1 class="text-2xl font-bold underline text-red-500 p-8">Hello world!</h1>

<div class="card"></div>

<style>
  .card {
    display: inline-block;
    width: 200px;
    height: 200px;
    background: darkblue;
  }
</style>
