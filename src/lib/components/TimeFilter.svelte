<script lang="ts">
    import { nyTime } from '$lib/stores/timeStore';
    import { onDestroy } from 'svelte';

    interface TimeFilterOption {
        text: string;
        value: string;
    }

    type FilterTabs = 'Histórico';
    type TimeFilters = Record<FilterTabs, TimeFilterOption[]>;

    let currentNyDate: Date;
    const unsubscribe = nyTime.subscribe((time: { dateString: string }) => {
        currentNyDate = new Date(time.dateString.split('/').reverse().join('-'));
    });

    onDestroy(unsubscribe);

    function getDateRange(days: number): string {
        const date = new Date(currentNyDate);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }

    function getFilterTabs(filters: TimeFilters): FilterTabs[] {
        return Object.keys(filters) as FilterTabs[];
    }

    $: timeFilters = {
        'Histórico': [
            { text: 'Todo', value: 'all' },
            { text: 'Últimos 12 meses', value: getDateRange(365) },
            { text: 'Últimos 6 meses', value: getDateRange(180) },
            { text: 'Últimos 3 meses', value: getDateRange(90) },
            { text: 'Mes anterior', value: getDateRange(30) },
            { text: 'Mes actual', value: currentNyDate?.toISOString().split('T')[0] },
            { text: 'Ayer', value: getDateRange(1) },
            { text: 'Hoy', value: currentNyDate?.toISOString().split('T')[0] }
        ]
    } satisfies TimeFilters;

    let selectedTab: FilterTabs = 'Histórico';
    let selectedFilter: string = 'all';

    function handleFilterChange(tab: FilterTabs, value: string): void {
        selectedTab = tab;
        selectedFilter = value;
    }
</script>

<div class="flex flex-col border-b border-gray-200 mt-4">
    <div class="flex">
        {#each getFilterTabs(timeFilters) as tab}
          <button
            class="px-4 py-2 font-medium text-sm transition-colors duration-150
                   {selectedTab === tab 
                     ? 'text-gray-700 border-b-2 border-gray-500 bg-white' 
                     : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}"
            on:click={() => handleFilterChange(tab, timeFilters[tab][0].value)}
          >
            {tab}
          </button>
        {/each}
    </div>
  
    <div class="flex flex-wrap gap-2 py-3 px-2 bg-gray-50 rounded-b-lg">
        {#each timeFilters[selectedTab] as {text, value}}
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150
                   {selectedFilter === value 
                     ? 'bg-gray-200 text-gray-700 border border-gray-200' 
                     : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'}"
            on:click={() => handleFilterChange(selectedTab, value)}
          >
            {text}
          </button>
        {/each}
    </div>
</div>