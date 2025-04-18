<svelte:head>
    <title>Trades</title>
</svelte:head>

<script lang="ts">
    import { onMount } from 'svelte';
    import type { FormattedTrade } from '$lib/interfaces/trades';
    let trades = [] as FormattedTrade[];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            const response = await fetch('/api/trades');
            if (!response.ok) throw new Error('Network response was not ok');
            let data = await response.json();
            trades = data.data.reverse();
        } catch (err: unknown) {
            console.error('Error fetching trades:', err);
            if (err instanceof Error) {
                error = err.message;
            }
        } finally {
            loading = false;
        }
    });
</script>

<div class="container mx-auto">
    {#if loading}
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p class="mt-2 text-gray-600">Cargando trades...</p>
        </div>
    {:else if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Error:</strong>
            <span class="block sm:inline"> {error}</span>
        </div>
    {:else}
        <div class="flex justify-end text-sm text-gray-600 pb-1 px-4">Total trades: {trades.length}</div>
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead class="bg-gray-50">
                    <tr class="*:px-6 *:py-3 *:text-left *:text-xs *:font-medium *:text-gray-500 *:uppercase *:tracking-wider">
                        <th>Símbolo</th>
                        <th>Dirección</th>
                        <th>Fecha de Cierre</th>
                        <th>Precio Entrada</th>
                        <th>Precio Cierre</th>
                        <th>Cantidad</th>
                        <th>Volumen</th>
                        <th>Neto</th>
                        <th>Saldo</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    {#each trades as trade}
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trade.simbolo}</td>
                            <td class={`px-6 py-4 whitespace-nowrap text-sm ${trade.direccion === 'Comprar' ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.direccion}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.fecha_cierre}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.precio_entrada.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.precio_cierre.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.cantidad}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.volumen}</td>
                            <td class={`px-6 py-4 whitespace-nowrap text-sm font-medium ${trade.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.neto.toFixed(2)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.saldo.toFixed(2)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>