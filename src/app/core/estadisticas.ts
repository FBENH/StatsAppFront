import { Contadores } from './modelos';

export type Accion = '1' | '1m' | '2' | '2m' | '3' | '3m' | 'ofe' | 'def' | 'asi' | 'rob' | 'tap' | 'per' | 'fal';

export const ACCIONES: { accion: Accion; texto: string; tipo: 'acierto' | 'fallo' | 'otra' }[] = [
  { accion: '1', texto: '+1', tipo: 'acierto' },
  { accion: '2', texto: '+2', tipo: 'acierto' },
  { accion: '3', texto: '+3', tipo: 'acierto' },
  { accion: '1m', texto: 'Falla 1', tipo: 'fallo' },
  { accion: '2m', texto: 'Falla 2', tipo: 'fallo' },
  { accion: '3m', texto: 'Falla 3', tipo: 'fallo' },
  { accion: 'ofe', texto: 'Reb. of.', tipo: 'otra' },
  { accion: 'def', texto: 'Reb. def.', tipo: 'otra' },
  { accion: 'asi', texto: 'Asist.', tipo: 'otra' },
  { accion: 'rob', texto: 'Robo', tipo: 'otra' },
  { accion: 'tap', texto: 'Tapón', tipo: 'otra' },
  { accion: 'per', texto: 'Pérdida', tipo: 'otra' },
  { accion: 'fal', texto: 'Falta', tipo: 'otra' },
];

export function contadoresEnCero(): Contadores {
  return {
    puntos: 0, asistencias: 0, rebotes: 0, rebotesOfensivos: 0, rebotesDefensivos: 0, robos: 0, tapones: 0,
    intentos1Punto: 0, aciertos1Punto: 0, intentos2Puntos: 0, aciertos2Puntos: 0,
    intentos3Puntos: 0, aciertos3Puntos: 0, faltas: 0, perdidas: 0,
  };
}

/** Suma una jugada a una planilla (la modifica). */
export function aplicar(c: Contadores, accion: Accion) {
  switch (accion) {
    case '1': c.aciertos1Punto++; c.intentos1Punto++; c.puntos += 1; break;
    case '1m': c.intentos1Punto++; break;
    case '2': c.aciertos2Puntos++; c.intentos2Puntos++; c.puntos += 2; break;
    case '2m': c.intentos2Puntos++; break;
    case '3': c.aciertos3Puntos++; c.intentos3Puntos++; c.puntos += 3; break;
    case '3m': c.intentos3Puntos++; break;
    case 'ofe': c.rebotesOfensivos++; c.rebotes++; break;
    case 'def': c.rebotesDefensivos++; c.rebotes++; break;
    case 'asi': c.asistencias++; break;
    case 'rob': c.robos++; break;
    case 'tap': c.tapones++; break;
    case 'per': c.perdidas++; break;
    case 'fal': c.faltas++; break;
  }
}

/** Porcentaje redondeado a un decimal; null si no hubo intentos. */
export function porcentaje(aciertos: number, intentos: number): number | null {
  return intentos === 0 ? null : Math.round((aciertos / intentos) * 1000) / 10;
}

export const tirosDeCampo = (c: Contadores) => ({
  aciertos: c.aciertos2Puntos + c.aciertos3Puntos,
  intentos: c.intentos2Puntos + c.intentos3Puntos,
});

/** Suma varias planillas. */
export function sumar(planillas: Contadores[]): Contadores {
  const total = contadoresEnCero();
  for (const p of planillas) {
    for (const clave of Object.keys(total) as (keyof Contadores)[]) total[clave] += p[clave] ?? 0;
  }
  return total;
}

/** Promedio por partido de cada contador, con un decimal. */
export function promediar(planillas: Contadores[]): Contadores | null {
  if (planillas.length === 0) return null;
  const total = sumar(planillas);
  for (const clave of Object.keys(total) as (keyof Contadores)[]) {
    total[clave] = Math.round((total[clave] / planillas.length) * 10) / 10;
  }
  return total;
}

/** "00:23:41" -> "23:41"; null -> "". */
export function formatearMinutos(minutos: string | null) {
  if (!minutos) return '';
  const [h, m, s] = minutos.split(':').map((x) => parseInt(x, 10));
  return `${h * 60 + m}:${String(s).padStart(2, '0')}`;
}

/** Milisegundos -> "m:ss". */
export function formatearReloj(ms: number) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
