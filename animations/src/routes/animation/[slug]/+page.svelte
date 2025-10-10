<script lang="ts">
  import AnimationViewer from '$lib/AnimationViewer.svelte';

  // This `data` prop is automatically passed from your +page.server.js
  export let data;
</script>

<svelte:head>
    <title>{data.slug}</title>
</svelte:head>

<div class="animation-slug-page">
    <AnimationViewer animationData={data.animationData} svgContent={data.svgContent} labelsData={data.labelsData} />
</div>
