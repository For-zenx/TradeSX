export interface SurveyEntry {
    id: number; 
    expectativa: number;
    setup: 'Second Entry' | 'Fade' | 'Trap' | 'Ninguno';
    tendencia: 'Alcista' | 'Bajista' | 'Rango';
    stopLossMoved: boolean;
    emocion: 'Confiado' | 'Dudoso' | 'Impulsivo' | 'Temeroso';
    comentario: string;
}