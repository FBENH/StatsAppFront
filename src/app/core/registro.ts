import { Accion, aplicar, contadoresEnCero } from './estadisticas';
import { Contadores } from './modelos';

export type TipoJugada =
  | 'Tiro' | 'Libre' | 'Rebote' | 'Asistencia' | 'Robo' | 'Tapon' | 'Perdida' | 'Falta' | 'Cambio' | 'TiempoMuerto';

/** Una jugada del registro del partido, con la misma forma que usa la API. */
export interface Jugada {
  id: string;
  numero: number;
  cuarto: number;
  /** Tiempo que quedaba en el reloj del cuarto; null si no se lleva reloj. */
  relojMs: number | null;
  tipo: TipoJugada;
  equipoId: number;
  /** Null en jugadas de equipo. En un cambio, el que entra. */
  jugadorId?: number | null;
  /** Solo en cambios: el que sale. */
  saleId?: number | null;
  acierto?: boolean | null;
  valor?: number | null;
  ofensivo?: boolean | null;
  x?: number | null;
  y?: number | null;
  relacionadaId?: string | null;
}

export interface PlanillaJugador extends Contadores {
  equipoId: number;
  msJugados: number;
}

export interface Planilla {
  jugadores: Record<number, PlanillaJugador>;
  equipos: Record<number, Contadores>;
  /** Ids de los jugadores en cancha, por equipo. */
  enCancha: Record<number, number[]>;
}

const DURACION_PRORROGA = 5 * 60 * 1000;

export const duracionCuarto = (cuarto: number, duracionCuartoMin: number) =>
  cuarto <= 4 ? duracionCuartoMin * 60_000 : DURACION_PRORROGA;

/**
 * Calcula la planilla a partir de las jugadas. Es la misma cuenta que hace la API
 * (Services/Planilla.cs) al terminar el partido.
 * `ahora` es el momento actual del partido, para sumar los minutos de los que siguen en cancha.
 */
export function calcular(
  partido: { localId: number; visitanteId: number; duracionCuartoMin: number },
  jugadas: Jugada[],
  ahora?: { cuarto: number; relojMs: number | null },
): Planilla {
  const equipos: Record<number, Contadores> = {
    [partido.localId]: contadoresEnCero(),
    [partido.visitanteId]: contadoresEnCero(),
  };
  const jugadores: Record<number, PlanillaJugador> = {};
  const enCancha: Record<number, number[]> = { [partido.localId]: [], [partido.visitanteId]: [] };
  const entrada = new Map<number, number | null>();

  const momento = (cuarto: number, relojMs: number | null | undefined) => {
    if (relojMs == null) return null;
    let previos = 0;
    for (let c = 1; c < cuarto; c++) previos += duracionCuarto(c, partido.duracionCuartoMin);
    return previos + duracionCuarto(cuarto, partido.duracionCuartoMin) - relojMs;
  };
  const fila = (id: number, equipoId: number) =>
    (jugadores[id] ??= { ...contadoresEnCero(), equipoId, msJugados: 0 });
  const salir = (id: number, t: number | null) => {
    if (!entrada.has(id)) return;
    const desde = entrada.get(id);
    entrada.delete(id);
    if (desde != null && t != null && t > desde) jugadores[id].msJugados += t - desde;
    for (const lista of Object.values(enCancha)) {
      const i = lista.indexOf(id);
      if (i >= 0) lista.splice(i, 1);
    }
  };

  for (const j of [...jugadas].sort((a, b) => a.numero - b.numero)) {
    const t = momento(j.cuarto, j.relojMs);
    if (j.tipo === 'Cambio') {
      if (j.saleId != null) salir(j.saleId, t);
      if (j.jugadorId != null) {
        fila(j.jugadorId, j.equipoId);
        salir(j.jugadorId, t);
        entrada.set(j.jugadorId, t);
        enCancha[j.equipoId]?.push(j.jugadorId);
      }
      continue;
    }
    const equipo = equipos[j.equipoId];
    if (!equipo) continue;
    const accion = accionDe(j);
    if (!accion) continue;
    aplicar(equipo, accion);
    if (j.jugadorId != null) aplicar(fila(j.jugadorId, j.equipoId), accion);
  }

  // Los que siguen en cancha suman hasta el momento actual, sin sacarlos.
  const tAhora = ahora ? momento(ahora.cuarto, ahora.relojMs) : null;
  if (tAhora != null) {
    for (const [id, desde] of entrada) {
      if (desde != null && tAhora > desde) jugadores[id].msJugados += tAhora - desde;
    }
  }
  return { jugadores, equipos, enCancha };
}

function accionDe(j: Jugada) {
  switch (j.tipo) {
    case 'Tiro':
      return j.valor === 3 ? (j.acierto ? '3' : '3m') : j.acierto ? '2' : '2m';
    case 'Libre':
      return j.acierto ? '1' : '1m';
    case 'Rebote':
      return j.ofensivo ? 'ofe' : 'def';
    case 'Asistencia': return 'asi';
    case 'Robo': return 'rob';
    case 'Tapon': return 'tap';
    case 'Perdida': return 'per';
    case 'Falta': return 'fal';
    default: return null;
  }
}

/** Datos de la jugada que corresponden a un botón de la pantalla de carga. */
export function jugadaDeAccion(accion: Accion): Pick<Jugada, 'tipo' | 'acierto' | 'valor' | 'ofensivo'> {
  switch (accion) {
    case '1': return { tipo: 'Libre', acierto: true };
    case '1m': return { tipo: 'Libre', acierto: false };
    case '2': return { tipo: 'Tiro', valor: 2, acierto: true };
    case '2m': return { tipo: 'Tiro', valor: 2, acierto: false };
    case '3': return { tipo: 'Tiro', valor: 3, acierto: true };
    case '3m': return { tipo: 'Tiro', valor: 3, acierto: false };
    case 'ofe': return { tipo: 'Rebote', ofensivo: true };
    case 'def': return { tipo: 'Rebote', ofensivo: false };
    case 'asi': return { tipo: 'Asistencia' };
    case 'rob': return { tipo: 'Robo' };
    case 'tap': return { tipo: 'Tapon' };
    case 'per': return { tipo: 'Perdida' };
    case 'fal': return { tipo: 'Falta' };
  }
}
