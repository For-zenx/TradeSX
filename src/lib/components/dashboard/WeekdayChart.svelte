<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { FormattedTrade } from '$lib/interfaces/trades';

	export let trades: FormattedTrade[] = [];
	let chart: Chart;

	onMount(() => {
		renderChart();
		return () => chart?.destroy();
	});

	$: if (trades.length > 0) {
		if (chart) chart.destroy();
		renderChart();
	}

	function renderChart() {
		const ctx = document.getElementById('performanceChart') as HTMLCanvasElement | null;
		if (!ctx) return;

		const { days, winners, losers } = processTradesByWeekday(trades);

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
				datasets: [
					{
						label: 'Trades Ganadores',
						data: winners,
						backgroundColor: '#4CAF50',
						borderColor: '#388E3C',
						barThickness: 20,
						categoryPercentage: 0.6,
						barPercentage: 0.9,
						borderWidth: 1
					},
					{
						label: 'Trades Perdedores',
						data: losers,
						backgroundColor: '#F44336',
						borderColor: '#D32F2F',
						barThickness: 20,
						categoryPercentage: 0.6,
						barPercentage: 0.9,
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							afterLabel: function (context) {
								const total = (winners[context.dataIndex] || 0) + (losers[context.dataIndex] || 0);
								if (total === 0) return 'No hay trades';

								const value = context.dataset.data[context.dataIndex] as number;
								const percentage = ((value / total) * 100).toFixed(1);
								return `Porcentaje: ${percentage}%`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false,
							offset: true // Añade espacio entre grupos de barras
						},
						stacked: false,
						ticks: {
							// Espacio adicional entre categorías (días)
							padding: 10
						}
					},
					y: {
						position: 'right',
						grid: { color: 'rgba(0, 0, 0, 0.05)' },
						ticks: {
							precision: 0,
							callback: (value: any) => Number(value).toLocaleString('en-US')
						},
						beginAtZero: true
					}
				},
				interaction: {
					mode: 'nearest',
					axis: 'x',
					intersect: false
				}
				// Ajuste del espaciado entre barras del mismo grupo
				// Espacio entre barras del mismo grupo (0 = juntas, 1 = máximo espacio)
			}
		});
	}

	function processTradesByWeekday(trades: FormattedTrade[]) {
		const dayStats = {
			winners: [0, 0, 0, 0, 0, 0, 0],
			losers: [0, 0, 0, 0, 0, 0, 0]
		};

		trades.forEach((trade) => {
			const dateParts = trade.fecha_cierre.split(' ')[0].split('/');
			const day = parseInt(dateParts[0]);
			const month = parseInt(dateParts[1]) - 1;
			const year = parseInt(dateParts[2]);
			const date = new Date(year, month, day);
			const weekday = date.getDay();

			if (trade.neto >= 0) {
				dayStats.winners[weekday]++;
			} else {
				dayStats.losers[weekday]++;
			}
		});

		return {
			days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
			winners: dayStats.winners.slice(1, 6),
			losers: dayStats.losers.slice(1, 6)
		};
	}
</script>

<div class="h-auto max-h-96 rounded-sm bg-gray-200">
	<p class="px-1 pt-2 text-sm select-none">Rendimiento por Día</p>
	<div class="m-1 bg-white">
		<canvas id="performanceChart" class="h-80 w-full"></canvas>
	</div>
</div>
