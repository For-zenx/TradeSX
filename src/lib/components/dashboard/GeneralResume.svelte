<script lang="ts">
	import type { FormattedTrade } from '$lib/interfaces/trades';
	import { updateIAResume } from '$lib/stores/iaResume';

	export let trades: FormattedTrade[] = [];

	let metrics = {
		totalNet: 0,
		longNet: 0,
		shortNet: 0,
		profitFactor: 0,
		longProfitFactor: 0,
		shortProfitFactor: 0,
		winRate: 0,
		longWinRate: 0,
		shortWinRate: 0,
		riskRewardRatio: 0,
		longRiskReward: 0,
		shortRiskReward: 0,
		firstTradeWinRate: 0,
		longFirstTradeWinRate: 0,
		shortFirstTradeWinRate: 0,
		maxWin: 0,
		maxLoss: 0,
		totalTrades: 0,
		longTrades: 0,
		shortTrades: 0,
		avgTradeDuration: 0,
		longAvgTradeDuration: 0,
		shortAvgTradeDuration: 0
	};
	
	$: {
		metrics = calculateMetrics(trades);
		generateIAResume();
	}


	function calculateMetrics(trades: FormattedTrade[]) {
		if (trades.length === 0) {
			return {
				totalNet: 0,
				longNet: 0,
				shortNet: 0,
				profitFactor: 0,
				longProfitFactor: 0,
				shortProfitFactor: 0,
				winRate: 0,
				longWinRate: 0,
				shortWinRate: 0,
				riskRewardRatio: 0,
				longRiskReward: 0,
				shortRiskReward: 0,
				firstTradeWinRate: 0,
				longFirstTradeWinRate: 0,
				shortFirstTradeWinRate: 0,
				maxWin: 0,
				maxLoss: 0,
				totalTrades: 0,
				longTrades: 0,
				shortTrades: 0,
				avgTradeDuration: 0,
				longAvgTradeDuration: 0,
				shortAvgTradeDuration: 0
			};
		}

		const longTrades = trades.filter((t) => t.direccion === 'Comprar');
		const shortTrades = trades.filter((t) => t.direccion === 'Vender');
		const winningTrades = trades.filter((t) => t.neto > 0);
		const losingTrades = trades.filter((t) => t.neto < 0);
		const longWinning = longTrades.filter((t) => t.neto > 0);
		const longLosing = longTrades.filter((t) => t.neto < 0);
		const shortWinning = shortTrades.filter((t) => t.neto > 0);
		const shortLosing = shortTrades.filter((t) => t.neto < 0);

		// Función robusta para parsear fechas
		const parseDate = (dateStr: string) => {
			const [datePart, timePart] = dateStr.split(' ');
			const [day, month, year] = datePart.split('/');
			return new Date(`${month}/${day}/${year} ${timePart}`);
		};

		// Calcular duraciones
		const calculateDurations = (tradeList: FormattedTrade[]) => {
			if (tradeList.length === 0) return 0;
			const totalMinutes = tradeList.reduce((sum, t) => {
				const open = parseDate(t.fecha_apertura);
				const close = parseDate(t.fecha_cierre);
				return sum + (close.getTime() - open.getTime()) / (1000 * 60);
			}, 0);
			return totalMinutes / tradeList.length;
		};

		const calculateFirstTradeWinRate = () => {
			const tradesByDay: {[key: string]: FormattedTrade[]} = {};
			
			trades.forEach(trade => {
				const date = trade.fecha_apertura.split(' ')[0];
				if (!tradesByDay[date]) {
					tradesByDay[date] = [];
				}
				tradesByDay[date].push(trade);
			});

			let firstTrades: FormattedTrade[] = [];
			let longFirstTrades: FormattedTrade[] = [];
			let shortFirstTrades: FormattedTrade[] = [];
			
			Object.values(tradesByDay).forEach(dayTrades => {
				if (dayTrades.length > 0) {
					dayTrades.sort((a, b) => {
						const timeA = parseDate(a.fecha_apertura).getTime();
						const timeB = parseDate(b.fecha_apertura).getTime();
						return timeA - timeB;
					});
					
					const firstTrade = dayTrades[0];
					firstTrades.push(firstTrade);
					
					if (firstTrade.direccion === 'Comprar') {
						longFirstTrades.push(firstTrade);
					} else {
						shortFirstTrades.push(firstTrade);
					}
				}
			});

			const winningFirstTrades = firstTrades.filter(t => t.neto > 0);
			const firstTradeWinRate = firstTrades.length > 0 ? (winningFirstTrades.length / firstTrades.length) * 100 : 0;
			
			const longWinningFirst = longFirstTrades.filter(t => t.neto > 0);
			const longFirstTradeWinRate = longFirstTrades.length > 0 ? (longWinningFirst.length / longFirstTrades.length) * 100 : 0;
			
			const shortWinningFirst = shortFirstTrades.filter(t => t.neto > 0);
			const shortFirstTradeWinRate = shortFirstTrades.length > 0 ? (shortWinningFirst.length / shortFirstTrades.length) * 100 : 0;

			return {
				firstTradeWinRate,
				longFirstTradeWinRate,
				shortFirstTradeWinRate
			};
		};

		const totalNet = trades.reduce((sum, t) => sum + t.neto, 0);
		const longNet = longTrades.reduce((sum, t) => sum + t.neto, 0);
		const shortNet = shortTrades.reduce((sum, t) => sum + t.neto, 0);

		const totalProfit = winningTrades.reduce((sum, t) => sum + t.neto, 0);
		const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.neto, 0));
		const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

		const longProfit = longWinning.reduce((sum, t) => sum + t.neto, 0);
		const longLoss = Math.abs(longLosing.reduce((sum, t) => sum + t.neto, 0));
		const longProfitFactor = longLoss > 0 ? longProfit / longLoss : 0;

		const shortProfit = shortWinning.reduce((sum, t) => sum + t.neto, 0);
		const shortLoss = Math.abs(shortLosing.reduce((sum, t) => sum + t.neto, 0));
		const shortProfitFactor = shortLoss > 0 ? shortProfit / shortLoss : 0;

		const winRate = (winningTrades.length / trades.length) * 100;
		const longWinRate = longTrades.length > 0 ? (longWinning.length / longTrades.length) * 100 : 0;
		const shortWinRate =
			shortTrades.length > 0 ? (shortWinning.length / shortTrades.length) * 100 : 0;

		const avgWin =
			winningTrades.length > 0
				? winningTrades.reduce((sum, t) => sum + t.neto, 0) / winningTrades.length
				: 0;
		const avgLoss =
			losingTrades.length > 0
				? Math.abs(losingTrades.reduce((sum, t) => sum + t.neto, 0)) / losingTrades.length
				: 0;
		const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

		const longAvgWin =
			longWinning.length > 0
				? longWinning.reduce((sum, t) => sum + t.neto, 0) / longWinning.length
				: 0;
		const longAvgLoss =
			longLosing.length > 0
				? Math.abs(longLosing.reduce((sum, t) => sum + t.neto, 0)) / longLosing.length
				: 0;
		const longRiskReward = longAvgLoss > 0 ? longAvgWin / longAvgLoss : 0;

		const shortAvgWin =
			shortWinning.length > 0
				? shortWinning.reduce((sum, t) => sum + t.neto, 0) / shortWinning.length
				: 0;
		const shortAvgLoss =
			shortLosing.length > 0
				? Math.abs(shortLosing.reduce((sum, t) => sum + t.neto, 0)) / shortLosing.length
				: 0;
		const shortRiskReward = shortAvgLoss > 0 ? shortAvgWin / shortAvgLoss : 0;

		const maxWin = Math.max(...trades.map((t) => t.neto), 0);
		const maxLoss = Math.min(...trades.map((t) => t.neto), 0);

		const { firstTradeWinRate, longFirstTradeWinRate, shortFirstTradeWinRate } = calculateFirstTradeWinRate();

		return {
			totalNet,
			longNet,
			shortNet,
			profitFactor,
			longProfitFactor,
			shortProfitFactor,
			winRate,
			longWinRate,
			shortWinRate,
			riskRewardRatio,
			longRiskReward,
			shortRiskReward,
			firstTradeWinRate,
			longFirstTradeWinRate,
			shortFirstTradeWinRate,
			maxWin,
			maxLoss,
			totalTrades: trades.length,
			longTrades: longTrades.length,
			shortTrades: shortTrades.length,
			avgTradeDuration: calculateDurations(trades),
			longAvgTradeDuration: calculateDurations(longTrades),
			shortAvgTradeDuration: calculateDurations(shortTrades)
		};
	}

    function generateIAResume() {
        if (trades.length === 0) {
            updateIAResume('generalResume', 'No hay datos de trades disponibles');
            return;
        }

        const resume = `ESTADÍSTICAS GENERALES:
- Operaciones totales: ${metrics.totalTrades}
  - Operaciones largas: ${metrics.longTrades} (${(metrics.longTrades/metrics.totalTrades*100).toFixed(1)}%)
  - Operaciones cortas: ${metrics.shortTrades} (${(metrics.shortTrades/metrics.totalTrades*100).toFixed(1)}%)
- Beneficio neto: $${metrics.totalNet.toFixed(2)}
  - Neto en largas: $${metrics.longNet.toFixed(2)}
  - Neto en cortas: $${metrics.shortNet.toFixed(2)}
- Máxima ganancia: $${metrics.maxWin.toFixed(2)}
- Máxima pérdida: $${metrics.maxLoss.toFixed(2)}

MÉTRICAS DE RENDIMIENTO:
- Tasa de aciertos: ${metrics.winRate.toFixed(1)}%
  - Aciertos en largas: ${metrics.longWinRate.toFixed(1)}%
  - Aciertos en cortas: ${metrics.shortWinRate.toFixed(1)}%
- Tasa de aciertos primera operación del día: ${metrics.firstTradeWinRate.toFixed(1)}%
  - Acierto en la primera operación del día en largas: ${metrics.longFirstTradeWinRate.toFixed(1)}%
  - Acierto en la primera operación del día en cortas: ${metrics.shortFirstTradeWinRate.toFixed(1)}%
- Factor de beneficio: ${metrics.profitFactor.toFixed(2)}
  - Factor en largas: ${metrics.longProfitFactor.toFixed(2)}
  - Factor en cortas: ${metrics.shortProfitFactor.toFixed(2)}
- Ratio riesgo/beneficio: ${metrics.riskRewardRatio.toFixed(2)}
  - Ratio en largas: ${metrics.longRiskReward.toFixed(2)}
  - Ratio en cortas: ${metrics.shortRiskReward.toFixed(2)}

CARACTERÍSTICAS DE LAS OPERACIONES:
- Duración promedio: ${metrics.avgTradeDuration.toFixed(2)} minutos
  - Duración en largas: ${metrics.longAvgTradeDuration.toFixed(2)} minutos
  - Duración en cortas: ${metrics.shortAvgTradeDuration.toFixed(2)} minutos
`;

        updateIAResume('generalResume', resume);
    }
