<script lang="ts">
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import { updateIAResume } from '$lib/stores/iaResume';

    export let trades: FormattedTrade[] = [];

    interface DayStats {
        date: string;
        maxDrawdown: number;
        dailyProfit: number;
    }
    
    let stats = {
        counts: {
            totalDays: 0,
            daysOver5: 0,
            daysOver10: 0,
            daysOver15: 0,
            profitableDays: 0
        },
        probabilities: {
            over5: 0,
            over10: 0,
            over15: 0,
            winRate: 0
        },
        maxDrawdown: { value: 0, date: '' },
        maxDailyProfit: { value: 0, date: '' },
        currentStreak: 0,
        avgDrawdown: 0,
        recoveryFactor: 0
    };

    $: {
        stats = calculateDrawdownStats(trades);
        generateIAResume();
    }

    function calculateDrawdownStats(trades: FormattedTrade[]) {
        const dailyData: Record<string, DayStats> = {};
        let currentPeak = 0;
        let currentTrough = 0;
        let previousSaldo = trades[0]?.saldo || 0;
        let totalProfit = 0;
        let totalLoss = 0;

        const sortedTrades = [...trades].sort((a, b) => 
            new Date(a.fecha_cierre).getTime() - new Date(b.fecha_cierre).getTime()
        );

        sortedTrades.forEach((trade) => {
            const [day, month, year] = trade.fecha_cierre.split(' ')[0].split('/');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { 
                    date: `${day}/${month}/${year}`, 
                    maxDrawdown: 0,
                    dailyProfit: 0
                };
                currentPeak = trade.saldo;
                currentTrough = trade.saldo;
            }

            const isAnomaly = Math.abs((trade.saldo - previousSaldo) - trade.neto) > 0.01;

            if (!isAnomaly) {
                dailyData[dateKey].dailyProfit += trade.neto;
                
                if (trade.neto >= 0) totalProfit += trade.neto;
                else totalLoss += Math.abs(trade.neto);

                if (trade.saldo > currentPeak) {
                    currentPeak = trade.saldo;
                    currentTrough = trade.saldo;
                }

                if (trade.saldo < currentTrough) {
                    currentTrough = trade.saldo;
                    const drawdown = (currentPeak - currentTrough) / currentPeak * 100;
                    if (drawdown > dailyData[dateKey].maxDrawdown) {
                        dailyData[dateKey].maxDrawdown = drawdown;
                    }
                }
            }

            previousSaldo = trade.saldo;
        });

        const days = Object.values(dailyData);
        const totalDays = days.length;
        const daysOver5 = days.filter(d => d.maxDrawdown >= 5).length;
        const daysOver10 = days.filter(d => d.maxDrawdown >= 10).length;
        const daysOver15 = days.filter(d => d.maxDrawdown >= 15).length;
        const profitableDays = days.filter(d => d.dailyProfit >= 0).length;

        const maxDailyProfit = days.reduce((max, day) => 
            day.dailyProfit > max.value ? { value: day.dailyProfit, date: day.date } : max, 
            { value: 0, date: '' }
        );

        const avgDrawdown = days.reduce((sum, day) => sum + day.maxDrawdown, 0) / totalDays;
        const recoveryFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

        return {
            counts: {
                totalDays,
                daysOver5,
                daysOver10,
                daysOver15,
                profitableDays
            },
            probabilities: {
                over5: totalDays > 0 ? daysOver5 / totalDays * 100 : 0,
                over10: totalDays > 0 ? daysOver10 / totalDays * 100 : 0,
                over15: totalDays > 0 ? daysOver15 / totalDays * 100 : 0,
                winRate: totalDays > 0 ? profitableDays / totalDays * 100 : 0
            },
            maxDrawdown: days.reduce((max, day) => 
                day.maxDrawdown > max.value ? { value: day.maxDrawdown, date: day.date } : max, 
                { value: 0, date: '' }
            ),
            maxDailyProfit,
            currentStreak: calculateCurrentStreak(days),
            avgDrawdown,
            recoveryFactor
        };
    }

    function calculateCurrentStreak(days: DayStats[]) {
        let streak = 0;
        for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].maxDrawdown < 5) streak++;
            else break;
        }
        return streak;
    };

    function getRiskLevel(value: number, thresholds: number[]) {
        if (value >= thresholds[0]) return 'CRÍTICO';
        if (value >= thresholds[1]) return 'ALTO';
        if (value >= thresholds[2]) return 'MODERADO';
        return 'BAJO';
    }

    function generateIAResume() {
        if (trades.length === 0) {
            updateIAResume('drawdown', 'No hay datos de trades disponibles para calcular drawdown');
            return;
        }
        
        const riskLevel = getRiskLevel(stats.probabilities.over5, [15, 10, 5]);
        const performanceRating = calculatePerformanceRating();
        
        const resume = `ANÁLISIS COMPLETO DE GESTIÓN DE RIESGO:

**DATOS CLAVE:**
- Días analizados: ${stats.counts.totalDays}
- Nivel de riesgo: ${riskLevel}
- Ratio de recuperación: ${stats.recoveryFactor.toFixed(2)}
- Drawdown promedio: ${stats.avgDrawdown.toFixed(1)}%

**ESTADÍSTICAS DE DRAWDOWN:**
- Días con drawdown ≥5%: ${stats.probabilities.over5.toFixed(1)}% (${stats.counts.daysOver5}/${stats.counts.totalDays})
- Días con drawdown ≥10%: ${stats.probabilities.over10.toFixed(1)}% (${stats.counts.daysOver10}/${stats.counts.totalDays})
- Días con drawdown ≥15%: ${stats.probabilities.over15.toFixed(1)}% (${stats.counts.daysOver15}/${stats.counts.totalDays})
- Máximo drawdown histórico: ${stats.maxDrawdown.value.toFixed(1)}% (${stats.maxDrawdown.date})

**CONTEXTO ADICIONAL:**
- Racha actual sin drawdown alto: ${stats.currentStreak} días
- Máxima ganancia diaria: $${stats.maxDailyProfit.value.toFixed(2)} (${stats.maxDailyProfit.date})
- Porcentaje de días rentables: ${stats.probabilities.winRate.toFixed(1)}%
- Drawdown promedio en días negativos: ${stats.avgDrawdown.toFixed(1)}%

**EVALUACIÓN DE RENDIMIENTO:**
${performanceRating}`;

        updateIAResume('drawdown', resume);
    }

    function calculatePerformanceRating() {
        const { recoveryFactor, probabilities } = stats;
        
        if (recoveryFactor > 3 && probabilities.over5 < 5) 
            return "★ ★ ★ ★ ★ - Excelente gestión de riesgo y alta rentabilidad";
        if (recoveryFactor > 2 && probabilities.over5 < 10) 
            return "★ ★ ★ ★ ☆ - Buen manejo de riesgo con resultados positivos";
        if (recoveryFactor > 1 && probabilities.over5 < 15) 
            return "★ ★ ★ ☆ ☆ - Riesgo aceptable pero con margen de mejora";
        if (recoveryFactor > 0.5) 
            return "★ ★ ☆ ☆ ☆ - Riesgo elevado, necesita ajustes";
        return "★ ☆ ☆ ☆ ☆ - Riesgo muy alto, revisión urgente requerida";
    }
