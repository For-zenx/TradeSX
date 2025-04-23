<script lang="ts">
    import type { FormattedTrade } from '$lib/interfaces/trades';

    export let trades: FormattedTrade[] = [];
    
    let wins: number = 0;
    let losses: number = 0;
    let total: number = 0;
    let balance: number = 0;
    let winRateValue: number = 0;

    $: {
        const stats = {
            wins: 0,
            losses: 0,
            total: 0,
            balance: 0
        };

        if (trades.length > 0) {
            trades.forEach(trade => {
                if (trade.neto > 0) stats.wins++;
                else if (trade.neto < 0) stats.losses++;
            });
            stats.total = trades.length;
            stats.balance = trades[trades.length - 1].saldo;
        }

        wins = stats.wins;
        losses = stats.losses;
        total = stats.total;
        balance = stats.balance;
        winRateValue = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
    }

    $: formattedBalance = balance.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    $: winRateDisplay = winRateValue.toFixed(1) + '%';
</script>

<div class="flex justify-between items-center w-full px-4 py-3 bg-white rounded-lg">
    <div data-tooltip="Balance total" class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700">Saldo:</span>
        <span class="text-base font-semibold {balance >= 0 ? 'text-green-600' : 'text-red-600'}">
            {formattedBalance}
        </span>
    </div>

    <div class="h-6 w-px bg-gray-200 mx-3"></div>

    <div class="flex items-center gap-3">
        <div data-tooltip="Wins" class="flex items-center gap-1">
            <span class="text-sm font-medium text-gray-700">W:</span>
            <span class="text-sm font-semibold text-green-600 text-right">{wins}</span>
        </div>
        
        <div class="h-4 w-px bg-gray-200"></div>
        
        <div data-tooltip="Loses" class="flex items-center gap-1">
            <span class="text-sm font-medium text-gray-700">L:</span>
            <span class="text-sm font-semibold text-red-600 text-right">{losses}</span>
        </div>
        
        <div class="h-4 w-px bg-gray-200"></div>
        
        <div data-tooltip="Total" class="flex items-center gap-1">
            <span class="text-sm font-medium text-gray-700">T:</span>
            <span class="text-sm font-semibold text-gray-800 text-right">{total}</span>
        </div>
        
        <div class="h-4 w-px bg-gray-200"></div>
        
        <div data-tooltip="{winRateValue >= 50 ? 'Es mayor a 50%' : 'Debe ser mayor a 50%'}" class="flex items-center gap-1 px-2 py-1 rounded {winRateValue >= 50 ? 'bg-green-50' : 'bg-red-50'}">
            <span class="text-sm font-medium text-gray-700">WR:</span>
            <span class="text-sm font-semibold {winRateValue >= 50 ? 'text-green-700' : 'text-red-700'}">
                {winRateDisplay}
            </span>
        </div>
    </div>
</div>