</script>

<div class="col-span-2 h-auto rounded-sm bg-gray-200">
	<p class="px-1 pt-2 text-sm">Resumen general</p>
	<div class="m-1 overflow-x-auto bg-white p-2">
		<table class="min-w-full divide-y divide-gray-200">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					></th>
					<th class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Todas</th
					>
					<th class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Largas</th
					>
					<th class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Cortas</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				<tr>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Beneficio Neto</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.totalNet.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.longNet.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.shortNet.toFixed(2)}</td
					>
				</tr>
				<tr>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Factor de Beneficio</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.profitFactor.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.longProfitFactor.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.shortProfitFactor.toFixed(2)}</td
					>
				</tr>
				<tr>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Win Rate (%)</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.winRate.toFixed(1)}%</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.longWinRate.toFixed(1)}%</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.shortWinRate.toFixed(1)}%</td
					>
				</tr>
				<tr>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Ratio Riesgo/Beneficio</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.riskRewardRatio.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.longRiskReward.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.shortRiskReward.toFixed(2)}</td
					>
				</tr>
				<tr>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Winrate primera operación del día (%)</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.firstTradeWinRate.toFixed(1)}%</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.longFirstTradeWinRate.toFixed(1)}%</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.shortFirstTradeWinRate.toFixed(1)}%</td
					>
				</tr>
				<tr>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Total Operaciones</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">{metrics.totalTrades}</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">{metrics.longTrades}</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">{metrics.shortTrades}</td>
				</tr>
				<tr>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900">Duración Promedio (min)</td>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.avgTradeDuration.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.longAvgTradeDuration.toFixed(2)}</td
					>
					<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-900"
						>{metrics.shortAvgTradeDuration.toFixed(2)}</td
					>
				</tr>
			</tbody>
		</table>
	</div>
</div>
