export interface RawTrade {
    'Símbolo'?: string;
    'Dirección de apertura'?: string;
    'Hora de apertura'?: string;
    'Hora de cierre'?: string;
    'Precio de entrada'?: string | number;
    'Precio de cierre'?: string | number;
    'Cantidad de Cierre'?: number;
    'Volumen de Cierre'?: number;
    'Comisión'?: number;
    '$ neto'?: string | number;
    'Saldo $'?: string | number;
}

export interface FormattedTrade {
    simbolo: string;
    direccion: string;
    fecha_apertura: string;
    fecha_cierre: string;
    precio_entrada: number;
    precio_cierre: number;
    cantidad: number;
    volumen: number;
    comision: number;
    neto: number;
    saldo: number;
}

export interface ApiResponse {
    success: boolean;
    data: FormattedTrade[];
    count: number;
    error?: string;
}