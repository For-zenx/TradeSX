<svelte:head>
    <title>Trades</title>
</svelte:head>

<script lang="ts">
    import { onMount } from 'svelte';
    import type { FormattedTrade } from '$lib/interfaces/trades';
    import type { SurveyEntry } from '$lib/interfaces/survey';

    // Variables del componente
    let trades = [] as FormattedTrade[];
    let loading = true;
    let error: string | null = null;
    let questionnaire: SurveyEntry[] = [];
    
    // Variables del modal
    let showModal = false;
    let currentTradeId: number | null = null;
    let currentSurvey: SurveyEntry = {
        id: 0,
        expectativa: 50,
        setup: 'Ninguno',
        tendencia: 'Rango',
        stopLossMoved: false,
        emocion: 'Confiado',
        comentario: ''
    };

    // Cargar datos iniciales
    onMount(async () => {
        try {
            // Cargar trades
            const tradesResponse = await fetch('/api/trades');
            if (!tradesResponse.ok) throw new Error('Network response was not ok');
            let data = await tradesResponse.json();
            trades = data.data.reverse();
            
            // Cargar encuestas existentes
            const surveyResponse = await fetch('/api/surveys');
            questionnaire = await surveyResponse.json();
        } catch (err: unknown) {
            console.error('Error:', err);
            if (err instanceof Error) {
                error = err.message;
            }
        } finally {
            loading = false;
        }
    });

    // Manejar tecla Escape
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }

    // Abrir modal con los datos del trade
    function openSurveyModal(tradeId: number) {
        currentTradeId = tradeId;
        
        // Buscar si ya existe una encuesta para este trade
        const existingSurvey = questionnaire.find(item => item.id === tradeId);
        if (existingSurvey) {
            currentSurvey = {...existingSurvey};
        } else {
            // Resetear a valores por defecto
            currentSurvey = {
                id: tradeId,
                expectativa: 50,
                setup: 'Ninguno',
                tendencia: 'Rango',
                stopLossMoved: false,
                emocion: 'Confiado',
                comentario: ''
            };
        }
        
        showModal = true;
        window.addEventListener('keydown', handleKeyDown);
    }

    // Cerrar modal
    function closeModal() {
        showModal = false;
        window.removeEventListener('keydown', handleKeyDown);
    }

    // Guardar encuesta
    async function saveSurvey() {
        if (currentTradeId === null) return;
        
        try {
            const response = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSurvey)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Actualizar la lista local de encuestas
                const index = questionnaire.findIndex(item => item.id === currentTradeId);
                if (index >= 0) {
                    questionnaire[index] = {...currentSurvey};
                } else {
                    questionnaire.push({...currentSurvey});
                }
                
                closeModal();
            } else {
                alert('Error al guardar: ' + (result.error || 'Error desconocido'));
            }
        } catch (err) {
            console.error('Error saving survey:', err);
            alert('Error al guardar la encuesta');
        }
    }
</script>

