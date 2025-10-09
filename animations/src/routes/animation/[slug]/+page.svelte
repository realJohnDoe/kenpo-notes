<script lang="ts">
  import AnimationViewer from '$lib/AnimationViewer.svelte';

  // This `data` prop is automatically passed from your +page.server.js
  export let data;
</script>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<AnimationViewer
  svgContent={data.svgContent}
  timelineData={data.timelineData}
/>
