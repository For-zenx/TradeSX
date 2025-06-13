<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { FormattedTrade } from '$lib/interfaces/trades';
	import { updateIAResume } from '$lib/stores/iaResume';

	export let trades: FormattedTrade[] = [];
	let chart: Chart;

	onMount(() => {
		renderChart();
		return () => chart?.destroy();
	});

	$: if (trades.length > 0) {
		if (chart) chart.destroy();
		renderChart();
		generateIAResume();
	}

	function renderChart() {
		const ctx = document.getElementById('capitalChart') as HTMLCanvasElement | null;
		if (!ctx) return;

		const processedData = processTrades(trades);

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: processedData.dates,
				datasets: [
					{
						label: 'Saldo',
						data: processedData.balances,
						borderColor: '#4CAF50',
						backgroundColor: 'transparent',
						borderWidth: 2,
						pointRadius: 0,
						pointHoverRadius: 5,
						tension: 0.1
					},
					{
						label: 'Rango diario',
						data: processedData.maxBalances,
						borderColor: 'rgba(120, 120, 120, 0.3)',
						backgroundColor: 'rgba(120, 120, 120, 0.1)',
						borderWidth: 1,
						pointRadius: 0,
						fill: '+1',
						tension: 0.1
					},
					{
						label: 'Mínimo diario',
						data: processedData.minBalances,
						borderColor: 'rgba(120, 120, 120, 0.3)',
						backgroundColor: 'rgba(120, 120, 120, 0.1)',
						borderWidth: 1,
						pointRadius: 0,
						tension: 0.1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							title: (context) => processedData.dates[context[0].dataIndex]
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: {
							color: '#666',
							maxTicksLimit: 10,
							callback: function (this: any, val: any, index: number) {
								return index % Math.ceil(processedData.dates.length / 10) === 0
									? this.getLabelForValue(val)
									: '';
							}
						}
					},
					y: {
						position: 'right',
						grid: { color: 'rgba(0, 0, 0, 0.05)' },
						ticks: {
							color: '#666',
							callback: (value: any) => '$ ' + Number(value).toLocaleString('en-US')
						}
					}
				},
				interaction: {
					mode: 'nearest',
					axis: 'x',
					intersect: false
				}
			}
		});
	}

	function processTrades(trades: FormattedTrade[]) {
		const dailyData: Record<
			string,
			{
				date: string;
				balances: number[];
				formattedDate: string;
			}
		> = {};

		trades.forEach((trade) => {
			const [day, month, year] = trade.fecha_cierre.split(' ')[0].split('/');
			const dateKey = `${year}-${month}-${day}`;
			const formattedDate = `${day} ${getMonthName(parseInt(month))}`;

			if (!dailyData[dateKey]) {
				dailyData[dateKey] = {
					date: dateKey,
					formattedDate,
					balances: []
				};
			}

			dailyData[dateKey].balances.push(trade.saldo);
		});

		const sortedDays = Object.values(dailyData).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		return {
			dates: sortedDays.map((day) => day.formattedDate),
			balances: sortedDays.map((day) => {
				const lastBalance = day.balances[day.balances.length - 1];
				return lastBalance;
			}),
			minBalances: sortedDays.map((day) => Math.min(...day.balances)),
			maxBalances: sortedDays.map((day) => Math.max(...day.balances))
		};
	}

	function getMonthName(month: number) {
		const months = [
			'Ene',
			'Feb',
			'Mar',
			'Abr',
			'May',
			'Jun',
			'Jul',
			'Ago',
			'Sep',
			'Oct',
			'Nov',
			'Dic'
		];
		return months[month - 1] || '';
	}

	function generateCapitalASCII(processedData: ReturnType<typeof processTrades>) {
		if (processedData.dates.length === 0) return 'No hay datos suficientes';

		// Configuración
		const width = 50; // Ancho fijo para simplificar
		const height = 10;
		const riskZones = { high: 0.05, medium: 0.03 };

		const step = Math.max(1, Math.ceil(processedData.dates.length / width));
		const simplifiedData = {
			dates: [] as string[],
			balances: [] as number[],
			mins: [] as number[],
			maxs: [] as number[],
			drawdowns: [] as number[]
		};

		let peak = processedData.balances[0];
		for (let i = 0; i < processedData.dates.length; i += step) {
			simplifiedData.dates.push(processedData.dates[i]);
			simplifiedData.balances.push(processedData.balances[i]);
			simplifiedData.mins.push(processedData.minBalances[i]);
			simplifiedData.maxs.push(processedData.maxBalances[i]);

			peak = Math.max(peak, processedData.balances[i]);
			const dd = (peak - processedData.balances[i]) / peak;
			simplifiedData.drawdowns.push(dd);
		}
		if (!simplifiedData.dates.includes(processedData.dates.slice(-1)[0])) {
			const lastIdx = processedData.dates.length - 1;
			simplifiedData.dates.push(processedData.dates[lastIdx]);
			simplifiedData.balances.push(processedData.balances[lastIdx]);
			simplifiedData.mins.push(processedData.minBalances[lastIdx]);
			simplifiedData.maxs.push(processedData.maxBalances[lastIdx]);
			const dd = (peak - processedData.balances[lastIdx]) / peak;
			simplifiedData.drawdowns.push(dd);
		}

		const minVal = Math.min(...simplifiedData.mins);
		const maxVal = Math.max(...simplifiedData.maxs);
		const range = maxVal - minVal || 1;
		const normalize = (value: number) => Math.round(((value - minVal) / range) * (height - 1));

		const graph = Array(height)
			.fill(null)
			.map(() => Array(simplifiedData.dates.length).fill(' '));

		for (let x = 0; x < simplifiedData.dates.length; x++) {
			const top = normalize(simplifiedData.maxs[x]);
			const bottom = normalize(simplifiedData.mins[x]);
			if ((simplifiedData.maxs[x] - simplifiedData.mins[x]) / maxVal > 0.02) {
				for (let y = bottom; y <= top; y++) graph[y][x] = '·';
			}

			const y = normalize(simplifiedData.balances[x]);
			graph[y][x] =
				simplifiedData.drawdowns[x] >= riskZones.high
					? '‼'
					: simplifiedData.drawdowns[x] >= riskZones.medium
						? '!'
						: 'o';

			if (x > 0) {
				const prevY = normalize(simplifiedData.balances[x - 1]);
				const dir = prevY < y ? 1 : -1;
				for (let cy = prevY; cy !== y; cy += dir) {
					if (graph[cy][x] === ' ') graph[cy][x] = '|';
				}
			}
		}

		let asciiChart = 'CAPITAL CHART (Balance vs Tiempo)\n↑\n';

		for (let y = height - 1; y >= 0; y--) {
			const yValue = minVal + (y / (height - 1)) * range;
			asciiChart += `$${Math.round(yValue)}`.padStart(6) + ' | ' + graph[y].join('') + '\n';
		}

		const startDate = simplifiedData.dates[0];
		const endDate = simplifiedData.dates.slice(-1)[0];
		asciiChart += '      +-' + '-'.repeat(simplifiedData.dates.length) + '→\n';
		asciiChart += `       ${(startDate)}${' '.repeat(simplifiedData.dates.length - 12)}${(endDate)}\n`;

		// Leyenda
		const maxDD = (Math.max(...simplifiedData.drawdowns) * 100).toFixed(1);
		asciiChart += `\nLEYENDA: 'o'=Close | '·'=Range | '!'=3-5% DD | '‼'=>5% DD`;
		asciiChart += `\nPeriodo: ${startDate} hasta ${endDate}`;
		asciiChart += `\nPico: $${Math.round(maxVal)} | Min: $${Math.round(minVal)}`;

		return asciiChart;
	}

	function generateIAResume() {
		if (trades.length === 0) {
			updateIAResume('capitalChart', 'No hay datos de capital disponibles');
			return;
		}

		const processedData = processTrades(trades);
		const asciiChart = generateCapitalASCII(processedData);

		// Información adicional para la IA
		const initialBalance = processedData.balances[0];
		const finalBalance = processedData.balances[processedData.balances.length - 1];
		const profit = finalBalance - initialBalance;
		const profitPercentage = (profit / initialBalance) * 100;

		const resume = `REPRESENTACIÓN DEL CAPITAL:\n${asciiChart}`;

		updateIAResume('capitalChart', resume);
	}
</script>

<div class="h-auto max-h-96 rounded-sm bg-gray-200">
	<p class="px-1 pt-2 text-sm select-none">Capital</p>
	<div class="m-1 bg-white">
		<canvas id="capitalChart" class="h-80 w-full"></canvas>
	</div>
</div>
