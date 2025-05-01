<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<script lang="ts">
    import TimeFilter from '$lib/components/dashboard/TimeFilter.svelte';
    import TradesCount from '$lib/components/dashboard/TradesCount.svelte';
    import CapitalChart from '$lib/components/dashboard/CapitalChart.svelte';
	import GeneralResume from '$lib/components/dashboard/GeneralResume.svelte';
	import DrowdownIndex from '$lib/components/dashboard/DrowdownIndex.svelte';
    import { iaResumeStore, getFullResume } from '$lib/stores/iaResume';
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import {onMount} from 'svelte';
    
    let allTrades: FormattedTrade[] = [];
    let filteredTrades = $state<FormattedTrade[]>([]);
    let currentRange = $state<{start: string; end: string} | null>(null);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    async function loadAllTrades() {
        isLoading = true;
        error = null;
        try {
            const response = await fetch('/api/trades');
            if (!response.ok) throw new Error('Error en la respuesta');
            const data = await response.json();
            console.log(data);
            allTrades = data.data || [];
            if (currentRange) filterTrades(currentRange);
        } catch (err) {
            error = 'Error al cargar los trades';
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    function filterTrades(range: {start: string; end: string}) {
        currentRange = range;
        const startDate = new Date(range.start);
        const endDate = new Date(range.end);
        
        filteredTrades = allTrades.filter(trade => {
            try {
                const [day, month, year] = trade.fecha_cierre.split(' ')[0].split('/');
                const tradeDate = new Date(`${year}-${month}-${day}`);
                return tradeDate >= startDate && tradeDate <= endDate;
            } catch {
                return false;
            }
        });
    }

    // Maneja cambios de rango
    async function updateData(range: { start: string; end: string; key: string }) {
        if (allTrades.length === 0) await loadAllTrades();
        filterTrades(range);
    }

    function copyIAResume() {
        const fullResume = getFullResume();
        navigator.clipboard.writeText(fullResume)
    }

    onMount(() => {
        loadAllTrades();
    });
</script>

<TimeFilter onSelect={updateData} />
{#if isLoading}
    <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p class="mt-2 text-gray-600">Cargando trades...</p>
    </div>
{:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline"> {error}</span>
    </div>
{:else if filteredTrades.length === 0}
    <div class="p-4 text-center text-gray-500">No hay trades en el rango seleccionado</div>
{:else}
    <TradesCount trades={filteredTrades} />
    <div class="grid grid-cols-3 gap-2">
        <CapitalChart trades={filteredTrades}/>
        <GeneralResume trades={filteredTrades}/>
        <DrowdownIndex trades={filteredTrades}/>
    </div>
    <div class="flex justify-end mt-4">
        <button class="text-blue-700 hover:text-blue-900 font-medium py-2 px-4 rounded transition-colors" onclick={copyIAResume}>
            Copy IA resume
        </button>
    </div>
{/if}