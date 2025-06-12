<script lang="ts">
	import type { FormattedTrade } from '$lib/interfaces/trades';
	import { updateIAResume } from '$lib/stores/iaResume';

	type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

	interface TradeDay {
		date: string;
		profitAmount: number;
		profitPercentage: number;
		winningTrades: number;
		losingTrades: number;
		totalTrades: number;
	}

	interface TradingWeek {
		weekNumber: number;
		initialBalance: number;
		days: Partial<Record<Weekday, TradeDay>>;
		weekSummary: {
			totalProfitAmount: number;
			totalProfitPercentage: number;
			totalWinningTrades: number;
			totalLosingTrades: number;
			totalTrades: number;
		};
	}

	const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

	export let trades: FormattedTrade[] = [];

	let weeklyData: TradingWeek[] = [];

	function getWeekNumber(date: Date): number {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
		const week1 = new Date(d.getFullYear(), 0, 4);
		return (
			1 +
			Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
		);
	}

	function parseTradeDate(dateStr: string): Date {
		const [datePart] = dateStr.split(' ');
		const [day, month, year] = datePart.split('/').map(Number);
		return new Date(year, month - 1, day);
	}

	function createNewWeek(trade: FormattedTrade, weekNumber: number): TradingWeek {
		return {
			weekNumber,
			initialBalance: trade.saldo - trade.neto,
			days: {},
			weekSummary: {
				totalProfitAmount: 0,
				totalProfitPercentage: 0,
				totalWinningTrades: 0,
				totalLosingTrades: 0,
				totalTrades: 0
			}
		};
	}

	function createNewDay(day: number, month: number): TradeDay {
		return {
			date: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`,
			profitAmount: 0,
			profitPercentage: 0,
			winningTrades: 0,
			losingTrades: 0,
			totalTrades: 0
		};
	}

	function processTrade(trade: FormattedTrade, weeksMap: Map<number, TradingWeek>) {
		const tradeDate = parseTradeDate(trade.fecha_apertura);
		const weekNumber = getWeekNumber(tradeDate);
		const weekdayIndex = tradeDate.getDay(); // 0=Domingo, 1=Lunes, etc.

		// Solo procesamos días de semana (Lunes a Viernes)
		if (weekdayIndex >= 1 && weekdayIndex <= 5) {
			const dayKey = WEEKDAYS[weekdayIndex - 1];

			if (!weeksMap.has(weekNumber)) {
				weeksMap.set(weekNumber, createNewWeek(trade, weekNumber));
			}
			const week = weeksMap.get(weekNumber)!;

			if (!week.days[dayKey]) {
				const [day, month] = trade.fecha_apertura.split(' ')[0].split('/').map(Number);
				week.days[dayKey] = createNewDay(day, month);
			}
			const day = week.days[dayKey]!;

			updateTradeMetrics(trade, day, week);
		}
	}

	function updateTradeMetrics(trade: FormattedTrade, day: TradeDay, week: TradingWeek) {
		day.totalTrades++;
		week.weekSummary.totalTrades++;

		if (trade.neto >= 0) {
			day.winningTrades++;
			week.weekSummary.totalWinningTrades++;
		} else {
			day.losingTrades++;
			week.weekSummary.totalLosingTrades++;
		}

		day.profitAmount += trade.neto;
		week.weekSummary.totalProfitAmount += trade.neto;
	}

	function calculatePercentages(weeksMap: Map<number, TradingWeek>) {
		weeksMap.forEach((week) => {
			// Calcular porcentaje semanal
			week.weekSummary.totalProfitPercentage =
				(week.weekSummary.totalProfitAmount / week.initialBalance) * 100;

			// Calcular porcentajes diarios
			WEEKDAYS.forEach((dayKey) => {
				const day = week.days[dayKey];
				if (day) {
					day.profitPercentage = (day.profitAmount / week.initialBalance) * 100;
				}
			});
		});
	}

	// ===== LÓGICA PRINCIPAL =====
	$: {
			weeklyData = (() => {
			if (trades.length === 0) return [];

			// 1. Ordenar trades por fecha
			const sortedTrades = [...trades].sort(
				(a, b) =>
					parseTradeDate(a.fecha_apertura).getTime() - parseTradeDate(b.fecha_apertura).getTime()
			);

			// 2. Procesar trades
			const weeksMap = new Map<number, TradingWeek>();
			sortedTrades.forEach((trade) => processTrade(trade, weeksMap));

			// 3. Calcular porcentajes
			calculatePercentages(weeksMap);

			// 4. Ordenar semanas (más reciente primero)
			return Array.from(weeksMap.values()).sort((a, b) => b.weekNumber - a.weekNumber);
		})();
		generateIAResume();
	};

	let weekTooltips: Record<number, boolean> = {};

	function toggleWeekTooltip(weekNumber: number, event: MouseEvent) {
		event.stopPropagation();
		weekTooltips = {
			...weekTooltips,
			[weekNumber]: !weekTooltips[weekNumber]
		};
	}

	function closeAllTooltips() {
		weekTooltips = Object.fromEntries(
			Object.entries(weekTooltips).map(([weekNumber, _]) => [weekNumber, false])
		);
	}

	function generateIAResume() {
		if (weeklyData.length === 0) {
			updateIAResume('weeklySummary', 'No hay datos semanales disponibles');
			return;
		}

		const summary = weeklyData
			.map((week) => {
				// Formatear cada día de la semana
				const daysSummary = WEEKDAYS.map((dayKey) => {
					const day = week.days[dayKey];
					if (!day) return null;

					return `${dayKey.slice(0, 1).toUpperCase()} ${day.date}: ${day.winningTrades}G/${day.losingTrades}P ${day.profitPercentage >= 0 ? '+' : ''}${day.profitPercentage.toFixed(1)}%`;
				})
					.filter(Boolean)
					.join(' | ');

				// Resumen semanal
				return `Semana ${week.weekNumber}:
- Días: ${daysSummary || 'Sin operaciones'}
- Total: ${week.weekSummary.totalWinningTrades}G/${week.weekSummary.totalLosingTrades}P (${((week.weekSummary.totalWinningTrades / week.weekSummary.totalTrades) * 100 || 0).toFixed(1)}% WR)
- Resultado: ${week.weekSummary.totalProfitPercentage >= 0 ? '+' : ''}${week.weekSummary.totalProfitPercentage.toFixed(1)}% (${week.weekSummary.totalTrades} trades)`;
			})
			.join('\n\n');

		updateIAResume('weeklySummary', `RESUMEN SEMANAL:\n${summary}`);
	}
</script>

<svelte:window on:click={closeAllTooltips} />
<div class="col-span-3 h-auto rounded-sm bg-gray-200">
	<div class="flex items-center justify-between px-1 pt-2">
		<p class="text-sm select-none">Calendario semanal</p>
	</div>
	<div class="m-1 bg-white">
		<div class="overflow-x-auto">
			<div class="relative max-h-120 overflow-y-auto">
				<table class="mt-4 w-full border-collapse">
					<!-- Encabezados -->
					<thead class="sticky top-0 z-10 bg-gray-50">
						<tr class="text-gray-700">
							<th class="sticky left-0 z-20 p-1 text-left">
								<div class="rounded border border-gray-400/90 p-2">
									<div class="text-sm">Semanas</div>
								</div>
							</th>
							<th class="p-1 text-left">
								<div class="rounded border border-gray-400/90 p-2">
									<div class="text-sm">Lunes</div>
								</div>
							</th>
							<th class="p-1 text-left">
								<div class="rounded border border-gray-400/90 p-2">
									<div class="text-sm">Martes</div>
								</div>
							</th>
							<th class="p-1 text-left">
								<div class="rounded border border-gray-400/90 p-2">
									<div class="text-sm">Miércoles</div>
								</div>
							</th>
							<th class="p-1 text-left">
								<div class="rounded border border-gray-400/90 p-2">
									<div class="text-sm">Jueves</div>
								</div>
							</th>
							<th class="p-1 text-left">
								<div class="rounded border border-gray-400/90 p-2">
									<div class="text-sm">Viernes</div>
								</div>
							</th>
							<th class="p-1 text-left">
								<div class="rounded border border-gray-400/90 p-2">
									<div class="text-sm">Resultado</div>
								</div>
							</th>
						</tr>
					</thead>

					<!-- Cuerpo de la tabla -->
					<tbody>
						{#each weeklyData as week}
							<tr class="border-b border-gray-200">
								<td class="sticky left-0 z-10 bg-white p-3 font-semibold text-gray-700">
									Semana {week.weekNumber}
								</td>

								<!-- Lunes -->
								<td class="h-32 w-48 p-3">
									{#if week.days.monday}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">{week.days.monday.date}</div>
											<div class="text-center">
												<div
													class="text-xl font-bold {week.days.monday.profitPercentage >= 0
														? 'text-green-600'
														: 'text-red-600'}"
												>
													{week.days.monday.profitPercentage >= 0
														? '+'
														: ''}{week.days.monday.profitPercentage.toFixed(1)}%
												</div>
												<div class="mt-1 text-sm text-gray-600">
													{week.days.monday.winningTrades}G/{week.days.monday.losingTrades}P
												</div>
											</div>
											<div class="text-center text-xs text-gray-400">
												{week.days.monday.totalTrades}
												{week.days.monday.totalTrades === 1 ? 'trade' : 'trades'}
											</div>
										</div>
									{:else}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">-/-</div>
											<div class="py-4 text-center text-gray-400">Sin operaciones</div>
										</div>
									{/if}
								</td>

								<!-- Martes -->
								<td class="h-32 w-48 p-3">
									{#if week.days.tuesday}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">{week.days.tuesday.date}</div>
											<div class="text-center">
												<div
													class="text-xl font-bold {week.days.tuesday.profitPercentage >= 0
														? 'text-green-600'
														: 'text-red-600'}"
												>
													{week.days.tuesday.profitPercentage >= 0
														? '+'
														: ''}{week.days.tuesday.profitPercentage.toFixed(1)}%
												</div>
												<div class="mt-1 text-sm text-gray-600">
													{week.days.tuesday.winningTrades}G/{week.days.tuesday.losingTrades}P
												</div>
											</div>
											<div class="text-center text-xs text-gray-400">
												{week.days.tuesday.totalTrades}
												{week.days.tuesday.totalTrades === 1 ? 'trade' : 'trades'}
											</div>
										</div>
									{:else}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">-/-</div>
											<div class="py-4 text-center text-gray-400">Sin operaciones</div>
										</div>
									{/if}
								</td>

								<!-- Miércoles -->
								<td class="h-32 w-48 p-3">
									{#if week.days.wednesday}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">
												{week.days.wednesday.date}
											</div>
											<div class="text-center">
												<div
													class="text-xl font-bold {week.days.wednesday.profitPercentage >= 0
														? 'text-green-600'
														: 'text-red-600'}"
												>
													{week.days.wednesday.profitPercentage >= 0
														? '+'
														: ''}{week.days.wednesday.profitPercentage.toFixed(1)}%
												</div>
												<div class="mt-1 text-sm text-gray-600">
													{week.days.wednesday.winningTrades}G/{week.days.wednesday.losingTrades}P
												</div>
											</div>
											<div class="text-center text-xs text-gray-400">
												{week.days.wednesday.totalTrades}
												{week.days.wednesday.totalTrades === 1 ? 'trade' : 'trades'}
											</div>
										</div>
									{:else}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">-/-</div>
											<div class="py-4 text-center text-gray-400">Sin operaciones</div>
										</div>
									{/if}
								</td>

								<!-- Jueves -->
								<td class="h-32 w-48 p-3">
									{#if week.days.thursday}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">{week.days.thursday.date}</div>
											<div class="text-center">
												<div
													class="text-xl font-bold {week.days.thursday.profitPercentage >= 0
														? 'text-green-600'
														: 'text-red-600'}"
												>
													{week.days.thursday.profitPercentage >= 0
														? '+'
														: ''}{week.days.thursday.profitPercentage.toFixed(1)}%
												</div>
												<div class="mt-1 text-sm text-gray-600">
													{week.days.thursday.winningTrades}G/{week.days.thursday.losingTrades}P
												</div>
											</div>
											<div class="text-center text-xs text-gray-400">
												{week.days.thursday.totalTrades}
												{week.days.thursday.totalTrades === 1 ? 'trade' : 'trades'}
											</div>
										</div>
									{:else}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">-/-</div>
											<div class="py-4 text-center text-gray-400">Sin operaciones</div>
										</div>
									{/if}
								</td>

								<!-- Viernes -->
								<td class="h-32 w-48 p-3">
									{#if week.days.friday}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">{week.days.friday.date}</div>
											<div class="text-center">
												<div
													class="text-xl font-bold {week.days.friday.profitPercentage >= 0
														? 'text-green-600'
														: 'text-red-600'}"
												>
													{week.days.friday.profitPercentage >= 0
														? '+'
														: ''}{week.days.friday.profitPercentage.toFixed(1)}%
												</div>
												<div class="mt-1 text-sm text-gray-600">
													{week.days.friday.winningTrades}G/{week.days.friday.losingTrades}P
												</div>
											</div>
											<div class="text-center text-xs text-gray-400">
												{week.days.friday.totalTrades}
												{week.days.friday.totalTrades === 1 ? 'trade' : 'trades'}
											</div>
										</div>
									{:else}
										<div
											class="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-3"
										>
											<div class="text-sm font-medium text-gray-500">-/-</div>
											<div class="py-4 text-center text-gray-400">Sin operaciones</div>
										</div>
									{/if}
								</td>

								<td class="p-3">
									<div
										class={`flex h-full flex-col items-center justify-center rounded-lg p-2 ${
											week.weekSummary.totalWinningTrades >= week.weekSummary.totalLosingTrades &&
											week.weekSummary.totalProfitPercentage >= 0 &&
											week.weekSummary.totalTrades <= 16
												? 'border border-green-100 bg-green-50'
												: 'border border-red-100 bg-red-50'
										}`}
									>
										<div class="relative w-full">
											<!-- Botón de información -->
											<button
												class="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 hover:bg-gray-300"
												on:click={(e) => toggleWeekTooltip(week.weekNumber, e)}
											>
												i
											</button>

											<!-- Tooltip -->
											{#if weekTooltips[week.weekNumber]}
												<button
													class="ring-opacity-5 absolute top-6 right-0 z-10 w-48 rounded-md bg-white p-2 text-xs shadow-lg ring-1 ring-black"
													on:click|stopPropagation
												>
													<p class="font-medium">Criterios de evaluación:</p>
													<ul class="mt-1 space-y-1">
														<li
															class={week.weekSummary.totalTrades <= 16
																? 'text-green-600'
																: 'text-red-600'}
														>
															Total trades ≤ 16 ({week.weekSummary.totalTrades}) {week.weekSummary
																.totalTrades <= 16
																? '✓'
																: '✗'}
														</li>
														<li
															class={week.weekSummary.totalProfitPercentage >= 0
																? 'text-green-600'
																: 'text-red-600'}
														>
															Total profit ≥ 0 ({week.weekSummary.totalProfitPercentage.toFixed(
																1
															)}%) {week.weekSummary.totalProfitPercentage >= 0 ? '✓' : '✗'}
														</li>
														<li
															class={week.weekSummary.totalWinningTrades >=
															week.weekSummary.totalLosingTrades
																? 'text-green-600'
																: 'text-red-600'}
														>
															WR ≥ 50% ({(
																(week.weekSummary.totalWinningTrades /
																	week.weekSummary.totalTrades) *
																	100 || 0
															).toFixed(1)}%) {week.weekSummary.totalWinningTrades >=
															week.weekSummary.totalLosingTrades
																? '✓'
																: '✗'}
														</li>
													</ul>
													<p class="mt-2 font-medium">
														Resultado final: {[
															week.weekSummary.totalTrades <= 16,
															week.weekSummary.totalProfitPercentage >= 0,
															week.weekSummary.totalWinningTrades >=
																week.weekSummary.totalLosingTrades
														].filter(Boolean).length}/3
													</p>
												</button>
											{/if}
										</div>

										<div class="text-lg font-semibold text-gray-700">
											{week.weekSummary.totalWinningTrades}G/{week.weekSummary.totalLosingTrades}P
										</div>
										<div
											class={`mt-1 text-sm ${
												week.weekSummary.totalProfitPercentage >= 0
													? 'text-green-600'
													: 'text-red-600'
											}`}
										>
											{week.weekSummary.totalProfitPercentage >= 0
												? '+'
												: ''}{week.weekSummary.totalProfitPercentage.toFixed(1)}%
										</div>
										<div class="mt-2 text-xs text-gray-500">
											{week.weekSummary.totalTrades}
											{week.weekSummary.totalTrades === 1 ? 'trade' : 'trades'}
										</div>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
