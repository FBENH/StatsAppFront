// Tipos de lo que devuelve la API. Todas las respuestas vienen envueltas en { exito, mensaje, data }.
export interface Respuesta<T> {
  exito: number;
  mensaje: string | null;
  data: T;
}

export interface Sesion {
  userName: string;
  token: string;
}

export interface Contadores {
  puntos: number;
  asistencias: number;
  rebotes: number;
  rebotesOfensivos: number;
  rebotesDefensivos: number;
  robos: number;
  tapones: number;
  intentos1Punto: number;
  aciertos1Punto: number;
  intentos2Puntos: number;
  aciertos2Puntos: number;
  intentos3Puntos: number;
  aciertos3Puntos: number;
  faltas: number;
  perdidas: number;
}

export interface EstadisticaJugador extends Contadores {
  jugadorId: number;
  partidoId: number;
  equipoId: number;
  /** "hh:mm:ss" */
  minutos: string | null;
}

export interface EstadisticaEquipo extends Contadores {
  equipoId: number;
  partidoId: number;
}

export interface Equipo {
  id: number;
  nombre: string;
  ciudad: string | null;
  escudo: string | null;
  entrenador: string | null;
  jugadores?: Jugador[] | null;
  estadisticasPartidos?: EstadisticaEquipo[] | null;
}

/** Fila de las listas de jugadores: equipo es el nombre del equipo. */
export interface JugadorListado {
  id: number;
  nombre: string;
  posicion: string | null;
  numero: number;
  equipoId: number | null;
  equipo: string | null;
  foto: string | null;
  altura: number | null;
  peso: number | null;
}

export interface Jugador {
  id: number;
  nombre: string;
  posicion: string | null;
  numero: number;
  equipoId: number | null;
  foto: string | null;
  altura: number | null;
  peso: number | null;
  equipo?: Equipo | null;
  estadisticasJugador?: EstadisticaJugador[] | null;
}

export interface PartidoResumen {
  id: number;
  fecha: string | null;
  lugar: string | null;
  local: string;
  visitante: string;
  equipoLocalId: number;
  equipoVisitanteId: number;
  ganador: number | null;
  ganadorNombre: string | null;
  estado?: 'Finalizado' | 'EnCurso' | 'Programado';
}

export interface PartidoDetalle extends PartidoResumen {
  jugadores: { id: number; nombre: string; numero: number; estadisticasJugador: EstadisticaJugador[] }[];
  statPartido: EstadisticaEquipo[];
}

export const POSICIONES = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'];
