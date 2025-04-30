<script lang="ts">
  import type { FormattedTrade } from '$lib/interfaces/trades';

  export let trades: FormattedTrade[] = [];

  $: metrics = calculateMetrics(trades);

  function calculateMetrics(trades: FormattedTrade[]) {
      if (trades.length === 0) {
          return {
              totalNet: 0,
              longNet: 0,
              shortNet: 0,
              profitFactor: 0,
              longProfitFactor: 0,
              shortProfitFactor: 0,
              winRate: 0,
              longWinRate: 0,
              shortWinRate: 0,
              riskRewardRatio: 0,
              longRiskReward: 0,
              shortRiskReward: 0,
              expectation: 0,
              longExpectation: 0,
              shortExpectation: 0,
              maxWin: 0,
              maxLoss: 0,
              totalTrades: 0,
              longTrades: 0,
              shortTrades: 0,
              profitPerTrade: 0,
              longProfitPerTrade: 0,
              shortProfitPerTrade: 0
          };
      }

      const longTrades = trades.filter(t => t.direccion === 'Comprar');
      const shortTrades = trades.filter(t => t.direccion === 'Vender');
      const winningTrades = trades.filter(t => t.neto > 0);
      const losingTrades = trades.filter(t => t.neto < 0);
      const longWinning = longTrades.filter(t => t.neto > 0);
      const longLosing = longTrades.filter(t => t.neto < 0);
      const shortWinning = shortTrades.filter(t => t.neto > 0);
      const shortLosing = shortTrades.filter(t => t.neto < 0);

      const totalNet = trades.reduce((sum, t) => sum + t.neto, 0);
      const longNet = longTrades.reduce((sum, t) => sum + t.neto, 0);
      const shortNet = shortTrades.reduce((sum, t) => sum + t.neto, 0);

      const totalProfit = winningTrades.reduce((sum, t) => sum + t.neto, 0);
      const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.neto, 0));
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

      const longProfit = longWinning.reduce((sum, t) => sum + t.neto, 0);
      const longLoss = Math.abs(longLosing.reduce((sum, t) => sum + t.neto, 0));
      const longProfitFactor = longLoss > 0 ? longProfit / longLoss : 0;

      const shortProfit = shortWinning.reduce((sum, t) => sum + t.neto, 0);
      const shortLoss = Math.abs(shortLosing.reduce((sum, t) => sum + t.neto, 0));
      const shortProfitFactor = shortLoss > 0 ? shortProfit / shortLoss : 0;

      const winRate = (winningTrades.length / trades.length) * 100;
      const longWinRate = longTrades.length > 0 ? (longWinning.length / longTrades.length) * 100 : 0;
      const shortWinRate = shortTrades.length > 0 ? (shortWinning.length / shortTrades.length) * 100 : 0;

      let maxBalance = 0;

      const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.neto, 0) / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.neto, 0)) / losingTrades.length : 0;
      const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

      const longAvgWin = longWinning.length > 0 ? longWinning.reduce((sum, t) => sum + t.neto, 0) / longWinning.length : 0;
      const longAvgLoss = longLosing.length > 0 ? Math.abs(longLosing.reduce((sum, t) => sum + t.neto, 0)) / longLosing.length : 0;
      const longRiskReward = longAvgLoss > 0 ? longAvgWin / longAvgLoss : 0;

      const shortAvgWin = shortWinning.length > 0 ? shortWinning.reduce((sum, t) => sum + t.neto, 0) / shortWinning.length : 0;
      const shortAvgLoss = shortLosing.length > 0 ? Math.abs(shortLosing.reduce((sum, t) => sum + t.neto, 0)) / shortLosing.length : 0;
      const shortRiskReward = shortAvgLoss > 0 ? shortAvgWin / shortAvgLoss : 0;

      const expectation = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);
      const longExpectation = (longWinRate / 100 * longAvgWin) - ((1 - longWinRate / 100) * longAvgLoss);
      const shortExpectation = (shortWinRate / 100 * shortAvgWin) - ((1 - shortWinRate / 100) * shortAvgLoss);

      const maxWin = Math.max(...trades.map(t => t.neto), 0);
      const maxLoss = Math.min(...trades.map(t => t.neto), 0);

      const profitPerTrade = trades.length > 0 ? totalNet / trades.length : 0;
      const longProfitPerTrade = longTrades.length > 0 ? longNet / longTrades.length : 0;
      const shortProfitPerTrade = shortTrades.length > 0 ? shortNet / shortTrades.length : 0;

      return {
          totalNet,
          longNet,
          shortNet,
          profitFactor,
          longProfitFactor,
          shortProfitFactor,
          winRate,
          longWinRate,
          shortWinRate,
          riskRewardRatio,
          longRiskReward,
          shortRiskReward,
          expectation,
          longExpectation,
          shortExpectation,
          maxWin,
          maxLoss,
          totalTrades: trades.length,
          longTrades: longTrades.length,
          shortTrades: shortTrades.length,
          profitPerTrade,
          longProfitPerTrade,
          shortProfitPerTrade
      };
  }
</script>

<div class="bg-gray-200 rounded-sm h-auto col-span-2">
  <p class="text-sm px-1 pt-2">Resumen general</p>
  <div class="bg-white m-1 p-2 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
          <thead>
              <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Todas</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Largas</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cortas</th>
              </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
              <tr>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Beneficio Neto</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.totalNet.toFixed(2)}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.longNet.toFixed(2)}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.shortNet.toFixed(2)}</td>
              </tr>
              <tr>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Factor de Beneficio</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.profitFactor.toFixed(2)}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.longProfitFactor.toFixed(2)}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.shortProfitFactor.toFixed(2)}</td>
              </tr>
              <tr>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Win Rate (%)</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.winRate.toFixed(1)}%</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.longWinRate.toFixed(1)}%</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.shortWinRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Ratio Riesgo/Beneficio</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.riskRewardRatio.toFixed(2)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.longRiskReward.toFixed(2)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.shortRiskReward.toFixed(2)}</td>
              </tr>
              <tr>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Expectativa</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.expectation.toFixed(2)}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.longExpectation.toFixed(2)}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.shortExpectation.toFixed(2)}</td>
              </tr>
                <tr>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Total Operaciones</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.totalTrades}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.longTrades}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.shortTrades}</td>
              </tr>
              <tr>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Beneficio/Trade</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.profitPerTrade.toFixed(2)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.longProfitPerTrade.toFixed(2)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{metrics.shortProfitPerTrade.toFixed(2)}</td>
            </tr>
          </tbody>
      </table>
  </div>
</div>