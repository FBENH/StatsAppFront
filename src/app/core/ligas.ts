import { inject, Injectable } from '@angular/core';
import { Api } from './api';
import { EstadisticaEquipo, EstadisticaJugador } from './modelos';
import { Jugada } from './registro';

export type EstadoPartidoLiga = 'Programado' | 'EnCurso' | 'Finalizado';

export interface LigaResumen {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  temporadas: number;
}

export interface EquipoInscripto {
  id: number;
  nombre: string;
  escudo: string | null;
  divisionId: number | null;
}

export interface EquipoEnPartido {
  id: number;
  nombre: string;
  escudo: string | null;
  /** Null si todavía no se jugó. */
  puntos: number | null;
}

export interface PartidoDeLiga {
  id: number;
  jornada: number | null;
  fecha: string | null;
  lugar: string | null;
  estado: EstadoPartidoLiga;
  local: EquipoEnPartido;
  visitante: EquipoEnPartido;
}

export interface Opcion {
  id: number;
  nombre: string;
}

export interface LigaAdmin {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  temporadas: Opcion[];
  temporada: Opcion & { divisiones: Opcion[]; equipos: EquipoInscripto[]; partidos: PartidoDeLiga[] };
}

export interface LigaForm {
  id?: number;
  nombre: string;
  slug: string | null;
  descripcion: string | null;
  temporada?: string | null;
}

/** Administración de las ligas del usuario. */
@Injectable({ providedIn: 'root' })
export class Ligas {
  private readonly api = inject(Api);

  listar = () => this.api.get<LigaResumen[]>('/Liga/Listar');
  obtener = (id: number, temporada?: number) =>
    this.api.get<LigaAdmin>('/Liga/Obtener', temporada ? { id, temporada } : { id });
  crear = (liga: LigaForm) => this.api.post<number>('/Liga/Crear', liga);
  modificar = (liga: LigaForm) => this.api.put<null>('/Liga/Modificar', liga);
  eliminar = (id: number) => this.api.delete('/Liga/Eliminar', { id });
  crearTemporada = (ligaId: number, nombre: string) => this.api.post<number>('/Liga/Temporada', { ligaId, nombre });
  crearDivision = (temporadaId: number, nombre: string) => this.api.post<number>('/Liga/Division', { temporadaId, nombre });
  eliminarDivision = (id: number) => this.api.delete('/Liga/Division', { id });
  inscribir = (temporadaId: number, equipos: { equipoId: number; divisionId: number | null }[]) =>
    this.api.put<null>('/Liga/Inscripciones', { temporadaId, equipos });
  agregarPartidos = (
    temporadaId: number,
    partidos: { localId: number; visitanteId: number; fecha: string | null; lugar: string | null; jornada: number | null }[],
  ) => this.api.post<number[]>('/Liga/Partidos', { temporadaId, partidos });
  generarFixture = (temporadaId: number, desde: string | null, diasEntreFechas: number, idaYVuelta: boolean) =>
    this.api.post<number>('/Liga/GenerarFixture', { temporadaId, desde, diasEntreFechas, idaYVuelta });
}

// API pública

export interface JugadorPublico {
  id: number;
  nombre: string;
  numero: number;
  foto: string | null;
  equipoId: number | null;
  equipo: string | null;
}

export interface LigaPublica {
  nombre: string;
  slug: string;
  descripcion: string | null;
  temporadas: Opcion[];
  temporada: Opcion & { divisiones: Opcion[]; equipos: EquipoInscripto[] };
}

export interface PartidoPublico extends PartidoDeLiga {
  mvp: { jugador: JugadorPublico; equipoId: number; valoracion: number; puntos: number } | null;
}

export interface FilaPosiciones {
  equipo: { id: number; nombre: string; escudo: string | null };
  jugados: number;
  ganados: number;
  perdidos: number;
  porcentaje: number;
  puntosAFavor: number;
  puntosEnContra: number;
  diferencia: number;
  puntos: number;
}

export interface TablaPosiciones {
  division: Opcion | null;
  filas: FilaPosiciones[];
}

export interface Lider {
  jugador: JugadorPublico;
  partidos: number;
  promedio: number;
  total: number;
}

export interface Lideres {
  minPartidos: number;
  categorias: { clave: string; nombre: string; jugadores: Lider[] }[];
}

export interface Mvp {
  jugador: JugadorPublico;
  partidos: number;
  valoracion: number;
  promedio: number;
}

export interface Mvps {
  semana: { desde: string; hasta: string; mvp: Mvp | null };
  mes: { desde: string; hasta: string; mvp: Mvp | null };
  temporada: { mvp: Mvp | null };
}

export interface PartidoPublicoDetalle {
  id: number;
  jornada: number | null;
  fecha: string | null;
  lugar: string | null;
  estado: EstadoPartidoLiga;
  duracionCuartoMin: number;
  temporada: Opcion;
  local: Omit<EquipoEnPartido, 'puntos'>;
  visitante: Omit<EquipoEnPartido, 'puntos'>;
  jugadores: { id: number; nombre: string; numero: number; equipoId: number | null; foto: string | null }[];
  planilla: { estadistica: EstadisticaJugador; valoracion: number }[];
  equipos: EstadisticaEquipo[];
  jugadas: Jugada[];
}

/** Lo que ve cualquiera en la página de una liga, sin login. */
@Injectable({ providedIn: 'root' })
export class LigasPublicas {
  private readonly api = inject(Api);

  private ruta = (slug: string, resto = '') => `/publico/ligas/${encodeURIComponent(slug)}${resto}`;
  private params = (temporada?: number) => (temporada ? { temporada } : undefined);

  liga = (slug: string, temporada?: number) => this.api.get<LigaPublica>(this.ruta(slug), this.params(temporada));
  partidos = (slug: string, temporada?: number) =>
    this.api.get<PartidoPublico[]>(this.ruta(slug, '/partidos'), this.params(temporada));
  partido = (slug: string, id: number) => this.api.get<PartidoPublicoDetalle>(this.ruta(slug, `/partidos/${id}`));
  posiciones = (slug: string, temporada?: number) =>
    this.api.get<TablaPosiciones[]>(this.ruta(slug, '/posiciones'), this.params(temporada));
  lideres = (slug: string, temporada?: number) => this.api.get<Lideres>(this.ruta(slug, '/lideres'), this.params(temporada));
  mvp = (slug: string, temporada?: number) => this.api.get<Mvps>(this.ruta(slug, '/mvp'), this.params(temporada));
}

/** Agrupa los partidos por fecha del fixture, en orden. */
export function porJornada<T extends PartidoDeLiga>(partidos: T[]) {
  const grupos = new Map<number | null, T[]>();
  for (const p of partidos) grupos.set(p.jornada, [...(grupos.get(p.jornada) ?? []), p]);
  return [...grupos].map(([jornada, lista]) => ({ jornada, partidos: lista }));
}
