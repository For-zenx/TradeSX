<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import type { FormattedTrade } from '$lib/interfaces/trades';

  export let trades: FormattedTrade[] = [];
  let chart: Chart;

  onMount(() => {
      renderChart();
      return () => chart?.destroy();
  });

  $: if (trades.length > 0) {
      if (chart) chart.destroy();
      renderChart();
  }

  function renderChart() {
      const ctx = document.getElementById('ctraderChart') as HTMLCanvasElement | null;
      if (!ctx) return;

      const processedData = processTrades(trades);

      chart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: processedData.dates,
              datasets: [
                  {
                      label: 'Saldo',
                      data: processedData.balances,
                      borderColor: '#4CAF50',
                      backgroundColor: 'transparent',
                      borderWidth: 2,
                      pointRadius: 0,
                      pointHoverRadius: 5,
                      tension: 0.1
                  },
                  {
                      label: 'Rango diario',
                      data: processedData.maxBalances,
                      borderColor: 'rgba(120, 120, 120, 0.3)',
                      backgroundColor: 'rgba(120, 120, 120, 0.1)',
                      borderWidth: 1,
                      pointRadius: 0,
                      fill: '+1',
                      tension: 0.1
                  },
                  {
                      label: 'Mínimo diario',
                      data: processedData.minBalances,
                      borderColor: 'rgba(120, 120, 120, 0.3)',
                      backgroundColor: 'rgba(120, 120, 120, 0.1)',
                      borderWidth: 1,
                      pointRadius: 0,
                      tension: 0.1
                  }
              ]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false },
                  tooltip: {
                      mode: 'index',
                      intersect: false,
                      callbacks: {
                          title: (context) => processedData.dates[context[0].dataIndex]
                      }
                  }
              },
              scales: {
                  x: {
                      grid: { display: false },
                      ticks: {
                          color: '#666',
                          maxTicksLimit: 10,
                          callback: function(this: any, val: any, index: number) {
                              return index % Math.ceil(processedData.dates.length / 10) === 0 
                                  ? this.getLabelForValue(val) : '';
                          }
                      }
                  },
                  y: {
                      position: 'right',
                      grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      ticks: {
                          color: '#666',
                          callback: (value: any) => '$ ' + Number(value).toLocaleString('en-US')
                      }
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

  function processTrades(trades: FormattedTrade[]) {
      const dailyData: Record<string, {
          date: string;
          balances: number[];
          formattedDate: string;
      }> = {};

      trades.forEach(trade => {
          const [day, month, year] = trade.fecha_cierre.split(' ')[0].split('/');
          const dateKey = `${year}-${month}-${day}`;
          const formattedDate = `${day} ${getMonthName(parseInt(month))}`;

          if (!dailyData[dateKey]) {
              dailyData[dateKey] = {
                  date: dateKey,
                  formattedDate,
                  balances: []
              };
          }

          dailyData[dateKey].balances.push(trade.saldo);
      });

      const sortedDays = Object.values(dailyData).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return {
          dates: sortedDays.map(day => day.formattedDate),
          balances: sortedDays.map(day => {
              const lastBalance = day.balances[day.balances.length - 1];
              return lastBalance;
          }),
          minBalances: sortedDays.map(day => Math.min(...day.balances)),
          maxBalances: sortedDays.map(day => Math.max(...day.balances))
      };
  }

  function getMonthName(month: number) {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return months[month - 1] || '';
  }
</script>

<div class="bg-gray-200 rounded-sm h-auto max-h-96">
  <p class="text-sm px-1 pt-2 select-none">Capital</p>
  <div class="bg-white m-2">
      <canvas id="ctraderChart" class="w-full h-80"></canvas>
  </div>
</div>