<div class="container mx-auto">
    {#if loading}
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p class="mt-2 text-gray-600">Cargando trades...</p>
        </div>
    {:else if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Error:</strong>
            <span class="block sm:inline"> {error}</span>
        </div>
    {:else}
        <div class="flex justify-end text-sm text-gray-600 pb-1 px-4">Total trades: {trades.length}</div>
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead class="bg-gray-50">
                    <tr class="*:px-6 *:py-3 *:text-left *:text-xs *:font-medium *:text-gray-500 *:uppercase *:tracking-wider">
                        <th>ID</th>
                        <th>Símbolo</th>
                        <th>Dirección</th>
                        <th>Fecha de Cierre</th>
                        <th>Precio Entrada</th>
                        <th>Precio Cierre</th>
                        <th>Cantidad</th>
                        <th>Neto</th>
                        <th>Saldo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    {#each trades as trade}
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{trade.id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trade.simbolo}</td>
                            <td class={`px-6 py-4 whitespace-nowrap text-sm ${trade.direccion === 'Comprar' ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.direccion}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.fecha_cierre}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.precio_entrada.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.precio_cierre.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.cantidad}</td>
                            <td class={`px-6 py-4 whitespace-nowrap text-sm font-medium ${trade.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.neto.toFixed(2)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.saldo.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {#if questionnaire.some(item => item.id === trade.id)}
                                    <button 
                                        on:click={() => openSurveyModal(trade.id)}
                                        class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Edit
                                    </button>
                                {:else}
                                    <button 
                                        on:click={() => openSurveyModal(trade.id)}
                                        class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Survey
                                    </button>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        {#if showModal}
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-400/50 backdrop-blur-xs">
                <div 
                    class="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4"
                    role="dialog"
                    aria-labelledby="modal-title"
                    aria-modal="true"
                >
                    <div class="p-6 max-h-[80vh] overflow-y-auto">
                        <h2 id="modal-title" class="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">Survey #{currentTradeId}</h2>
                        
                        <!-- ID (no editable) -->
                        <div class="mb-5">
                            <label for="trade-id" class="block text-sm font-medium text-gray-700 mb-2">ID del Trade</label>
                            <input 
                                id="trade-id" 
                                type="text" 
                                value={currentTradeId} 
                                disabled
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:outline-none"
                            />
                        </div>

                        <!-- Expectativa -->
                        <div class="mb-5">
                            <label for="expectativa" class="block text-sm font-medium text-gray-700 mb-2">Expectativa (1-100)</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                bind:value={currentSurvey.expectativa}
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>

                        <!-- Setup -->
                        <fieldset class="mb-5">
                            <legend class="block text-sm font-medium text-gray-700 mb-3">Setup</legend>
                            <div class="grid grid-cols-2 gap-3">
                                {#each ['Second Entry', 'Fade', 'Trap', 'Ninguno'] as option}
                                    <label class="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors {currentSurvey.setup === option ? 'bg-blue-50 border-blue-200' : ''}">
                                        <input
                                            type="radio"
                                            name="setup"
                                            checked={currentSurvey.setup === option}
                                            on:change={() => currentSurvey.setup = option as SurveyEntry['setup']}
                                            class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span class="text-sm text-gray-700">{option}</span>
                                    </label>
                                {/each}
                            </div>
                        </fieldset>

                        <!-- Tendencia -->
                        <fieldset class="mb-5">
                            <legend class="block text-sm font-medium text-gray-700 mb-3">Tendencia</legend>
                            <div class="flex gap-3">
                                {#each ['Alcista', 'Bajista', 'Rango'] as option}
                                    <label class="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors {currentSurvey.tendencia === option ? 'bg-blue-50 border-blue-200' : ''}">
                                        <input
                                            type="radio"
                                            name="tendencia"
                                            checked={currentSurvey.tendencia === option}
                                            on:change={() => currentSurvey.tendencia = option as SurveyEntry['tendencia']}
                                            class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span class="text-sm text-gray-700">{option}</span>
                                    </label>
                                {/each}
                            </div>
                        </fieldset>

                        <!-- Stop Loss -->
                        <div class="mb-5">
                            <p class="block text-sm font-medium text-gray-700 mb-3">¿Moviste el stop loss?</p>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    bind:checked={currentSurvey.stopLossMoved}
                                    class="sr-only peer"
                                />
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span class="ml-3 text-sm font-medium text-gray-700">{currentSurvey.stopLossMoved ? 'Sí' : 'No'}</span>
                            </label>
                        </div>

                        <!-- Emoción -->
                        <fieldset class="mb-5">
                            <legend class="block text-sm font-medium text-gray-700 mb-3">Emoción</legend>
                            <div class="grid grid-cols-2 gap-3">
                                {#each ['Confiado', 'Dudoso', 'Impulsivo', 'Temeroso'] as option}
                                    <label class="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors {currentSurvey.emocion === option ? 'bg-blue-50 border-blue-200' : ''}">
                                        <input
                                            type="radio"
                                            name="emocion"
                                            checked={currentSurvey.emocion === option}
                                            on:change={() => currentSurvey.emocion = option as SurveyEntry['emocion']}
                                            class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span class="text-sm text-gray-700">{option}</span>
                                    </label>
                                {/each}
                            </div>
                        </fieldset>

                        <!-- Comentario -->
                        <div class="mb-6">
                            <label for="comentario" class="block text-sm font-medium text-gray-700 mb-2">Comentario</label>
                            <textarea
                                id="comentario"
                                bind:value={currentSurvey.comentario}
                                rows="3"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                placeholder="Escribe tus observaciones..."
                            ></textarea>
                        </div>

                        <!-- Acciones -->
                        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                on:click={closeModal}
                                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                on:click={saveSurvey}
                                class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Guardar Encuesta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>
