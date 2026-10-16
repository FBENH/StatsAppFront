import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Api } from './api';
import { Accion, aplicar, contadoresEnCero } from './estadisticas';
import { Contadores } from './modelos';

export interface JugadorEnVivo {
  id: number;
  nombre: string;
  numero: number;
}

export interface EquipoEnVivo {
  id: number;
  nombre: string;
  escudo: string | null;
  jugadores: JugadorEnVivo[];
  /** Ids de los jugadores en cancha. */
  enCancha: number[];
}

export interface PlanillaJugador extends Contadores {
  equipoId: number;
  msJugados: number;
}

export interface EstadoPartido {
  fecha: string | null;
  lugar: string | null;
  local: EquipoEnVivo;
  visitante: EquipoEnVivo;
  jugadores: Record<number, PlanillaJugador>;
  equipos: Record<number, Contadores>;
  reloj: {
    duracionMs: number;
    /** Tiempo que quedaba la última vez que se paró o se acumuló. */
    restanteMs: number;
    /** Momento (Date.now) en que arrancó; null si está parado. */
    corriendoDesde: number | null;
  };
}

export const MAX_EN_CANCHA = 5;
const CLAVE = 'statsapp.partidoEnVivo';
const MAX_DESHACER = 100;
const DURACION_CUARTO = 10 * 60 * 1000;

/**
 * Estado del partido que se está anotando. Se guarda en localStorage en cada cambio,
 * así que una recarga de la página no pierde nada.
 * Las funciones que dependen de la hora reciben `ahora` para poder probarlas.
 */
@Injectable({ providedIn: 'root' })
export class PartidoEnVivo {
  private readonly api = inject(Api);
  private readonly historial: EstadoPartido[] = [];

  readonly estado = signal<EstadoPartido | null>(leer());
  readonly puedeDeshacer = signal(false);

  readonly puntosLocal = computed(() => this.puntos(this.estado()?.local.id));
  readonly puntosVisitante = computed(() => this.puntos(this.estado()?.visitante.id));

  constructor() {
    effect(() => {
      const estado = this.estado();
      if (estado) localStorage.setItem(CLAVE, JSON.stringify(estado));
      else localStorage.removeItem(CLAVE);
    });
  }

  iniciar(datos: { fecha: string | null; lugar: string | null; local: EquipoEnVivo; visitante: EquipoEnVivo }) {
    const jugadores: Record<number, PlanillaJugador> = {};
    for (const equipo of [datos.local, datos.visitante]) {
      for (const j of equipo.jugadores) jugadores[j.id] = { ...contadoresEnCero(), equipoId: equipo.id, msJugados: 0 };
    }
    this.historial.length = 0;
    this.puedeDeshacer.set(false);
    this.estado.set({
      ...datos,
      jugadores,
      equipos: { [datos.local.id]: contadoresEnCero(), [datos.visitante.id]: contadoresEnCero() },
      reloj: { duracionMs: DURACION_CUARTO, restanteMs: DURACION_CUARTO, corriendoDesde: null },
    });
  }

  descartar() {
    this.estado.set(null);
  }

  /** Suma una jugada al jugador y a su equipo. */
  registrar(jugadorId: number, accion: Accion) {
    this.modificar((e) => {
      const planilla = e.jugadores[jugadorId];
      aplicar(planilla, accion);
      aplicar(e.equipos[planilla.equipoId], accion);
    });
  }

  /** Corrige a mano los puntos de un equipo (no cambia los de los jugadores). */
  corregirPuntos(equipoId: number, puntos: number) {
    this.modificar((e) => (e.equipos[equipoId].puntos = Math.max(0, Math.round(puntos))));
  }

  /** Cambia los jugadores en cancha de un equipo. Los minutos se acumulan antes del cambio. */
  cambiar(equipoId: number, enCancha: number[], ahora = Date.now()) {
    this.modificar((e) => {
      acumular(e, ahora);
      const equipo = e.local.id === equipoId ? e.local : e.visitante;
      equipo.enCancha = enCancha.slice(0, MAX_EN_CANCHA);
    });
  }

  deshacer() {
    const anterior = this.historial.pop();
    if (!anterior) return;
    // El reloj y los minutos jugados no vuelven atrás: solo se deshacen jugadas, cambios y correcciones.
    const actual = this.estado()!;
    const restaurado = structuredClone(anterior);
    restaurado.reloj = actual.reloj;
    for (const id of Object.keys(restaurado.jugadores)) {
      restaurado.jugadores[+id].msJugados = actual.jugadores[+id].msJugados;
    }
    this.estado.set(restaurado);
    this.puedeDeshacer.set(this.historial.length > 0);
  }

