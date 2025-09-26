<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    anime({
      targets: '#my-element',
      translateX: 250,
      rotate: '1turn',
      backgroundColor: '#FFF',
      duration: 800,
      easing: 'easeInOutQuad'
    });
  });
</script>

<div id="my-element" style="width: 50px; height: 50px; background-color: blue;"></div>
