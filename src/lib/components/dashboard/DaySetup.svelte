<script lang="ts">
    import { onMount } from 'svelte';
    import type { FormattedTrade } from '$lib/interfaces/trades';

    export let trades: FormattedTrade[] = [];
    
    interface DayAnalysis {
        dayName: string;
        winRate: number;
        avgGain: number;
        avgLoss: number;
        profitFactor: number;
        totalTrades: number;
        netProfit: number;
        bestHour: { hour: string, winRate: number, netProfit: number };
        worstHour: { hour: string, winRate: number, netProfit: number };
        firstTradeWinRate: number;
        riskRewardRatio: number;
        consecutiveWins: number;
        consecutiveLosses: number;
        performanceByAsset: Record<string, { wins: number, losses: number, netProfit: number }>;
        drawdown: number;
        efficiency: number;
        hourlyPerformance: Record<string, { wins: number, losses: number, netProfit: number }>;
        suggestions: string[];
        warnings: string[];
        totalDays: number;
        consistency: number; 
    }

    let currentAnalysis: DayAnalysis | null = null;
    let dailyAnalysis: Record<string, DayAnalysis> = {};
    let selectedDay: string | null = null;

    const TRADING_HOURS = [
        { label: 'Pre-Market (4:00-9:30)', key: 'premarket' },
        { label: 'Mercado Abre (9:30)', key: 'market_open' },
        { label: 'Media Mañana (10:00-11:30)', key: 'mid_morning' },
        { label: 'Almuerzo (11:30-13:00)', key: 'lunch' },
        { label: 'Tarde Temprano (13:00-14:30)', key: 'early_afternoon' },
        { label: 'Power Hour (14:30-16:00)', key: 'power_hour' },
        { label: 'Mercado Cierra (16:00)', key: 'market_close' }
    ];

    const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    onMount(() => {
        analyzeHistoricalPerformance();
    });

    function getDayName(date: Date): string {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[date.getDay()];
    }

    function analyzeHistoricalPerformance() {
        const dayStats: Record<string, {
            winners: number;
            losers: number;
            totalGain: number;
            totalLoss: number;
            firstTradeWins: number;
            firstTradeTotal: number;
            hourlyPerformance: Record<string, { wins: number, losses: number, netProfit: number }>;
            trades: FormattedTrade[];
            daysAnalyzed: Set<string>;
            performanceByAsset: Record<string, { wins: number, losses: number, netProfit: number }>;
            consecutiveWins: number[];
            consecutiveLosses: number[];
            dailyResults: number[];
        }> = {};

        WEEKDAYS.forEach(day => {
            dayStats[day] = {
                winners: 0,
                losers: 0,
                totalGain: 0,
                totalLoss: 0,
                firstTradeWins: 0,
                firstTradeTotal: 0,
                hourlyPerformance: {},
                trades: [],
                daysAnalyzed: new Set(),
                performanceByAsset: {},
                consecutiveWins: [],
                consecutiveLosses: [],
                dailyResults: []
            };
            
            TRADING_HOURS.forEach(hour => {
                dayStats[day].hourlyPerformance[hour.key] = { wins: 0, losses: 0, netProfit: 0 };
            });
        });

        trades.forEach(trade => {
            const [datePart] = trade.fecha_apertura.split(' ');
            const [day, month, year] = datePart.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            const dayName = getDayName(date);
            
            if (WEEKDAYS.includes(dayName)) {
                const dayStat = dayStats[dayName];
                dayStat.trades.push(trade);
                dayStat.daysAnalyzed.add(datePart); 
                
                if (trade.neto >= 0) {
                    dayStat.winners++;
                    dayStat.totalGain += trade.neto;
                } else {
                    dayStat.losers++;
                    dayStat.totalLoss += Math.abs(trade.neto);
                }

                // Por activo
                if (!dayStat.performanceByAsset[trade.simbolo]) {
                    dayStat.performanceByAsset[trade.simbolo] = { wins: 0, losses: 0, netProfit: 0 };
                }
                if (trade.neto >= 0) {
                    dayStat.performanceByAsset[trade.simbolo].wins++;
                } else {
                    dayStat.performanceByAsset[trade.simbolo].losses++;
                }
                dayStat.performanceByAsset[trade.simbolo].netProfit += trade.neto;

                const [_, timePart] = trade.fecha_apertura.split(' ');
                const [hours, minutes] = timePart.split(':').map(Number);
                const decimalHours = hours + minutes / 60;

                let hourKey = 'power_hour'; 
                if (decimalHours < 9.5) hourKey = 'premarket';
                else if (decimalHours < 10) hourKey = 'market_open';
                else if (decimalHours < 11.5) hourKey = 'mid_morning';
                else if (decimalHours < 13) hourKey = 'lunch';
                else if (decimalHours < 14.5) hourKey = 'early_afternoon';

                if (trade.neto >= 0) {
                    dayStat.hourlyPerformance[hourKey].wins++;
                } else {
                    dayStat.hourlyPerformance[hourKey].losses++;
                }
                dayStat.hourlyPerformance[hourKey].netProfit += trade.neto;
            }
        });

        const tradesByDate: Record<string, FormattedTrade[]> = {};
        trades.forEach(trade => {
            const [datePart] = trade.fecha_apertura.split(' ');
            if (!tradesByDate[datePart]) {
                tradesByDate[datePart] = [];
            }
            tradesByDate[datePart].push(trade);
        });

        Object.entries(tradesByDate).forEach(([date, dayTrades]) => {
            const [day, month, year] = date.split('/').map(Number);
            const dateObj = new Date(year, month - 1, day);
            const dayName = getDayName(dateObj);
            
            if (WEEKDAYS.includes(dayName)) {
                const dayStat = dayStats[dayName];
                
                dayTrades.sort((a, b) => {
                    const [aTime] = a.fecha_apertura.split(' ')[1].split(':').map(Number);
                    const [bTime] = b.fecha_apertura.split(' ')[1].split(':').map(Number);
                    return aTime - bTime;
                });

                if (dayTrades.length > 0) {
                    dayStat.firstTradeTotal++;
                    if (dayTrades[0].neto >= 0) dayStat.firstTradeWins++;
                }

                let currentStreak = 0;
                let lastWasWin: boolean | null = null;
                let currentConsecutiveWins = 0;
                let currentConsecutiveLosses = 0;

                dayTrades.forEach(trade => {
                    const isWin = trade.neto >= 0;
                    
                    if (lastWasWin === null) {
                        lastWasWin = isWin;
                        currentStreak = 1;
                    } else if (lastWasWin === isWin) {
                        currentStreak++;
                    } else {
                        if (lastWasWin) {
                            currentConsecutiveWins = Math.max(currentConsecutiveWins, currentStreak);
                        } else {
                            currentConsecutiveLosses = Math.max(currentConsecutiveLosses, currentStreak);
                        }
                        currentStreak = 1;
                        lastWasWin = isWin;
                    }
                });

                dayStat.consecutiveWins.push(currentConsecutiveWins);
                dayStat.consecutiveLosses.push(currentConsecutiveLosses);

                const dayNetProfit = dayTrades.reduce((sum, trade) => sum + trade.neto, 0);
                dayStat.dailyResults.push(dayNetProfit);
            }
        });

        WEEKDAYS.forEach(dayName => {
            const dayStat = dayStats[dayName];
            const totalTrades = dayStat.winners + dayStat.losers;
            const totalDays = dayStat.daysAnalyzed.size;

            if (totalTrades > 0) {
                const winRate = (dayStat.winners / totalTrades) * 100;
                const avgGain = dayStat.winners > 0 ? dayStat.totalGain / dayStat.winners : 0;
                const avgLoss = dayStat.losers > 0 ? dayStat.totalLoss / dayStat.losers : 0;
                const profitFactor = dayStat.totalLoss > 0 ? dayStat.totalGain / dayStat.totalLoss : dayStat.totalGain > 0 ? Infinity : 0;
                const firstTradeWinRate = dayStat.firstTradeTotal > 0 ? (dayStat.firstTradeWins / dayStat.firstTradeTotal) * 100 : 0;
                const riskRewardRatio = avgLoss > 0 ? avgGain / avgLoss : 0;
                const maxConsecutiveWins = dayStat.consecutiveWins.length > 0 ? Math.max(...dayStat.consecutiveWins) : 0;
                const maxConsecutiveLosses = dayStat.consecutiveLosses.length > 0 ? Math.max(...dayStat.consecutiveLosses) : 0;
                const netProfit = dayStat.totalGain - dayStat.totalLoss;
                const positiveDays = dayStat.dailyResults.filter(r => r > 0).length;
                const consistency = totalDays > 0 ? (positiveDays / totalDays) * 100 : 0;

                let efficiencyCount = 0;
                dayStat.trades.forEach(trade => {
                    if (trade.neto >= Math.abs(trade.precio_entrada - trade.precio_cierre) * trade.cantidad) {
                        efficiencyCount++;
                    }
                });
                const efficiency = totalTrades > 0 ? (efficiencyCount / totalTrades) * 100 : 0;

                let bestHour = { hour: 'N/A', winRate: 0, netProfit: 0 };
                let worstHour = { hour: 'N/A', winRate: 100, netProfit: 0 };
                
                Object.entries(dayStat.hourlyPerformance).forEach(([key, stats]) => {
                    const hourLabel = TRADING_HOURS.find(h => h.key === key)?.label || key;
                    const hourTotal = stats.wins + stats.losses;
                    if (hourTotal > 0) {
                        const hourWinRate = (stats.wins / hourTotal) * 100;
                        if (hourWinRate > bestHour.winRate || 
                            (hourWinRate === bestHour.winRate && stats.netProfit > bestHour.netProfit)) {
                            bestHour = { hour: hourLabel, winRate: hourWinRate, netProfit: stats.netProfit };
                        }
                        if (hourWinRate < worstHour.winRate || 
                            (hourWinRate === worstHour.winRate && stats.netProfit < worstHour.netProfit)) {
                            worstHour = { hour: hourLabel, winRate: hourWinRate, netProfit: stats.netProfit };
                        }
                    }
                });

                const suggestions: string[] = [];
                const warnings: string[] = [];
                
                if (winRate > 70 && riskRewardRatio > 1.5) {
                    suggestions.push(`Estrategia muy efectiva los ${dayName}s. Considera aumentar tamaño de posición dentro de tu gestión de riesgo.`);
                } else if (winRate < 40) {
                    warnings.push(`Tasa de acierto baja los ${dayName}s. Revisa tus setups o reduce tamaño de operaciones.`);
                }
                
                if (bestHour.winRate > 75) {
                    suggestions.push(`Horario fuerte: ${bestHour.hour} (${bestHour.winRate.toFixed(1)}% win rate).`);
                }
                
                if (worstHour.winRate < 30) {
                    warnings.push(`Evita operar durante ${worstHour.hour} (solo ${worstHour.winRate.toFixed(1)}% win rate).`);
                }
                
                if (maxConsecutiveLosses >= 3) {
                    warnings.push(`Máximo de ${maxConsecutiveLosses} pérdidas consecutivas registradas.`);
                }

                if (consistency < 50) {
                    warnings.push(`Solo el ${consistency.toFixed(1)}% de los ${dayName}s son ganadores.`);
                }

                dailyAnalysis[dayName] = {
                    dayName,
                    winRate,
                    avgGain,
                    avgLoss,
                    profitFactor,
                    totalTrades,
                    netProfit,
                    bestHour,
                    worstHour,
                    firstTradeWinRate,
                    riskRewardRatio,
                    consecutiveWins: maxConsecutiveWins,
                    consecutiveLosses: maxConsecutiveLosses,
                    performanceByAsset: dayStat.performanceByAsset,
                    drawdown: 0, 
                    efficiency,
                    hourlyPerformance: dayStat.hourlyPerformance,
                    suggestions,
                    warnings,
                    totalDays,
                    consistency
                };
            }
        });

        const today = new Date();
        const todayName = getDayName(today);
        if (dailyAnalysis[todayName]) {
            currentAnalysis = dailyAnalysis[todayName];
            selectedDay = todayName;
        } else {
            const availableDay = WEEKDAYS.find(day => dailyAnalysis[day]);
            if (availableDay) {
                currentAnalysis = dailyAnalysis[availableDay];
                selectedDay = availableDay;
            }
        }
    }

    function setDayAnalysis(dayName: string) {
        if (dailyAnalysis[dayName]) {
            currentAnalysis = dailyAnalysis[dayName];
            selectedDay = dayName;
        }
    }
