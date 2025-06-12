<script lang="ts">
	import { updateIAResume } from '$lib/stores/iaResume';
	import type { FormattedTrade } from '$lib/interfaces/trades';

	export let trades: FormattedTrade[] = [];

	let wins: number = 0;
	let losses: number = 0;
	let total: number = 0;
	let balance: number = 0;
	let winRateValue: number = 0;
	let tradesPerDay: number = 0;
	let totalProfit: number = 0;
	let totalLoss: number = 0;
	let netProfit: number = 0;
	let totalCommissions: number = 0;

	$: {
		const stats = {
			wins: 0,
			losses: 0,
			total: 0,
			balance: 0,
			tradesPerDay: 0,
			totalProfit: 0,
			totalLoss: 0,
			netProfit: 0,
			totalCommissions: 0,
		};

		if (trades.length > 0) {
			trades.forEach((trade) => {
				if (trade.neto > 0) {
					stats.wins++;
					stats.totalProfit += trade.neto;
				} else if (trade.neto < 0) {
					stats.losses++;
					stats.totalLoss += Math.abs(trade.neto);
				}
				stats.totalCommissions += trade.comision || 0; // Sumar comisiones
			});

			stats.total = trades.length;
			stats.balance = trades[trades.length - 1].saldo;
			stats.netProfit = stats.totalProfit - stats.totalLoss;

			const uniqueDays = new Set(trades.map((trade) => trade.fecha_cierre.split(' ')[0])).size;
			stats.tradesPerDay = uniqueDays > 0 ? Math.round(trades.length / uniqueDays) : 0;
		}

		wins = stats.wins;
		losses = stats.losses;
		total = stats.total;
		balance = stats.balance;
		winRateValue = wins + losses > 0 ? (wins / trades.length) * 100 : 0;
		tradesPerDay = stats.tradesPerDay;
		totalProfit = stats.totalProfit;
		totalLoss = stats.totalLoss;
		netProfit = stats.netProfit;
		totalCommissions = stats.totalCommissions; // Nuevo

		generateIAResume();
	}

	$: formattedBalance = balance.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	$: winRateDisplay = winRateValue.toFixed(1) + '%';

	function generateIAResume() {
		if (trades.length === 0) {
			updateIAResume('tradesCount', 'No hay datos de trades disponibles');
			return;
		}
		const tradingDays = new Set(trades.map(trade => trade.fecha_cierre.split(' ')[0])).size;
		
		const firstDate = new Date(trades[0].fecha_cierre.split(' ')[0].split('/').reverse().join('-'));
		const lastDate = new Date(trades[trades.length - 1].fecha_cierre.split(' ')[0].split('/').reverse().join('-'));
		const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		
		const initialBalance = trades[0].saldo - trades[0].neto; 
		const finalBalance = trades[trades.length - 1].saldo;
		
		const profitPercentage = (netProfit / (totalProfit + totalLoss)) * 100;
		
		const resume = `
RESUMEN RÁPIDO:
- Rango de fechas: ${trades[0].fecha_cierre.split(' ')[0]} hasta ${trades[trades.length - 1].fecha_cierre.split(' ')[0]}
- Días en total del rango de fechas: ${totalDays}
- Días de trading activos: ${tradingDays} (${Math.round((tradingDays / totalDays) * 100)}% del periodo)
- Balance inicial: $${initialBalance.toFixed(2)}
- Balance final: $${finalBalance.toFixed(2)}
- Ganancias totales: $${totalProfit.toFixed(2)} (${(totalProfit / initialBalance * 100).toFixed(2)}%)
- Pérdidas totales: $${totalLoss.toFixed(2)} (${(totalLoss / initialBalance * 100).toFixed(2)}%)
- Comisiones totales: $${totalCommissions.toFixed(2)} (${(totalCommissions / initialBalance * 100).toFixed(2)}%)
- Comisión promedio por trade: $${(totalCommissions / total).toFixed(2)}
- Ganancia neta: $${netProfit.toFixed(2)} (${profitPercentage.toFixed(2)}% de efectividad), incluye comisiones
- Trades por día (average): ${tradesPerDay}
`;

		updateIAResume('tradesCount', resume);
	}
