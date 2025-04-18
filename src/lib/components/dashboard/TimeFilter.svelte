<script lang="ts">
    import { nyTime } from '$lib/stores/timeStore';
    import { onMount } from 'svelte';
    import { onDestroy } from 'svelte';

    // 1. Tipos y constantes
    type DateRange = {
        label: string;
        start: string;
        end: string;
        key: string;
    };

    const FILTER_TABS = ['Histórico'] as const;
    type FilterTab = typeof FILTER_TABS[number];

    // 2. Estado del componente
    let currentDate: Date = new Date();
    let selectedTab: FilterTab = 'Histórico';
    let selectedRange = '3m';

    // 3. Configuración de suscripción
    const unsubscribe = nyTime.subscribe(({ dateString }) => {
        currentDate = new Date(dateString.split('/').reverse().join('-'));
    });
    onDestroy(unsubscribe);

    // 4. Funciones de utilidad
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const getFirstDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const getLastDay = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const getPrevDate = (days: number) => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - days);
        return date;
    };

    // 5. Generación de filtros
    const createFilter = (label: string, start: Date | string, end: Date | string, key: string): DateRange => ({
        label,
        start: typeof start === 'string' ? start : formatDate(start),
        end: typeof end === 'string' ? end : formatDate(end),
        key
    });

    $: dateFilters = {
        'Histórico': [
            createFilter('Todo', '2000-01-01', currentDate, 'all'),
            createFilter('12 meses', getPrevDate(365), currentDate, '12m'),
            createFilter('6 meses', getPrevDate(180), currentDate, '6m'),
            createFilter('3 meses', getPrevDate(90), currentDate, '3m'),
            createFilter('Mes anterior', getFirstDay(getPrevDate(30)), getLastDay(getPrevDate(30)), 'last-month'),
            createFilter('Este mes', getFirstDay(currentDate), currentDate, 'current-month'),
            createFilter('Ayer', getPrevDate(1), getPrevDate(1), 'yesterday'),
            createFilter('Hoy', currentDate, currentDate, 'today')
        ]
    };

    onMount(() => {
        const initialFilter = dateFilters[selectedTab].find(f => f.key === selectedRange);
        onSelect?.(initialFilter!);
    });
    
    export let onSelect: (range: { start: string; end: string; key: string }) => void;

    const selectFilter = (tab: FilterTab, rangeKey: string) => {
        selectedTab = tab;
        selectedRange = rangeKey;
        const selected = dateFilters[tab].find(f => f.key === rangeKey);
        onSelect?.(selected!); // El ! es porque sabemos que siempre existirá
    };
</script>

<div class="flex flex-col border-b border-gray-200">
    <!-- Pestañas -->
    <div class="flex">
        {#each FILTER_TABS as tab}
            <button
                class="px-4 py-2 text-sm font-medium transition-colors duration-150"
                class:text-gray-700={selectedTab === tab}
                class:text-gray-500={selectedTab !== tab}
                class:border-b-2={selectedTab === tab}
                class:border-gray-500={selectedTab === tab}
                class:bg-white={selectedTab === tab}
                class:hover:text-gray-700={selectedTab !== tab}
                class:hover:bg-gray-50={selectedTab !== tab}
                on:click={() => selectFilter(tab, dateFilters[tab][0].key)}
            >
                {tab}
            </button>
        {/each}
    </div>
  
    <!-- Rangos de fecha -->
    <div class="flex flex-wrap gap-2 py-3 px-2 bg-gray-50 rounded-b-lg">
        {#each dateFilters[selectedTab] as {label, key}}
            <button
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 border border-gray-200 cursor-pointer"
                class:bg-slate-200={selectedRange === key}
                class:bg-white={selectedRange !== key}
                class:text-black={selectedRange === key}
                class:text-gray-700={selectedRange !== key}
                class:hover:bg-gray-100={selectedRange !== key}
                on:click={() => selectFilter(selectedTab, key)}
            >
                {label}
            </button>
        {/each}
    </div>
</div>