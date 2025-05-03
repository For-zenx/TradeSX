// src/lib/utils/xlsx.ts
import type { RawTrade, FormattedTrade } from '$lib/interfaces/trades';

export function convertExcelValue(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const numericString = value.replace(',', '.').replace(/[^\d.-]/g, '');
        const number = parseFloat(numericString);
        return isNaN(number) ? 0 : number;
    }
    return 0;
}

export function processTradeRow(row: unknown): FormattedTrade {
    // Hacemos type assertion ya que hemos validado el tipo
    const trade = row as RawTrade;
    
    return {
        simbolo: trade['Símbolo'] || '',
        direccion: trade['Dirección de apertura'] || '',
        fecha_apertura: trade['Hora de apertura'] || '',
        fecha_cierre: trade['Hora de cierre'] || '',
        precio_entrada: convertExcelValue(trade['Precio de entrada']),
        precio_cierre: convertExcelValue(trade['Precio de cierre']),
        cantidad: convertExcelValue(trade['Cantidad de Cierre']),
        volumen: convertExcelValue(trade['Volumen de Cierre']),
        comision: convertExcelValue(trade['Comisión']),
        neto: convertExcelValue(trade['$ neto']),
        saldo: convertExcelValue(trade['Saldo $'])
    };
}