  // Reloj

  restante(ahora = Date.now()) {
    const reloj = this.estado()?.reloj;
    if (!reloj) return 0;
    const corrido = reloj.corriendoDesde === null ? 0 : Math.max(0, ahora - reloj.corriendoDesde);
    return Math.max(0, reloj.restanteMs - corrido);
  }

  corriendo() {
    return this.estado()?.reloj.corriendoDesde != null;
  }

  arrancar(ahora = Date.now()) {
    this.actualizarReloj((e) => {
      if (e.reloj.corriendoDesde === null && e.reloj.restanteMs > 0) e.reloj.corriendoDesde = ahora;
    });
  }

  parar(ahora = Date.now()) {
    this.actualizarReloj((e) => {
      acumular(e, ahora);
      e.reloj.corriendoDesde = null;
    });
  }

  /** Lo llama la pantalla periódicamente: para el reloj cuando llega a cero. */
  revisar(ahora = Date.now()) {
    if (this.corriendo() && this.restante(ahora) === 0) this.parar(ahora);
  }

  /** Pone el reloj en un valor (parado). Sin argumento, vuelve a la duración del cuarto. */
  fijarReloj(ms?: number, ahora = Date.now()) {
    this.actualizarReloj((e) => {
      acumular(e, ahora);
      e.reloj.corriendoDesde = null;
      e.reloj.restanteMs = Math.max(0, ms ?? e.reloj.duracionMs);
    });
  }

  /** Arma el pedido para Partido/Crear, sin enviarlo. */
  pedido(ahora = Date.now()) {
    const e = structuredClone(this.estado()!);
    acumular(e, ahora);
    const pl = e.equipos[e.local.id].puntos;
    const pv = e.equipos[e.visitante.id].puntos;
    return {
      partido: {
        equipoLocal: e.local.id,
        equipoVisitante: e.visitante.id,
        ganador: pl > pv ? e.local.id : pv > pl ? e.visitante.id : null,
        fecha: e.fecha,
        lugar: e.lugar,
      },
      statJ: Object.entries(e.jugadores).map(([id, { msJugados, ...planilla }]) => ({
        ...planilla,
        jugadorId: Number(id),
        minutos: Math.round(msJugados),
      })),
      statP: [e.local.id, e.visitante.id].map((id) => ({ ...e.equipos[id], equipoId: id })),
    };
  }

  /** Guarda el partido en la API y lo borra de este dispositivo. Devuelve el id. */
  async finalizar() {
    const id = await this.api.post<number>('/Partido/Crear', this.pedido());
    this.descartar();
    return id;
  }

  private puntos(equipoId: number | undefined) {
    return equipoId === undefined ? 0 : (this.estado()?.equipos[equipoId]?.puntos ?? 0);
  }

  // Cambio que se puede deshacer.
  private modificar(cambio: (e: EstadoPartido) => void) {
    const actual = this.estado();
    if (!actual) return;
    this.historial.push(actual);
    if (this.historial.length > MAX_DESHACER) this.historial.shift();
    this.puedeDeshacer.set(true);
    const nuevo = structuredClone(actual);
    cambio(nuevo);
    this.estado.set(nuevo);
  }

  // Cambio del reloj, que no entra en el historial.
  private actualizarReloj(cambio: (e: EstadoPartido) => void) {
    const actual = this.estado();
    if (!actual) return;
    const nuevo = structuredClone(actual);
    cambio(nuevo);
    this.estado.set(nuevo);
  }
}

// Descuenta del reloj lo corrido desde la última vez y se lo suma a los jugadores en cancha.
function acumular(e: EstadoPartido, ahora: number) {
  const { reloj } = e;
  if (reloj.corriendoDesde === null) return;
  const corrido = Math.min(Math.max(0, ahora - reloj.corriendoDesde), reloj.restanteMs);
  reloj.restanteMs -= corrido;
  reloj.corriendoDesde = ahora;
  for (const id of [...e.local.enCancha, ...e.visitante.enCancha]) e.jugadores[id].msJugados += corrido;
}

function leer(): EstadoPartido | null {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
  } catch {
    return null;
  }
}
