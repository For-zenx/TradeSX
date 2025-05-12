<script lang="ts">
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import { updateIAResume } from '$lib/stores/iaResume';

    export let trades: FormattedTrade[] = [];

    interface DayStats {
        date: string;
        maxDrawdown: number;
    }
    
    let stats = {
        counts: {
            totalDays: 0,
            daysOver5: 0,
            daysOver10: 0,
            daysOver15: 0
        },
        probabilities: {
            over5: 0,
            over10: 0,
            over15: 0
        },
        maxDrawdown: { value: 0, date: '' },
        currentStreak: 0
    };

    $: {
        stats = calculateDrawdownStats(trades);
        generateIAResume();
    }

    function calculateDrawdownStats(trades: FormattedTrade[]) {
        const dailyData: Record<string, DayStats> = {};
        let currentPeak = 0;
        let currentTrough = 0;
        let previousSaldo = trades[0]?.saldo || 0; // Inicializar con el primer saldo

        // Ordenar trades por fecha (por si acaso)
        const sortedTrades = [...trades].sort((a, b) => 
            new Date(a.fecha_cierre).getTime() - new Date(b.fecha_cierre).getTime()
        );

        sortedTrades.forEach((trade, index) => {
            const [day, month, year] = trade.fecha_cierre.split(' ')[0].split('/');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { date: `${day}/${month}/${year}`, maxDrawdown: 0 };
                currentPeak = trade.saldo;
                currentTrough = trade.saldo;
            }

            // Detectar anomalías (retiros/depósitos)
            const expectedSaldoChange = trade.neto;
            const actualSaldoChange = trade.saldo - previousSaldo;
            const isAnomaly = Math.abs(actualSaldoChange - expectedSaldoChange) > 0.01; // Margen de error

            if (!isAnomaly) {
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

            previousSaldo = trade.saldo; // Actualizar para el próximo trade
        });

        const days = Object.values(dailyData);
        const totalDays = days.length;
        const daysOver5 = days.filter(d => d.maxDrawdown >= 5).length;
        const daysOver10 = days.filter(d => d.maxDrawdown >= 10).length;
        const daysOver15 = days.filter(d => d.maxDrawdown >= 15).length;

        return {
            counts: {
                totalDays,
                daysOver5,
                daysOver10,
                daysOver15
            },
            probabilities: {
                over5: totalDays > 0 ? daysOver5 / totalDays * 100 : 0,
                over10: totalDays > 0 ? daysOver10 / totalDays * 100 : 0,
                over15: totalDays > 0 ? daysOver15 / totalDays * 100 : 0
            },
            maxDrawdown: days.reduce((max, day) => day.maxDrawdown > max.value ? 
                { value: day.maxDrawdown, date: day.date } : max, 
                { value: 0, date: '' }
            ),
            currentStreak: calculateCurrentStreak(days)
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

    function generateIAResume() {
        if (trades.length === 0) {
            updateIAResume('drawdown', 'No hay datos de trades disponibles para calcular drawdown');
            return;
        }
        
        const resume = `
ANÁLISIS DE DRAWDOWN:

Histórico en días (es decir, cuantos días he tenido drawdown en compración al total de días activo):
- Mayor al ≥5%: ${stats.probabilities.over5.toFixed(1)}% (${stats.counts.daysOver5}/${stats.counts.totalDays} días)
- Mayor al ≥10%: ${stats.probabilities.over10.toFixed(1)}% (${stats.counts.daysOver10}/${stats.counts.totalDays} días)
- Mayor al ≥15%: ${stats.probabilities.over15.toFixed(1)}% (${stats.counts.daysOver15}/${stats.counts.totalDays} días)

MÁXIMOS HISTÓRICOS:
- Mayor drawdown registrado: ${stats.maxDrawdown.value.toFixed(1)}%
  - Fecha: ${stats.maxDrawdown.date || 'N/A'}

RACHA ACTUAL:
- Días consecutivos sin drawdown ≥5%: ${stats.currentStreak}`;

        updateIAResume('drawdown', resume);
    }
</script>

<div class="bg-gray-200 rounded-sm h-auto max-h-96 flex flex-col">
    <p class="text-sm px-1 pt-2">Índice de Drawdown</p>
    <div class="bg-white m-1 p-2 overflow-x-auto flex-1 flex flex-col">
        <div class="flex-none">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawdown</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Histórico (días)</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-400">
                    <tr>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Mayor al 5%</td>
                        <td data-tooltip="{stats.probabilities.over5 >= 15 ? '≥ 15% rango peligroso' : stats.probabilities.over5 >= 10 ? '≥ 10% rango óptimo' : 'Rango seguro'}" class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 {stats.probabilities.over5 >= 15 ? 'bg-red-100' : stats.probabilities.over5 >= 10 ? 'bg-blue-100' : 'bg-green-100'}">
                            {stats.counts.daysOver5} de {stats.counts.totalDays} ({(stats.counts.daysOver5/stats.counts.totalDays * 100).toFixed(1)}%)
                        </td>
                    </tr>
                    <tr>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Mayor al 10%</td>
                        <td data-tooltip="{stats.probabilities.over10 >= 5 ? 'Reducir al 5%' : stats.probabilities.over10 >= 3 ? 'Rango optimo, reducir al 3%' : 'Rango seguro'}" class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 {stats.probabilities.over10 >= 5 ? 'bg-red-100' : stats.probabilities.over10 >= 3 ? 'bg-blue-100' : 'bg-green-100'}">
                            {stats.counts.daysOver10} de {stats.counts.totalDays} ({(stats.counts.daysOver10/stats.counts.totalDays * 100).toFixed(1)}%)
                        </td>
                    </tr>
                    <tr>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Mayor al 15%</td>
                        <td data-tooltip="{stats.probabilities.over15 >= 1 ? 'Reducir al 1%' : stats.probabilities.over15 >= 0.5 ? 'Rango optimo, reducir al 0.5%' : 'Rango seguro'}" class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 {stats.probabilities.over15 >= 1 ? 'bg-red-100' : stats.probabilities.over15 >= 0.5 ? 'bg-blue-100' : 'bg-green-100'}">
                            {stats.counts.daysOver15} de {stats.counts.totalDays} ({(stats.counts.daysOver15/stats.counts.totalDays * 100).toFixed(1)}%)
                        </td>
                    </tr>      
                </tbody>
            </table>
        </div>
        
        <div class="mt-3 grid grid-cols-2 gap-2 text-sm flex-1 min-h-0"> <!-- Contenedor flexible -->
            <div data-tooltip="{stats.maxDrawdown.value >= 15 ? '≥ 15% rango peligroso' : stats.maxDrawdown.value >= 10 ? '≥ 10% rango óptimo' : 'Rango seguro'}" 
                class="p-2 rounded border border-gray-400 {stats.maxDrawdown.value >= 15 ? 'bg-red-100' : stats.maxDrawdown.value >= 10 ? 'bg-blue-100' : 'bg-green-100'} h-full flex flex-col">
                <div class="font-medium text-gray-700">Máximo histórico</div>
                <div class="text-lg font-semibold flex-1 flex items-center justify-center">
                    {stats.maxDrawdown.value.toFixed(1)}%
                </div>
                <div class="text-xs text-gray-700 text-center">
                    {stats.maxDrawdown.date}
                </div>
            </div>
            <div class="bg-gray-50 p-2 rounded border border-gray-400 h-full flex flex-col">
                <div class="font-medium text-gray-700">Racha actual</div>
                <div class="text-lg font-semibold flex-1 flex items-center justify-center">
                    {stats.currentStreak} días
                </div>
                <div class="text-xs text-gray-700 text-center">
                    sin drawdown ≥5%
                </div>
            </div>
        </div>
    </div>
</div>