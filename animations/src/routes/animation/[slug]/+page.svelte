<script>
    import AnimationViewer from "$lib/AnimationViewer.svelte";

    export let data;
</script>

<svelte:head>
    <title>{data.slug}</title>
</svelte:head>

<div class="animation-slug-page">
    <AnimationViewer animationData={data.animationData} svgContent={data.svgContent} />
</div>
