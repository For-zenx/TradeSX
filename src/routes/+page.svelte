<svelte:head>
    <title>Dashboard</title>
</svelte:head>
<script lang="ts">
    import TimeFilter from '$lib/components/dashboard/TimeFilter.svelte';

    function updateData(range: { start: string; end: string; key: string }) {
        console.log('Rango seleccionado:', range);
    }
</script>

<TimeFilter onSelect={updateData} />
