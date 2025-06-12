<script lang="ts">
	import { updateIAResume } from '$lib/stores/iaResume';
	import type { FormattedTrade } from '$lib/interfaces/trades';

	export let trades: FormattedTrade[] = [];

	let showMode: 'last' | 'best' | 'worst' = 'last';
	let displayedTrades: { trade: FormattedTrade; index: number; profitPercentage: number }[] = [];

	function calculateProfitPercentage(trade: FormattedTrade, index: number): number {
		const previousBalance = index > 0 ? trades[index - 1].saldo : trades[0].saldo - trades[0].neto;
		const profitPercentage = (trade.neto / previousBalance) * 100;
		return parseFloat(profitPercentage.toFixed(2));
	}

	$: {
		generateIAResume();
		displayedTrades = (() => {
			if (trades.length === 0) return [];

			const tradesWithIndex = trades.map((trade, index) => ({
				trade,
				index,
				profitPercentage: calculateProfitPercentage(trade, index)
			}));

			if (showMode === 'last') {
				return tradesWithIndex.slice(-5).reverse();
			} else if (showMode === 'best') {
				return [...tradesWithIndex]
					.sort((a, b) => b.profitPercentage - a.profitPercentage)
					.slice(0, 5);
			} else {
				return [...tradesWithIndex]
					.sort((a, b) => a.profitPercentage - b.profitPercentage)
					.slice(0, 5);
			}
		})();
	}

	function generateIAResume() {
		if (trades.length === 0) {
			updateIAResume('lastTrades', 'No hay datos de trades disponibles');
			return;
		}

		const lastFive = trades
			.slice(-5)
			.reverse()
			.map((trade, i) => ({
				...trade,
				profitPercentage: calculateProfitPercentage(trade, trades.length - 5 + i)
			}));

		const bestFive = [...trades]
			.map((trade, i) => ({ trade, profitPercentage: calculateProfitPercentage(trade, i) }))
			.sort((a, b) => b.profitPercentage - a.profitPercentage)
			.slice(0, 5);

		const worstFive = [...trades]
			.map((trade, i) => ({ trade, profitPercentage: calculateProfitPercentage(trade, i) }))
			.sort((a, b) => a.profitPercentage - b.profitPercentage)
			.slice(0, 5);

		const summary = `
RESUMEN DE TRADES DESTACADOS:
=== ÚLTIMOS 5 TRADES ===
${lastFive.map((t) => `- ${t.fecha_cierre} | ${t.direccion} | $${t.neto.toFixed(2)} (${t.profitPercentage}%)`).join('\n')}

=== MEJORES 5 TRADES ===
${bestFive.map((t) => `- ${t.trade.fecha_cierre} | ${t.trade.direccion} | $${t.trade.neto.toFixed(2)} (${t.profitPercentage}%)`).join('\n')}

=== PEORES 5 TRADES ===
${worstFive.map((t) => `- ${t.trade.fecha_cierre} | ${t.trade.direccion} | $${t.trade.neto.toFixed(2)} (${t.profitPercentage}%)`).join('\n')}
`;

		updateIAResume('lastTrades', summary);
	}

	function formatDate(dateStr: string): string {
		const [date, time] = dateStr.split(' ');
		const [day, month] = date.split('/');
		const [hours, minutes] = time.split(':');
		return `${day}/${month} ${hours}:${minutes}`;
	}

	function getDirectionColor(direction: string): string {
		return direction === 'Comprar' ? 'text-green-600' : 'text-red-600';
	}
</script>

<div class="flex h-auto max-h-96 flex-col rounded-sm bg-gray-200">
	<div class="flex items-center justify-between px-3 pt-2 pb-1">
		<p class="text-sm">Últimos Trades</p>
		<div class="flex items-center gap-1">
			<button
				class="rounded px-2 py-1 text-xs transition-colors
                    {showMode === 'last'
					? 'bg-gray-800/80 text-white'
					: 'bg-gray-100 hover:bg-gray-200'}"
				on:click={() => (showMode = 'last')}
			>
				Últimos
			</button>
			<button
				class="rounded px-2 py-1 text-xs transition-colors
                    {showMode === 'best'
					? 'bg-green-800/80 text-white'
					: 'bg-gray-100 hover:bg-gray-200'}"
				on:click={() => (showMode = 'best')}
			>
				Mejores
			</button>
			<button
				class="rounded px-2 py-1 text-xs transition-colors
                    {showMode === 'worst'
					? 'bg-red-800/80 text-white'
					: 'bg-gray-100 hover:bg-gray-200'}"
				on:click={() => (showMode = 'worst')}
			>
				Peores
			</button>
		</div>
	</div>

	<div class="m-1 bg-white">
		<div
			class="flex justify-between border-b border-gray-200 bg-gray-100 px-3 py-1 text-xs text-gray-600"
		>
			<span>Símbolo/Dirección</span>
			<span>Fecha</span>
			<span>Resultado</span>
		</div>

		<div class="flex flex-1 flex-col overflow-y-auto bg-white">
			{#if trades.length === 0}
				<div class="py-4 text-center text-sm text-gray-500">No hay trades disponibles</div>
			{:else}
				<div class="divide-y divide-gray-100">
					{#each displayedTrades as { trade, index }}
						<div class="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
							<div class="flex min-w-0 items-center gap-2">
								<span class="truncate text-sm font-medium">{trade.simbolo}</span>
								<span class={`text-xs ${getDirectionColor(trade.direccion)}`}>
									({trade.direccion === 'Comprar' ? 'L' : 'S'})
								</span>
							</div>

							<div class="text-xs whitespace-nowrap text-gray-600">
								{formatDate(trade.fecha_apertura)}
							</div>

							<div
								class={`text-sm font-semibold whitespace-nowrap ${
									trade.neto >= 0 ? 'text-green-600' : 'text-red-600'
								}`}
							>
								{trade.neto >= 0 ? '+' : ''}{calculateProfitPercentage(trade, index)}%
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
