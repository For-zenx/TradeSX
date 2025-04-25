<script lang="ts">
	import type { FormattedTrade } from '$lib/interfaces/trades';

	export let trades: FormattedTrade[] = [];

	let wins: number = 0;
	let losses: number = 0;
	let total: number = 0;
	let balance: number = 0;
	let winRateValue: number = 0;
	let tradesPerDay: number = 0;

	$: {
		const stats = {
			wins: 0,
			losses: 0,
			total: 0,
			balance: 0,
			tradesPerDay: 0
		};

		if (trades.length > 0) {
			trades.forEach((trade) => {
				if (trade.neto > 0) stats.wins++;
				else if (trade.neto < 0) stats.losses++;
			});

			stats.total = trades.length;
			stats.balance = trades[trades.length - 1].saldo;

			const uniqueDays = new Set(trades.map((trade) => trade.fecha_cierre.split(' ')[0])).size;

			stats.tradesPerDay = uniqueDays > 0 ? Math.round(trades.length / uniqueDays) : 0;
		}

		wins = stats.wins;
		losses = stats.losses;
		total = stats.total;
		balance = stats.balance;
		winRateValue = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
		tradesPerDay = stats.tradesPerDay;
	}

	$: formattedBalance = balance.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	$: winRateDisplay = winRateValue.toFixed(1) + '%';
</script>

<div class="flex w-full items-center justify-between bg-white px-4 py-3">
	<div>
		<div class="font-mono text-gray-600">
			Desde: {trades.length > 0 ? trades[0].fecha_cierre.split(' ')[0] : 'N/A'}, Hasta: {trades.length >
			0
				? trades[trades.length - 1].fecha_cierre.split(' ')[0]
				: 'N/A'}
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-gray-700"
				>Saldo: <span
					class="text-base font-semibold {balance >= 0 ? 'text-green-600' : 'text-red-600'}"
				>
					{formattedBalance}
				</span></span
			>
		</div>
	</div>

	<div class="flex items-center gap-3">
		<div
			data-tooltip="Trades por día: {tradesPerDay === 0
				? 'Sin trades registrados'
				: tradesPerDay <= 3
					? 'Rango óptimo (1-3)'
					: tradesPerDay <= 5
						? 'Rango aceptable (4-5)'
						: 'Posible overtrading (6+)'}"
			class="flex items-center gap-1 rounded px-2 py-1 {tradesPerDay === 0
				? ''
				: tradesPerDay <= 3
					? 'bg-green-50'
					: tradesPerDay <= 5
						? 'bg-blue-50'
						: 'bg-red-50'}"
		>
			<span class="text-sm font-medium text-gray-700"
				>T/D: <span
					class="text-sm font-semibold {tradesPerDay === 0
						? 'text-gray-600'
						: tradesPerDay <= 3
							? 'text-blue-50'
							: tradesPerDay <= 5
								? 'text-yellow-600'
								: 'text-red-500'} text-right"
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
			data-tooltip="Win rate: {winRateValue >= 50
				? 'Rango optimo'
				: winRateValue >= 60
					? 'Rango excelente'
					: 'menor al 50%'}"
			class="flex items-center gap-1 rounded px-2 py-1 {winRateValue >= 50
				? 'bg-blue-50'
				: winRateValue >= 60
					? 'bg-green-50'
					: 'bg-red-50'}"
		>
			<span class="text-sm font-medium text-gray-700"
				>WR: <span
					class="text-sm font-semibold {winRateValue >= 50
						? 'text-blue-600'
						: winRateValue >= 60
							? 'text-green-600'
							: 'text-red-500'}"
				>
					{winRateDisplay}
				</span></span
			>
		</div>
	</div>
</div>