</script>

<!-- Diseño consistente con el resto de la aplicación -->
<div class="bg-gray-200 rounded-sm h-full flex flex-col">
    <!-- Header consistente -->
    <div class="flex items-center justify-between p-1 bg-gray-200 rounded-t-sm">
        <p class="text-sm">Gestión de Riesgo</p>
        <span class="text-xs bg-gray-300 px-2 py-0.5 rounded-full">
            {stats.counts.totalDays} días
        </span>
    </div>

    <!-- Contenido principal -->
    <div class="m-1 bg-white p-2 flex-1 flex flex-col gap-3">
        <!-- Indicador de riesgo -->
        <div class="rounded-sm p-1">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">Nivel de Riesgo</span>
                <span class={`text-xs px-2 py-1 rounded-full font-medium ${
                    getRiskLevel(stats.probabilities.over5, [15, 10, 5]) === 'CRÍTICO' ? 'bg-red-100 text-red-800' :
                    getRiskLevel(stats.probabilities.over5, [15, 10, 5]) === 'ALTO' ? 'bg-orange-100 text-orange-800' :
                    getRiskLevel(stats.probabilities.over5, [15, 10, 5]) === 'MODERADO' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                }`}>
                    {getRiskLevel(stats.probabilities.over5, [15, 10, 5])}
                </span>
            </div>
            
            {#if stats.counts.totalDays > 0}
                <div class="space-y-2">
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span>Drawdown ≥5%</span>
                            <span>{stats.probabilities.over5.toFixed(1)}% días</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5">
                            <div class="bg-blue-600 h-1.5 rounded-full" 
                                 style={`width: ${Math.min(stats.probabilities.over5, 100)}%`}></div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Estadísticas en grid compacto -->
        <div class="grid grid-cols-2 gap-2">
            <div class="border border-gray-300 rounded-sm p-2">
                <p class="text-xs text-gray-500">Máx. Drawdown</p>
                <p class="text-lg font-semibold text-red-600">{stats.maxDrawdown.value.toFixed(1)}%</p>
                <p class="text-xs text-gray-500 truncate">{stats.maxDrawdown.date}</p>
            </div>
            
            <div class="border border-gray-300 rounded-sm p-2">
                <p class="text-xs text-gray-500">Racha Actual</p>
                <p class="text-lg font-semibold text-green-600">{stats.currentStreak} días</p>
                <p class="text-xs text-gray-500">sin ≥5%</p>
            </div>
            
            <div class="border border-gray-300 rounded-sm p-2">
                <p class="text-xs text-gray-500">Días Rentables</p>
                <p class="text-lg font-semibold">{stats.probabilities.winRate.toFixed(1)}%</p>
                <p class="text-xs text-gray-500">{stats.counts.profitableDays}/{stats.counts.totalDays}</p>
            </div>
            
            <div class="border border-gray-300 rounded-sm p-2">
                <p class="text-xs text-gray-500">Ratio Recup.</p>
                <p class="text-lg font-semibold">{stats.recoveryFactor.toFixed(2)}</p>
                <p class="text-xs text-gray-500">Gan/Pérd</p>
            </div>
        </div>

        <!-- Mini recomendación -->
        <div class="border border-blue-200 bg-blue-50 rounded-sm p-2">
            <p class="text-xs font-medium text-blue-800 mb-1">Sugerencia:</p>
            <p class="text-xs text-blue-700">
                {#if stats.counts.totalDays > 0}
                    {#if getRiskLevel(stats.probabilities.over5, [15, 10, 5]) === 'CRÍTICO'}
                        Reducir posiciones y revisar estrategias urgentemente
                    {:else if getRiskLevel(stats.probabilities.over5, [15, 10, 5]) === 'ALTO'}
                        Optimizar stops y mejorar selección de operaciones
                    {:else if getRiskLevel(stats.probabilities.over5, [15, 10, 5]) === 'MODERADO'}
                        Afinar puntos de entrada y gestión de riesgo
                    {:else}
                        Mantener buen desempeño con monitoreo constante
                    {/if}
                {:else}
                    Esperando más datos para recomendaciones
                {/if}
            </p>
        </div>
    </div>
</div>