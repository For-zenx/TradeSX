<script lang="ts">
    import type { FormattedTrade } from '$lib/interfaces/trades';

    export let trades: FormattedTrade[] = [];

    interface DayStats {
        date: string;
        maxDrawdown: number;
    }

    $: stats = {
        ...calculateDrawdownStats(trades),
    };

    function calculateDrawdownStats(trades: FormattedTrade[]) {
        const dailyData: Record<string, DayStats> = {};
        let currentPeak = 0;
        let currentTrough = 0;

        trades.forEach(trade => {
            const [day, month, year] = trade.fecha_cierre.split(' ')[0].split('/');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { date: `${day}/${month}`, maxDrawdown: 0 };
                currentPeak = trade.saldo;
                currentTrough = trade.saldo;
            }

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
        });

        const days = Object.values(dailyData);
        const totalDays = days.length;

        return {
            probabilities: {
                over5: totalDays > 0 ? days.filter(d => d.maxDrawdown >= 5).length / totalDays * 100 : 0,
                over10: totalDays > 0 ? days.filter(d => d.maxDrawdown >= 10).length / totalDays * 100 : 0,
                over15: totalDays > 0 ? days.filter(d => d.maxDrawdown >= 15).length / totalDays * 100 : 0
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
    }
</script>

<div class="bg-gray-200 rounded-sm h-auto max-h-96">
    <p class="text-sm px-1 pt-2">Índice de Drawdown</p>
    <div class="bg-white m-1 p-2 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead>
                <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawdown</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posibilidad diaria</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                <tr>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Mayor al 5%</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{stats.probabilities.over5.toFixed(0)}%</td>
                </tr>
                <tr>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Mayor al 10%</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{stats.probabilities.over10.toFixed(0)}%</td>
                </tr>
                <tr>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Mayor al 15%</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{stats.probabilities.over15.toFixed(0)}%</td>
                </tr>      
            </tbody>
        </table>
        
        <!-- Sección mejorada para estadísticas clave -->
        <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div class="bg-gray-50 p-2 rounded border border-gray-400">
                <div class="font-medium text-gray-700">Máximo histórico</div>
                <div class="text-lg font-semibold">
                    {stats.maxDrawdown.value.toFixed(1)}%
                </div>
                <div class="text-xs text-gray-600">
                    {stats.maxDrawdown.date}
                </div>
            </div>
            <div class="bg-gray-50 p-2 rounded border border-gray-400">
                <div class="font-medium text-gray-700">Racha actual</div>
                <div class="text-lg font-semibold">
                    {stats.currentStreak} días
                </div>
                <div class="text-xs text-gray-600">
                    sin drawdown ≥5%
                </div>
            </div>
        </div>
    </div>
</div>
<!-- <div class="bg-gray-100 rounded border p-3 space-y-3">
    <h3 class="font-medium">Índice de Drawdown Intraday</h3>
    
    <div class="grid grid-cols-3 gap-2 text-center">
        <div class="border rounded p-2">
            <div class="font-bold">≥5%</div>
            <div>{stats.probabilities.over5.toFixed(0)}%</div>
        </div>
        <div class="border rounded p-2">
            <div class="font-bold">≥10%</div>
            <div>{stats.probabilities.over10.toFixed(0)}%</div>
        </div>
        <div class="border rounded p-2">
            <div class="font-bold">≥15%</div>
            <div>{stats.probabilities.over15.toFixed(0)}%</div>
        </div>
    </div>

    <div class="text-sm space-y-1">
        <div>Máximo histórico: {stats.maxDrawdown.value.toFixed(1)}% ({stats.maxDrawdown.date})</div>
        <div>Racha actual: {stats.currentStreak} días sin >5%</div>
    </div>
</div> -->