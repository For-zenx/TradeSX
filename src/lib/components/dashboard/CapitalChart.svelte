<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
  
    let chart;
  
    onMount(() => {
      const ctx = document.getElementById('ctraderChart');
      
      // Datos de ejemplo (pueden ser más de 10)
      const dates = ['13 Mar', '18 Mar', '23 Mar', '28 Mar', '02 Apr', '07 Apr', '12 Apr', '17 Apr', '22 Apr', '27 Apr', '02 May', '07 May', '12 May', '17 May'];
      const balanceData = [1000, 1100, 1200, 1150, 1300, 1400, 1350, 1500, 1450, 1600, 1650, 1700, 1750, 1800];
      const minData = [950, 1050, 1150, 1100, 1250, 1350, 1300, 1450, 1400, 1550, 1600, 1650, 1700, 1750];
      const maxData = [1050, 1150, 1250, 1200, 1350, 1450, 1400, 1550, 1500, 1650, 1700, 1750, 1800, 1850];
  
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Saldo',
              data: balanceData,
              borderColor: '#4CAF50',
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 3,
              pointBackgroundColor: '#4CAF50',
              tension: 0.1
            },
            {
              label: 'Rango diario',
              data: maxData,
              borderColor: 'rgba(75, 192, 192, 0.2)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              borderWidth: 1,
              pointRadius: 0,
              fill: '+1',
              tension: 0.1
            },
            {
              label: 'Mínimo diario',
              data: minData,
              borderColor: 'rgba(75, 192, 192, 0.2)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
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
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  // Muestra la fecha completa en el tooltip
                  return dates[context[0].dataIndex];
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#666',
                maxTicksLimit: 10, // Limita a aproximadamente 10 ticks
                autoSkip: true, // Salta automáticamente las etiquetas para evitar superposiciones
                autoSkipPadding: 20, // Espacio entre ticks
                maxRotation: 0, // Evita rotación de las etiquetas
                callback: function(val, index) {
                  // Muestra solo algunas etiquetas pero mantiene la precisión en el tooltip
                  return index % Math.ceil(dates.length / 10) === 0 ? this.getLabelForValue(val) : '';
                }
              }
            },
            y: {
              position: 'right',
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: '#666',
                callback: function(value) {
                  return '$ ' + value.toLocaleString('en-US');
                }
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
  
      // Limpieza al desmontar el componente
      return () => {
        if (chart) {
          chart.destroy();
        }
      };
    });
  </script>
  
  <div class="bg-gray-200 rounded-sm h-auto max-h-96">
    <p class="text-sm px-1 pt-2 select-none">Capital</p>
    <div class="bg-white m-2">
        <canvas id="ctraderChart" class="w-full h-80"></canvas>
    </div>
  </div>