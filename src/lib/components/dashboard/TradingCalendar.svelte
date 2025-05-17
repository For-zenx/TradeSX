<script lang="ts">
  import type { FormattedTrade } from '$lib/interfaces/trades';

  export let trades: FormattedTrade[] = [];

  // Definimos la estructura para los datos semanales
  interface DayData {
    date: string; // Formato DD/MM
    profitPercentage: number;
    winningTrades: number;
    losingTrades: number;
    totalTrades: number;
  }

  interface WeekData {
    weekNumber: number;
    days: {
      monday?: DayData;
      tuesday?: DayData;
      wednesday?: DayData;
      thursday?: DayData;
      friday?: DayData;
    };
    weekSummary: {
      totalWinningTrades: number;
      totalLosingTrades: number;
      totalProfitPercentage: number;
      totalTrades: number;
    };
  }

  let weeklyData: WeekData[] = [];

  // Función para obtener el número de semana del año
  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Función para procesar los trades y organizarlos por semana
  function processTrades() {
    const weeksMap = new Map<number, WeekData>();

    // Agrupar trades por semana
    trades.forEach((trade) => {
      const [datePart] = trade.fecha_apertura.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      const tradeDate = new Date(year, month - 1, day);
      const weekNumber = getWeekNumber(tradeDate);
      const weekday = tradeDate.getDay(); // 0=Domingo, 1=Lunes, etc.

      // Solo procesamos de Lunes (1) a Viernes (5)
      if (weekday >= 1 && weekday <= 5) {
        if (!weeksMap.has(weekNumber)) {
          weeksMap.set(weekNumber, {
            weekNumber,
            days: {},
            weekSummary: {
              totalWinningTrades: 0,
              totalLosingTrades: 0,
              totalProfitPercentage: 0,
              totalTrades: 0
            }
          });
        }

        const weekData = weeksMap.get(weekNumber)!;
        const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][weekday - 1] as keyof WeekData['days'];

        if (!weekData.days[dayKey]) {
          weekData.days[dayKey] = {
            date: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`,
            profitPercentage: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalTrades: 0
          };
        }

        const dayData = weekData.days[dayKey]!;
        dayData.totalTrades++;
        weekData.weekSummary.totalTrades++;

        if (trade.neto >= 0) {
          dayData.winningTrades++;
          weekData.weekSummary.totalWinningTrades++;
        } else {
          dayData.losingTrades++;
          weekData.weekSummary.totalLosingTrades++;
        }

        // Calcular porcentaje de ganancia (simplificado para el ejemplo)
        // En una implementación real, usarías el balance inicial de la semana
        dayData.profitPercentage += (trade.neto / 1000) * 100; // Asumiendo un balance base de 1000 para el cálculo
        weekData.weekSummary.totalProfitPercentage += (trade.neto / 1000) * 100;
      }
    });

    // Convertir el mapa a array y ordenar por semana (más reciente primero)
    weeklyData = Array.from(weeksMap.values()).sort((a, b) => b.weekNumber - a.weekNumber);
  }

  // Procesar los trades cuando cambian
  $: {
    if (trades.length > 0) {
      processTrades();
    }
  }
</script>

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
              <th class="p-1 text-left sticky left-0 z-20 bg-gray-50">
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
              <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="p-3 font-semibold text-gray-700 sticky left-0 z-10 bg-white">
                  Semana {week.weekNumber}
                </td>

                <!-- Lunes -->
                <td class="h-32 w-48 p-3">
                  {#if week.days.monday}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">{week.days.monday.date}</div>
                      <div class="text-center">
                        <div class="text-xl font-bold {week.days.monday.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}">
                          {week.days.monday.profitPercentage >= 0 ? '+' : ''}{week.days.monday.profitPercentage.toFixed(1)}%
                        </div>
                        <div class="mt-1 text-sm text-gray-600">
                          {week.days.monday.winningTrades}G/{week.days.monday.losingTrades}P
                        </div>
                      </div>
                      <div class="text-center text-xs text-gray-400">
                        {week.days.monday.totalTrades} {week.days.monday.totalTrades === 1 ? 'trade' : 'trades'}
                      </div>
                    </div>
                  {:else}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">-/-</div>
                      <div class="py-4 text-center text-gray-400">Sin operaciones</div>
                    </div>
                  {/if}
                </td>

                <!-- Martes -->
                <td class="h-32 w-48 p-3">
                  {#if week.days.tuesday}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">{week.days.tuesday.date}</div>
                      <div class="text-center">
                        <div class="text-xl font-bold {week.days.tuesday.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}">
                          {week.days.tuesday.profitPercentage >= 0 ? '+' : ''}{week.days.tuesday.profitPercentage.toFixed(1)}%
                        </div>
                        <div class="mt-1 text-sm text-gray-600">
                          {week.days.tuesday.winningTrades}G/{week.days.tuesday.losingTrades}P
                        </div>
                      </div>
                      <div class="text-center text-xs text-gray-400">
                        {week.days.tuesday.totalTrades} {week.days.tuesday.totalTrades === 1 ? 'trade' : 'trades'}
                      </div>
                    </div>
                  {:else}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">-/-</div>
                      <div class="py-4 text-center text-gray-400">Sin operaciones</div>
                    </div>
                  {/if}
                </td>

                <!-- Miércoles -->
                <td class="h-32 w-48 p-3">
                  {#if week.days.wednesday}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">{week.days.wednesday.date}</div>
                      <div class="text-center">
                        <div class="text-xl font-bold {week.days.wednesday.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}">
                          {week.days.wednesday.profitPercentage >= 0 ? '+' : ''}{week.days.wednesday.profitPercentage.toFixed(1)}%
                        </div>
                        <div class="mt-1 text-sm text-gray-600">
                          {week.days.wednesday.winningTrades}G/{week.days.wednesday.losingTrades}P
                        </div>
                      </div>
                      <div class="text-center text-xs text-gray-400">
                        {week.days.wednesday.totalTrades} {week.days.wednesday.totalTrades === 1 ? 'trade' : 'trades'}
                      </div>
                    </div>
                  {:else}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">-/-</div>
                      <div class="py-4 text-center text-gray-400">Sin operaciones</div>
                    </div>
                  {/if}
                </td>

                <!-- Jueves -->
                <td class="h-32 w-48 p-3">
                  {#if week.days.thursday}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">{week.days.thursday.date}</div>
                      <div class="text-center">
                        <div class="text-xl font-bold {week.days.thursday.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}">
                          {week.days.thursday.profitPercentage >= 0 ? '+' : ''}{week.days.thursday.profitPercentage.toFixed(1)}%
                        </div>
                        <div class="mt-1 text-sm text-gray-600">
                          {week.days.thursday.winningTrades}G/{week.days.thursday.losingTrades}P
                        </div>
                      </div>
                      <div class="text-center text-xs text-gray-400">
                        {week.days.thursday.totalTrades} {week.days.thursday.totalTrades === 1 ? 'trade' : 'trades'}
                      </div>
                    </div>
                  {:else}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">-/-</div>
                      <div class="py-4 text-center text-gray-400">Sin operaciones</div>
                    </div>
                  {/if}
                </td>

                <!-- Viernes -->
                <td class="h-32 w-48 p-3">
                  {#if week.days.friday}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">{week.days.friday.date}</div>
                      <div class="text-center">
                        <div class="text-xl font-bold {week.days.friday.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}">
                          {week.days.friday.profitPercentage >= 0 ? '+' : ''}{week.days.friday.profitPercentage.toFixed(1)}%
                        </div>
                        <div class="mt-1 text-sm text-gray-600">
                          {week.days.friday.winningTrades}G/{week.days.friday.losingTrades}P
                        </div>
                      </div>
                      <div class="text-center text-xs text-gray-400">
                        {week.days.friday.totalTrades} {week.days.friday.totalTrades === 1 ? 'trade' : 'trades'}
                      </div>
                    </div>
                  {:else}
                    <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div class="text-sm font-medium text-gray-500">-/-</div>
                      <div class="py-4 text-center text-gray-400">Sin operaciones</div>
                    </div>
                  {/if}
                </td>

                <!-- Resultado Semanal -->
                <td class="p-3">
                  <div class="flex h-full flex-col items-center justify-center">
                    <div class="text-lg font-semibold text-gray-700">
                      {week.weekSummary.totalWinningTrades}G/{week.weekSummary.totalLosingTrades}P
                    </div>
                    <div class="mt-1 text-sm {week.weekSummary.totalProfitPercentage >= 0 ? 'text-green-500' : 'text-red-500'}">
                      {week.weekSummary.totalProfitPercentage >= 0 ? '+' : ''}{week.weekSummary.totalProfitPercentage.toFixed(1)}%
                    </div>
                    <div class="mt-2 text-xs text-gray-400">
                      {week.weekSummary.totalTrades} {week.weekSummary.totalTrades === 1 ? 'trade' : 'trades'}
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