</script>

<div class="flex w-full items-center justify-between bg-white px-4 py-3">
	<div>
		<div class="font-mono text-gray-600">
			Desde: {trades.length > 0 ? trades[0].fecha_cierre.split(' ')[0] : 'N/A'}, Hasta: {trades.length > 0
				? trades[trades.length - 1].fecha_cierre.split(' ')[0]
				: 'N/A'}
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-gray-700">
				Saldo: <span class="text-base font-semibold">
					{formattedBalance}
				</span>
			</span>
			<span class="text-sm font-medium text-gray-700">
				<span class="text-sm {netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
					(${netProfit.toFixed(2)}, {(netProfit / (trades[0].saldo - trades[0].neto) * 100).toFixed(2)}%)
				</span>
			</span>
		</div>
	</div>

	<div class="flex items-center gap-3">
		<div
			data-tooltip="Trades por día: {tradesPerDay === 0
				? 'Sin trades registrados'
				: tradesPerDay <= 3
					? 'disciplinado (1-3)'
					: tradesPerDay <= 5
						? 'rango aceptable (4-5)'
						: 'overtrading (6+)'}"
			class="flex items-center gap-1 rounded px-2 py-1 {tradesPerDay === 0
				? ''
				: tradesPerDay <= 3
					? 'bg-green-50'
					: tradesPerDay <= 5
						? 'bg-blue-50'
						: 'bg-red-50'}"
		>
			<span class="text-sm font-medium text-gray-700"
				>Trades por día: <span
					class="text-sm font-semibold {tradesPerDay === 0
						? 'text-gray-600'
						: tradesPerDay <= 3
							? 'text-green-600'
							: tradesPerDay <= 5
								? 'text-blue-600'
								: 'text-red-600'} text-right"
				>
					{tradesPerDay}
				</span></span
			>
		</div>

		<div class="h-4 w-px bg-gray-200"></div>

		<div data-tooltip="Wins" class="flex items-center gap-1">
			<span class="text-sm font-medium text-gray-700"
				>W: <span class="text-right text-sm font-semibold text-green-600">{wins}</span></span
			>
		</div>

		<div class="h-4 w-px bg-gray-200"></div>

		<div data-tooltip="Loses" class="flex items-center gap-1">
			<span class="text-sm font-medium text-gray-700"
				>L: <span class="text-right text-sm font-semibold text-red-600">{losses}</span></span
			>
		</div>

		<div class="h-4 w-px bg-gray-200"></div>

		<div data-tooltip="Total" class="flex items-center gap-1">
			<span class="text-sm font-medium text-gray-700"
				>T: <span class="text-right text-sm font-semibold text-gray-800">{total}</span></span
			>
		</div>

		<div class="h-4 w-px bg-gray-200"></div>

		<div
			data-tooltip="Win rate: {winRateValue >= 50 && winRateValue < 60
				? 'rango optimo'
				: winRateValue >= 60
					? 'rango excelente'
					: 'menor al 50%'}"
			class="flex items-center gap-1 rounded px-2 py-1 {winRateValue >= 50 && winRateValue < 60
				? 'bg-blue-50'
				: winRateValue >= 60
					? 'bg-green-50'
					: 'bg-red-50'}"
		>
			<span class="text-sm font-medium text-gray-700"
				>WR: <span
					class="text-sm font-semibold {winRateValue >= 50 && winRateValue < 60
						? 'text-blue-600'
						: winRateValue >= 60
							? 'text-green-600'
							: 'text-red-500'}"
				>
					{winRateDisplay}
				</span></span
			>
		</div>

		<div class="h-4 w-px bg-gray-200"></div>

		<div 
			data-tooltip="Avg: ${(totalCommissions / total).toFixed(2)}"
			class="flex items-center gap-1"
		>
			<span class="text-sm font-medium text-gray-700"
				>Comisiones: <span class="text-right text-sm font-semibold text-gray-800">${totalCommissions.toFixed()}</span></span
			>
		</div>
	</div>
</div>