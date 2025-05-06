<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import { updateIAResume } from '$lib/stores/iaResume';

    export let trades: FormattedTrade[] = [];
    let chart: Chart;

    interface WeekdayStat {
        day: string;
        winners: number;
        losers: number;
        winRate: number;
        netProfit: number;
    }

    $: stats = processTradesByWeekday(trades);
    $: generateIAResume();

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

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
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
                    legend: {
                        display: false
                    },
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
                        grid: {
                            display: false,
                            offset: true
                        },
                        stacked: false,
                        ticks: {
                            padding: 10
                        }
                    },
                    y: {
                        position: 'right',
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            precision: 0,
                            callback: (value: any) => Number(value).toLocaleString('en-US')
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

	function processTradesByWeekday(trades: FormattedTrade[]) {
        const dayStats = {
            winners: [0, 0, 0, 0, 0, 0, 0],
            losers: [0, 0, 0, 0, 0, 0, 0],
            netProfit: [0, 0, 0, 0, 0, 0, 0],
            volume: [0, 0, 0, 0, 0, 0, 0] // Nuevo: para contar el volumen por día
        };

        trades.forEach((trade) => {
            const dateParts = trade.fecha_cierre.split(' ')[0].split('/');
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const year = parseInt(dateParts[2]);
            const date = new Date(year, month, day);
            const weekday = date.getDay();

            if (trade.neto >= 0) {
                dayStats.winners[weekday]++;
            } else {
                dayStats.losers[weekday]++;
            }
            dayStats.netProfit[weekday] += trade.neto;
            dayStats.volume[weekday]++; // Contamos cada trade para el volumen
        });

        const totalVolume = dayStats.volume.reduce((a, b) => a + b, 0); // Total de trades

        const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const weekdayStats = weekdays.map((day, i) => {
            const idx = i + 1;
            const totalTrades = dayStats.winners[idx] + dayStats.losers[idx];
            const dayVolume = dayStats.volume[idx];
            const volumePercentage = totalVolume > 0 ? (dayVolume / totalVolume) * 100 : 0;
            
            return {
                day,
                winners: dayStats.winners[idx],
                losers: dayStats.losers[idx],
                winRate: totalTrades > 0 ? (dayStats.winners[idx] / totalTrades) * 100 : 0,
                netProfit: dayStats.netProfit[idx],
                volume: dayVolume,
                volumePercentage: volumePercentage // Porcentaje del volumen total
            };
        });

        return {
            days: weekdays,
            winners: dayStats.winners.slice(1, 6),
            losers: dayStats.losers.slice(1, 6),
            detailedStats: weekdayStats,
            totalVolume: totalVolume
        };
    }

    function generateIAResume() {
        if (trades.length === 0) {
            updateIAResume('weekdayPerformance', 'No hay datos de trades disponibles para analizar rendimiento por día');
            return;
        }

        const totalWinners = stats.winners.reduce((a, b) => a + b, 0);
        const totalLosers = stats.losers.reduce((a, b) => a + b, 0);
        const totalTrades = totalWinners + totalLosers;
        const winPercentage = totalTrades > 0 ? (totalWinners / totalTrades) * 100 : 0;

        // Encontrar el día con mayor y menor volumen
        const sortedByVolume = [...stats.detailedStats].sort((a, b) => b.volume - a.volume);
        const busiestDay = sortedByVolume[0];
        const quietestDay = sortedByVolume[sortedByVolume.length - 1];

        const resume = `
ANÁLISIS DE RENDIMIENTO POR DÍA (todos los trades juntos evaluados por días de la semana):
${stats.detailedStats.map(day => `
• ${day.day}:
- Trades: ${day.volume} (${day.volumePercentage.toFixed(1)}% del total)
- Resultados: ${day.winners}G/${day.losers}P
- Tasa de éxito: ${day.winRate.toFixed(1)}%
- Beneficio neto: $${day.netProfit.toFixed(2)}`).join('')};

- Día con más actividad: ${busiestDay.day} (${busiestDay.volume} trades, ${busiestDay.volumePercentage.toFixed(1)}%)
- Día con menos actividad: ${quietestDay.day} (${quietestDay.volume} trades, ${quietestDay.volumePercentage.toFixed(1)}%)`
	updateIAResume('weekdayPerformance', resume);
    }
</script>

<div class="h-auto max-h-96 rounded-sm bg-gray-200">
	<p class="px-1 pt-2 text-sm select-none">Rendimiento por Día</p>
	<div class="m-1 bg-white">
		<canvas id="performanceChart" class="h-80 w-full"></canvas>
	</div>
</div>
