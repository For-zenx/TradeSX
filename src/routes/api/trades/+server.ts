// src/routes/api/trades/+server.ts
import * as XLSX from 'xlsx';
import { json } from '@sveltejs/kit';
import type { ApiResponse, RawTrade } from '$interfaces/trades';
import { processTradeRow } from '$lib/utils/xlsx';

export async function GET({ fetch }: { fetch: typeof globalThis.fetch }): Promise<Response> {
    try {
        // 1. Cargar el archivo XLSX
        const response = await fetch('/ct_trade_history.xlsx');
        if (!response.ok) throw new Error(`Error ${response.status} al cargar el archivo`);
        
        // 2. Procesar el archivo
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 3. Convertir y formatear datos con tipo explícito
        const rawData: RawTrade[] = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: '',
            dateNF: 'dd/mm/yyyy hh:mm:ss.000'
        });
        
        const formattedData = rawData.map(row => processTradeRow(row));
        
        // 4. Retornar respuesta tipada
        const responseData: ApiResponse = {
            success: true,
            data: formattedData,
            count: formattedData.length
        };
        
        return json(responseData);
        
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        const errorResponse: ApiResponse = {
            success: false,
            data: [],
            count: 0,
            error: message
        };
        return json(errorResponse, { status: 500 });
    }
}