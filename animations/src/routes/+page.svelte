<script lang="ts">
  import anime from 'animejs';
  import { onMount } from 'svelte';

  onMount(() => {
    const tl = anime.timeline({
      easing: 'easeOutExpo',
      duration: 750
    });

    tl.add({
      targets: '.card',
      x: '15rem',
      duration: 500,
    }, 0)
    .add({
      targets: '.card',
      rotate: '1turn',
      duration: 500,
    }, 500)
    .add({
      targets: '.card',
      filter: 'blur(15px)',
      duration: 500,
    }, 1000);
  });
</script>

<div class="card"></div>

<style>
  .card {
  display: inline-block;
  width: 200px;
  height: 200px;
  background: darkblue;
}
</style>