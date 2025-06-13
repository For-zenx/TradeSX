<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { FormattedTrade } from '$lib/interfaces/trades';
	import { updateIAResume } from '$lib/stores/iaResume';

	export let trades: FormattedTrade[] = [];
	let chart: Chart;

	interface SymbolStats {
		symbol: string;
		totalTrades: number;
		winningTrades: number;
		losingTrades: number;
		totalVolume: number;
	}

	// Convertimos estas variables en reactivas con $:
	$: symbolsStats = (() => {
		const statsMap = new Map<string, SymbolStats>();

		trades.forEach(trade => {
			if (!statsMap.has(trade.simbolo)) {
				statsMap.set(trade.simbolo, {
					symbol: trade.simbolo,
					totalTrades: 0,
					winningTrades: 0,
					losingTrades: 0,
					totalVolume: 0
				});
			}

			const symbolStats = statsMap.get(trade.simbolo)!;
			symbolStats.totalTrades++;
			symbolStats.totalVolume += Math.abs(trade.neto);

			if (trade.neto >= 0) {
				symbolStats.winningTrades++;
			} else {
				symbolStats.losingTrades++;
			}
		});

		return Array.from(statsMap.values())
			.sort((a, b) => b.totalVolume - a.totalVolume);
	})();

	$: topSymbols = symbolsStats.slice(0, 5);

	onMount(() => {
		renderChart();
		return () => chart?.destroy();
	});

	// Esta reactividad ahora funcionará correctamente
	$: {
		if (trades.length > 0) {
			if (chart) chart.destroy();
			renderChart();
			generateIAResume();
		} else {
			updateIAResume('volumeSummary', 'No hay datos de volumen disponibles');
		}
	}

	function renderChart() {
		const ctx = document.getElementById('volumeChart') as HTMLCanvasElement | null;
		if (!ctx || symbolsStats.length === 0) return;

		const top5 = symbolsStats.slice(0, 5);
		const othersVolume = symbolsStats.slice(5).reduce((sum, s) => sum + s.totalVolume, 0);

		const data = {
			labels: [...top5.map(s => s.symbol), ...(othersVolume > 0 ? ['Otros'] : [])],
			datasets: [{
				data: [...top5.map(s => s.totalVolume), ...(othersVolume > 0 ? [othersVolume] : [])],
				backgroundColor: [
					'#4CAF50',
					'#2196F3',
					'#FFC107',
					'#9C27B0',
					'#F44336',
					...(othersVolume > 0 ? ['#607D8B'] : [])
				],
				borderWidth: 1
			}]
		};

		chart = new Chart(ctx, {
			type: 'doughnut',
			data: data,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '70%',
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							boxWidth: 12,
							padding: 20
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.raw as number;
								const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
								const percentage = Math.round((value / total) * 100);
								return `${label}: ${percentage}% ($${value.toFixed(2)})`;
							}
						}
					}
				}
			}
		});
	}

	function generateIAResume() {
		if (symbolsStats.length === 0) {
			updateIAResume('volumeSummary', 'No hay datos de volumen disponibles');
			return;
		}

		const totalVolume = symbolsStats.reduce((sum, s) => sum + s.totalVolume, 0);
		const summary = `RESUMEN DE VOLUMEN POR SÍMBOLO:
${topSymbols.map(s => `- ${s.symbol}: ${((s.totalVolume / totalVolume) * 100).toFixed(1)}% volumen (${s.winningTrades}G/${s.losingTrades}P, ${((s.winningTrades / s.totalTrades) * 100).toFixed(1)}% WR)`).join('\n')}
${symbolsStats.length > 5 ? `- Otros: ${((symbolsStats.slice(5).reduce((sum, s) => sum + s.totalVolume, 0) / totalVolume) * 100).toFixed(1)}% volumen` : ''}`;

		updateIAResume('volumeSummary', summary);
	}
</script>

<div class="col-span-2 h-auto rounded-sm bg-gray-200">
	<div class="flex items-center justify-between px-1 pt-2">
		<p class="text-sm select-none">Volumen</p>
	</div>
	<div class="m-1 bg-white p-4">
		<div class="flex flex-col md:flex-row gap-4">
			<!-- Gráfico Donut -->
			<div class="w-full md:w-1/2 h-64">
				<canvas id="volumeChart"></canvas>
			</div>

			<!-- Tabla de resumen -->
			<div class="w-full md:w-1/2 flex items-center">
				<div class="w-full border border-gray-200 rounded-lg overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Símbolo</th>
								<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volumen</th>
								<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operaciones</th>
								<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each topSymbols as symbol}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{symbol.symbol}</td>
									<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
										{((symbol.totalVolume / symbolsStats.reduce((sum, s) => sum + s.totalVolume, 0)) * 100).toFixed(1)}%
									</td>
									<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
										{symbol.winningTrades}G/{symbol.losingTrades}P
									</td>
									<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
										<span class={`font-semibold ${(symbol.winningTrades / symbol.totalTrades) >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
											{((symbol.winningTrades / symbol.totalTrades) * 100).toFixed(1)}%
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>