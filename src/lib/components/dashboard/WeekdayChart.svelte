<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import { updateIAResume } from '$lib/stores/iaResume';

    export let trades: FormattedTrade[] = [];
    let chart: Chart;
    let viewMode: 'day' | 'hour' = 'day';

    // Segmentos horarios (hora de Nueva York)
    const timeSegments = [
        { label: 'Pre-Market', start: 0, end: 9.5 },    // 00:00 - 09:30 AM
        { label: '9:30 AM', start: 9.5, end: 10 },      // 09:30 - 10:00 AM
        { label: '10:00 AM', start: 10, end: 10.5 },
        { label: '10:30 AM', start: 10.5, end: 11.5 },
        { label: '11:30 AM', start: 11.5, end: 12.5 },
        { label: '12:30 PM', start: 12.5, end: 13.5 },
        { label: '1:30 PM', start: 13.5, end: 14.5 },
        { label: '2:30 PM', start: 14.5, end: 15.5 },
        { label: '3:30 PM', start: 15.5, end: 16 },
        { label: 'Market Close', start: 16, end: 24 }    // 04:00 PM - 00:00
    ];
    interface Stats {
        days?: string[];
        winners: number[];
        losers: number[];
        netProfit: number[];
        volume: number[];
    }
    
    let stats: Stats = {
        winners: [],
        losers: [],
        netProfit: [],
        volume: []
    };

    $: {
        stats = viewMode === 'day' ? processTradesByWeekday(trades) : processTradesByHour(trades);
        generateIAResume();
    }

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

        const labels = viewMode === 'day' 
            ? ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] 
            : timeSegments.map(seg => seg.label);

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Trades Ganadores',
                        data: stats.winners,
                        backgroundColor: '#4CAF50',
                        borderColor: '#388E3C',
                        barThickness: 20,
                        categoryPercentage: 0.6,
                        barPercentage: 0.9,
                        borderWidth: 1
                    },
                    {
                        label: 'Trades Perdedores',
                        data: stats.losers,
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const total = (stats.winners[context.dataIndex] || 0) + (stats.losers[context.dataIndex] || 0);
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
                        grid: { display: false }, 
                        stacked: false,
                        ticks: { maxRotation: viewMode === 'hour' ? 45 : 0 } // Rotar labels en modo hora
                    },
                    y: {
                        position: 'right',
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { precision: 0 },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function processTradesByWeekday(trades: FormattedTrade[]) {
        const dayStats = {
            winners: [0, 0, 0, 0, 0, 0, 0], // 0=Domingo, 1=Lunes...
            losers: [0, 0, 0, 0, 0, 0, 0],
            netProfit: [0, 0, 0, 0, 0, 0, 0],
            volume: [0, 0, 0, 0, 0, 0, 0]
        };

        trades.forEach((trade) => {
            const [datePart] = trade.fecha_apertura.split(' ');
            const [day, month, year] = datePart.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            const weekday = date.getDay();

            if (trade.neto >= 0) {
                dayStats.winners[weekday]++;
            } else {
                dayStats.losers[weekday]++;
            }
            dayStats.netProfit[weekday] += trade.neto;
            dayStats.volume[weekday]++;
        });

        const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        return {
            days: weekdays,
            winners: dayStats.winners.slice(1, 6), // Extraer Lunes(1)-Viernes(5)
            losers: dayStats.losers.slice(1, 6),
            netProfit: dayStats.netProfit.slice(1, 6),
            volume: dayStats.volume.slice(1, 6)
        };
    }

    function processTradesByHour(trades: FormattedTrade[]) {
        const hourStats = {
            winners: new Array(timeSegments.length).fill(0),
            losers: new Array(timeSegments.length).fill(0),
            netProfit: new Array(timeSegments.length).fill(0),
            volume: new Array(timeSegments.length).fill(0)
        };

        trades.forEach((trade) => {
            const [datePart, timePart] = trade.fecha_apertura.split(' ');
            const [day, month, year] = datePart.split('/').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            const decimalHours = hours + minutes / 60;

            const segmentIndex = timeSegments.findIndex(
                seg => decimalHours >= seg.start && decimalHours < seg.end
            );

            if (segmentIndex !== -1) {
                if (trade.neto >= 0) {
                    hourStats.winners[segmentIndex]++;
                } else {
                    hourStats.losers[segmentIndex]++;
                }
                hourStats.netProfit[segmentIndex] += trade.neto;
                hourStats.volume[segmentIndex]++;
            }
        });

        return hourStats;
    }

function generateIAResume() {
    if (trades.length === 0) {
        updateIAResume('weekdayPerformance', 'No hay datos de trades disponibles');
        return;
    }

    // Procesar datos por día y por hora
    const dayStats = processTradesByWeekday(trades);
    const hourStats = processTradesByHour(trades);

    // Calcular métricas generales
    const totalTrades = trades.length;
    const totalWinners = trades.filter(t => t.neto >= 0).length;
    const totalLosers = totalTrades - totalWinners;
    const winRate = totalTrades > 0 ? (totalWinners / totalTrades) * 100 : 0;
    const totalProfit = trades.reduce((sum, t) => sum + t.neto, 0);
    const avgProfitPerTrade = totalTrades > 0 ? totalProfit / totalTrades : 0;

    // Crear resumen estructurado
    const resume = `## RENDIMIENTO POR DÍA (LUNES-VIERNES)
${dayStats.days.map((day, i) => `
### ${day}
- Trades totales: ${dayStats.volume[i]} (${dayStats.winners[i]}G / ${dayStats.losers[i]}P)
- Tasa de éxito: ${(dayStats.winners[i] / dayStats.volume[i] * 100 || 0).toFixed(1)}%
- Beneficio neto: $${dayStats.netProfit[i].toFixed(2)}`).join('')}

## RENDIMIENTO POR HORARIO (EST NY TIME)
${timeSegments.map((seg, i) => `
### ${seg.label}
- Trades totales: ${hourStats.volume[i]} (${hourStats.winners[i]}G / ${hourStats.losers[i]}P)
- Tasa de éxito: ${(hourStats.winners[i] / hourStats.volume[i] * 100 || 0).toFixed(1)}%
- Beneficio neto: $${hourStats.netProfit[i].toFixed(2)}`).join('')}`;

    updateIAResume('weekdayPerformance', resume);
}
</script>

<div class="h-auto max-h-96 rounded-sm bg-gray-200 col-span-2">
    <div class="flex justify-between items-center px-1 pt-2">
        <p class="text-sm select-none">Rendimiento por {viewMode === 'day' ? 'Día' : 'Hora'}</p>
        <button 
            class="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100 transition-colors"
            on:click={() => {
                viewMode = viewMode === 'day' ? 'hour' : 'day';
                if (chart) chart.destroy();
                renderChart();
            }}
        >
            {viewMode === 'day' ? 'Ver por Hora' : 'Ver por Día'}
        </button>
    </div>
    <div class="m-1 bg-white">
        <canvas id="performanceChart" class="h-80 w-full"></canvas>
    </div>
</div>