</script>

<div class="col-span-3 h-auto rounded-sm bg-gray-200">
    <div class="flex items-center justify-between px-1 pt-2">
        <p class="text-sm select-none">Setup diario</p>
    </div>
    <div class="m-1 bg-white">
        <div class="border-b border-gray-200 p-3">
            <div class="grid grid-cols-5 gap-2">
                {#each ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as dayName}
                    {#if dailyAnalysis[dayName]}
                        <button 
                            class="p-2 rounded-md text-sm flex flex-col items-center
                                {selectedDay === dayName
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300 font-medium' 
                                    : 'bg-white hover:bg-gray-100 border border-gray-300'}"
                            on:click={() => setDayAnalysis(dayName)}
                        >
                            <span>{dayName.slice(0, 3)}</span>
                            <span class={dailyAnalysis[dayName].netProfit >= 0 ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
                                {dailyAnalysis[dayName].netProfit >= 0 ? '+' : ''}{dailyAnalysis[dayName].netProfit.toFixed(0)}$
                            </span>
                            <span class="text-xs text-gray-500">
                                {dailyAnalysis[dayName].totalTrades}t
                            </span>
                        </button>
                    {:else}
                        <button 
                            class="p-2 rounded-md text-sm flex flex-col items-center bg-gray-100 border border-gray-200 text-gray-400"
                            disabled
                        >
                            <span>{dayName.slice(0, 3)}</span>
                            <span>-</span>
                        </button>
                    {/if}
                {/each}
            </div>
        </div>

        {#if currentAnalysis}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b border-gray-200">
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 class="font-medium text-gray-700 mb-3">Rendimiento Histórico</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Días analizados:</span>
                            <span>{currentAnalysis.totalDays}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Consistencia:</span>
                            <span class={currentAnalysis.consistency >= 60 ? 'text-green-600' : 'text-red-600'}>
                                {currentAnalysis.consistency.toFixed(1)}%
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Resultado Neto:</span>
                            <span class={currentAnalysis.netProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {currentAnalysis.netProfit >= 0 ? '+' : ''}{currentAnalysis.netProfit.toFixed(2)} $
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Trades totales:</span>
                            <span>{currentAnalysis.totalTrades}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 class="font-medium text-gray-700 mb-3">Estadísticas de Trades</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Win Rate:</span>
                            <span class={currentAnalysis.winRate >= 60 ? 'text-green-600' : currentAnalysis.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                {currentAnalysis.winRate.toFixed(1)}%
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Ganancia Promedio:</span>
                            <span class="text-green-600">+{currentAnalysis.avgGain.toFixed(2)} $</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Pérdida Promedio:</span>
                            <span class="text-red-600">-{currentAnalysis.avgLoss.toFixed(2)} $</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Ratio R/B:</span>
                            <span class={currentAnalysis.riskRewardRatio >= 1.5 ? 'text-green-600' : 'text-red-600'}>
                                {currentAnalysis.riskRewardRatio.toFixed(2)}:1
                            </span>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 class="font-medium text-gray-700 mb-3">Horarios Clave</h3>
                    <div class="space-y-3 text-sm">
                        <div>
                            <div class="text-gray-600 mb-1">Mejor momento:</div>
                            <div class="flex justify-between items-center">
                                <span class="font-medium">{currentAnalysis.bestHour.hour}</span>
                                <span class="text-green-600">
                                    {currentAnalysis.bestHour.winRate.toFixed(1)}% WR
                                </span>
                            </div>
                        </div>
                        <div>
                            <div class="text-gray-600 mb-1">Peor momento:</div>
                            <div class="flex justify-between items-center">
                                <span class="font-medium">{currentAnalysis.worstHour.hour}</span>
                                <span class="text-red-600">
                                    {currentAnalysis.worstHour.winRate.toFixed(1)}% WR
                                </span>
                            </div>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Primer trade:</span>
                            <span class={currentAnalysis.firstTradeWinRate >= 50 ? 'text-green-600' : 'text-red-600'}>
                                {currentAnalysis.firstTradeWinRate.toFixed(1)}% éxito
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-4 space-y-3">
                {#if currentAnalysis.warnings.length > 0}
                    <div class="space-y-2">
                        <h3 class="font-medium text-red-700 flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            Atención
                        </h3>
                        {#each currentAnalysis.warnings as warning}
                            <div class="text-sm bg-red-50 border border-red-200 rounded px-3 py-2 text-red-800">
                                {warning}
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if currentAnalysis.suggestions.length > 0}
                    <div class="space-y-2">
                        <h3 class="font-medium text-blue-700 flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                            </svg>
                            Recomendaciones
                        </h3>
                        {#each currentAnalysis.suggestions as suggestion}
                            <div class="text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2 text-blue-800">
                                {suggestion}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="p-4 border-t border-gray-200">
                <h3 class="font-medium text-gray-700 mb-3">Performance por Activo</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trades</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Win Rate</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {#each Object.entries(currentAnalysis.performanceByAsset) as [asset, stats]}
                                <tr>
                                    <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{asset}</td>
                                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{stats.wins + stats.losses}</td>
                                    <td class="px-3 py-2 whitespace-nowrap text-sm">
                                        <span class={(stats.wins / (stats.wins + stats.losses)) >= 0.6 ? 'text-green-600' : 'text-red-600'}>
                                            {((stats.wins / (stats.wins + stats.losses)) * 100 || 0).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td class="px-3 py-2 whitespace-nowrap text-sm">
                                        <span class={stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(2)} $
                                        </span>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {:else}
            <div class="p-8 text-center text-gray-500">
                No hay datos disponibles para mostrar
            </div>
        {/if}
    </div>
</div>