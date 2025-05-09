<script lang="ts">
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import { updateIAResume } from '$lib/stores/iaResume';

    export let trades: FormattedTrade[] = [];

    interface AdditionStats {
        totalAdditions: number;
        wonAdditions: number;
        addedInProfit: number;
        addedInLoss: number;
        additionWinRate: number;
        profitAdditionWinRate: number;
        lossAdditionWinRate: number;
    }

    $: stats = calculateAdditionStats(trades);
    $: generateIAResume();

    function calculateAdditionStats(trades: FormattedTrade[]): AdditionStats {
        // Ordenar trades por fecha de apertura
        const sortedTrades = [...trades].sort((a, b) => 
            new Date(a.fecha_apertura).getTime() - new Date(b.fecha_apertura).getTime()
        );

        let additions = 0;
        let wonAdditions = 0;
        let addedInProfit = 0;
        let addedInLoss = 0;
        let wonAddedInProfit = 0;
        let wonAddedInLoss = 0;

        // Agrupar trades por símbolo (para analizar posiciones en el mismo activo)
        const tradesBySymbol: Record<string, FormattedTrade[]> = {};
        sortedTrades.forEach(trade => {
            if (!tradesBySymbol[trade.simbolo]) {
                tradesBySymbol[trade.simbolo] = [];
            }
            tradesBySymbol[trade.simbolo].push(trade);
        });

        // Analizar cada grupo de símbolos
        Object.values(tradesBySymbol).forEach(symbolTrades => {
            for (let i = 1; i < symbolTrades.length; i++) {
                const currentTrade = symbolTrades[i];
                const previousTrade = symbolTrades[i - 1];

                // Verificar si es una adición (trade abierto antes de cerrar el anterior)
                if (new Date(currentTrade.fecha_apertura) < new Date(previousTrade.fecha_cierre)) {
                    additions++;

                    // Verificar si la adición fue ganadora
                    if (currentTrade.neto >= 0) {
                        wonAdditions++;
                    }

                    // Determinar si se añadió en ganancia o pérdida
                    const isProfitAddition = isAddedInProfit(previousTrade, currentTrade);
                    
                    if (isProfitAddition) {
                        addedInProfit++;
                        if (currentTrade.neto >= 0) wonAddedInProfit++;
                    } else {
                        addedInLoss++;
                        if (currentTrade.neto >= 0) wonAddedInLoss++;
                    }
                }
            }
        });

        return {
            totalAdditions: additions,
            wonAdditions: wonAdditions,
            addedInProfit: addedInProfit,
            addedInLoss: addedInLoss,
            additionWinRate: additions > 0 ? (wonAdditions / additions) * 100 : 0,
            profitAdditionWinRate: addedInProfit > 0 ? (wonAddedInProfit / addedInProfit) * 100 : 0,
            lossAdditionWinRate: addedInLoss > 0 ? (wonAddedInLoss / addedInLoss) * 100 : 0
        };
    }

    function isAddedInProfit(previousTrade: FormattedTrade, currentTrade: FormattedTrade): boolean {
        // Para posiciones de Venta: añadido en ganancia si precio de entrada es menor
        if (previousTrade.direccion === 'Vender') {
            return currentTrade.precio_entrada < previousTrade.precio_entrada;
        }
        // Para posiciones de Compra: añadido en ganancia si precio de entrada es mayor
        else if (previousTrade.direccion === 'Comprar') {
            return currentTrade.precio_entrada > previousTrade.precio_entrada;
        }
        return false;
    }

    function generateIAResume() {
        if (trades.length === 0) {
            updateIAResume('additionIndex', 'No hay datos de trades disponibles para calcular el índice de adición');
            return;
        }
        
        const resume = `ANÁLISIS DE ADICIÓN DE POSICIONES:
- Trades añadidos totales: ${stats.totalAdditions}
- Tasa de éxito en añadidos: ${stats.additionWinRate.toFixed(1)}%

DETALLE POR CONTEXTO:
- Añadidos en ganancia: ${stats.addedInProfit} (${stats.profitAdditionWinRate.toFixed(1)}% éxito)
- Añadidos en pérdida: ${stats.addedInLoss} (${stats.lossAdditionWinRate.toFixed(1)}% éxito)`;

        updateIAResume('additionIndex', resume);
    }
</script>

<div class="bg-gray-200 rounded-sm h-auto max-h-96 flex flex-col">
    <p class="text-sm px-1 pt-2">Índice de adición</p>
    <div class="bg-white m-1 p-2 grid grid-cols-2 gap-2 text-sm">
        
        <div class="p-2 bg-blue-50 rounded border border-blue-200">
            <div class="font-medium text-blue-800">Total</div>
            <div class="text-lg font-semibold">
                {stats.totalAdditions}
            </div>
        </div>
        
        <div class="p-2 bg-green-50 rounded border border-green-200">
            <div class="font-medium text-green-800">Ganados</div>
            <div class="text-lg font-semibold">
                {stats.wonAdditions} <span class="text-sm">({stats.additionWinRate.toFixed(1)}%)</span>
            </div>
        </div>
        
        <div class="p-2 bg-purple-50 rounded border border-purple-200">
            <div class="font-medium text-purple-800">En ganancia</div>
            <div class="text-lg font-semibold">
                {stats.addedInProfit} <span class="text-sm">({stats.profitAdditionWinRate.toFixed(1)}%)</span>
            </div>
        </div>
        
        <div class="p-2 bg-red-50 rounded border border-red-200">
            <div class="font-medium text-red-800">En pérdida</div>
            <div class="text-lg font-semibold">
                {stats.addedInLoss} <span class="text-sm">({stats.lossAdditionWinRate.toFixed(1)}%)</span>
            </div>
        </div>
    </div>
</div>