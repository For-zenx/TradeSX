<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import { updateIAResume } from '$lib/stores/iaResume';

    export let trades: FormattedTrade[] = [];
    let chart: Chart;
    let viewMode: 'day' | 'hour' = 'day';

    const timeSegments = [
        { label: 'Pre-Market', start: 0, end: 9.5 },
        { label: '9:30 AM', start: 9.5, end: 10 },
        { label: '10:00 AM', start: 10, end: 10.5 },
        { label: '10:30 AM', start: 10.5, end: 11 },
        { label: '11:00 AM', start: 11, end: 12 },
        { label: '12:00 PM', start: 12, end: 12.5 },
        { label: '1:00 PM', start: 13, end: 14 },
        { label: '2:00 PM', start: 14, end: 15 },
        { label: '3:00 PM', start: 15, end: 16 },
        { label: 'After-Market', start: 16, end: 24 }
    ];

    interface Stats {
        days?: string[];
        winners: number[];
        losers: number[];
        netProfit: number[];
        volume: number[];
        avgWin: number[];
        avgLoss: number[];
    }
    
    let stats: Stats = {
        winners: [],
        losers: [],
        netProfit: [],
        volume: [],
        avgWin: [],
        avgLoss: []
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
                                const index = context.dataIndex;
                                const datasetIndex = context.datasetIndex;
                                const total = (stats.winners[index] || 0) + (stats.losers[index] || 0);
                                
                                if (total === 0) return 'No hay trades';
                                
                                const value = context.dataset.data[index] as number;
                                const percentage = ((value / total) * 100).toFixed(1);
                                
                                const avgText = datasetIndex === 0 
                                    ? `Ganancia promedio: $${stats.avgWin[index].toFixed(2)}`
                                    : `Pérdida promedio: $${stats.avgLoss[index].toFixed(2)}`;
                                
                                return [
                                    `Porcentaje: ${percentage}%`,
                                    avgText
                                ].join('\n');
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        stacked: false,
                        ticks: { maxRotation: viewMode === 'hour' ? 45 : 0 }
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
            winners: [0, 0, 0, 0, 0, 0, 0],
            losers: [0, 0, 0, 0, 0, 0, 0],
            netProfit: [0, 0, 0, 0, 0, 0, 0],
            volume: [0, 0, 0, 0, 0, 0, 0],
            totalWins: [0, 0, 0, 0, 0, 0, 0],
            totalLosses: [0, 0, 0, 0, 0, 0, 0]
        };

        trades.forEach((trade) => {
            const [datePart] = trade.fecha_apertura.split(' ');
            const [day, month, year] = datePart.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            const weekday = date.getDay();

            if (trade.neto >= 0) {
                dayStats.winners[weekday]++;
                dayStats.totalWins[weekday] += trade.neto;
            } else {
                dayStats.losers[weekday]++;
                dayStats.totalLosses[weekday] += Math.abs(trade.neto);
            }
            dayStats.netProfit[weekday] += trade.neto;
            dayStats.volume[weekday]++;
        });

        const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        
        const avgWin = dayStats.winners.map((count, i) => 
            count > 0 ? dayStats.totalWins[i] / count : 0
        );
        const avgLoss = dayStats.losers.map((count, i) => 
            count > 0 ? dayStats.totalLosses[i] / count : 0
        );

        return {
            days: weekdays,
            winners: dayStats.winners.slice(1, 6),
            losers: dayStats.losers.slice(1, 6),
            netProfit: dayStats.netProfit.slice(1, 6),
            volume: dayStats.volume.slice(1, 6),
            avgWin: avgWin.slice(1, 6),
            avgLoss: avgLoss.slice(1, 6)
        };
    }

    function processTradesByHour(trades: FormattedTrade[]) {
        const hourStats = {
            winners: new Array(timeSegments.length).fill(0),
            losers: new Array(timeSegments.length).fill(0),
            netProfit: new Array(timeSegments.length).fill(0),
            volume: new Array(timeSegments.length).fill(0),
            totalWins: new Array(timeSegments.length).fill(0),
            totalLosses: new Array(timeSegments.length).fill(0)
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
                    hourStats.totalWins[segmentIndex] += trade.neto;
                } else {
                    hourStats.losers[segmentIndex]++;
                    hourStats.totalLosses[segmentIndex] += Math.abs(trade.neto);
                }
                hourStats.netProfit[segmentIndex] += trade.neto;
                hourStats.volume[segmentIndex]++;
            }
        });

        const avgWin = hourStats.winners.map((count, i) => 
            count > 0 ? hourStats.totalWins[i] / count : 0
        );
        const avgLoss = hourStats.losers.map((count, i) => 
            count > 0 ? hourStats.totalLosses[i] / count : 0
        );

        return {
            winners: hourStats.winners,
            losers: hourStats.losers,
            netProfit: hourStats.netProfit,
            volume: hourStats.volume,
            avgWin,
            avgLoss
        };
    }

    function generateIAResume() {
        if (trades.length === 0) {
            updateIAResume('weekdayPerformance', 'No hay datos de trades disponibles');
            return;
        }

        const dayStats = processTradesByWeekday(trades);
        const hourStats = processTradesByHour(trades);

        // Resumen por día (formato compacto)
        const daySummary = dayStats.days.map((day, i) => 
            `${day.slice(0, 3)}: ${dayStats.winners[i]}G/${dayStats.losers[i]}P ` +
            `(${(dayStats.winners[i]/dayStats.volume[i]*100 || 0).toFixed(0)}%) ` +
            `Neto: $${dayStats.netProfit[i].toFixed(2)} ` +
            `(AvgG: $${dayStats.avgWin[i].toFixed(2)}/AvgP: $${dayStats.avgLoss[i].toFixed(2)})`
        ).join('\n');

        // Resumen por hora (formato compacto)
        const hourSummary = timeSegments.map((seg, i) => 
            `${seg.label.padEnd(8)}: ${hourStats.winners[i]}G/${hourStats.losers[i]}P ` +
            `Neto: $${hourStats.netProfit[i].toFixed(2)}` +
            (hourStats.volume[i] > 0 ? 
                ` (${(hourStats.winners[i]/hourStats.volume[i]*100 || 0).toFixed(0)}%)` : 
                '')
        ).join('\n');

        const resume = `RENDIMIENTO POR DÍA/HORA:
=== DÍAS ===
${daySummary}

=== HORAS ===
${hourSummary}`;

        updateIAResume('weekdayPerformance', resume);
    }
</script>

<div class="h-auto max-h-96 rounded-sm bg-gray-200 col-span-2">
    <div class="flex justify-between items-center px-1 my-1">
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