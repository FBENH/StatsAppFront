import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Api, ErrorApi } from './api';
import { Accion } from './estadisticas';
import { calcular, duracionCuarto, Jugada, jugadaDeAccion } from './registro';

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
}

/** Algo que todavía no llegó a la API. */
export type Operacion = { tipo: 'alta'; jugada: Jugada } | { tipo: 'baja'; id: string };

export interface EstadoPartido {
  partidoId: number;
  fecha: string | null;
  lugar: string | null;
  duracionCuartoMin: number;
  local: EquipoEnVivo;
  visitante: EquipoEnVivo;
  jugadas: Jugada[];
  pendientes: Operacion[];
  cuarto: number;
  reloj: {
    /** Tiempo que quedaba la última vez que se paró. */
    restanteMs: number;
    /** Momento (Date.now) en que arrancó; null si está parado. */
    corriendoDesde: number | null;
  };
}

export type Conexion = 'ok' | 'enviando' | 'sin-conexion';

export const MAX_EN_CANCHA = 5;
const CLAVE = 'statsapp.partidoEnVivo.v2';
const REINTENTO_MS = 5000;

/**
 * Partido que se está anotando. Cada jugada se guarda en el dispositivo y se manda a la API
 * apenas se carga; si no hay conexión queda en una cola y se reintenta.
 * Las funciones que dependen de la hora reciben `ahora` para poder probarlas.
 */
@Injectable({ providedIn: 'root' })
export class PartidoEnVivo {
  private readonly api = inject(Api);
  private envio: Promise<void> | null = null;
  private reintento: ReturnType<typeof setTimeout> | null = null;

  readonly estado = signal<EstadoPartido | null>(leer());
  readonly conexion = signal<Conexion>('ok');
  /** Última jugada que la API rechazó (por ejemplo, datos inválidos). */
  readonly rechazo = signal<string | null>(null);

  readonly pendientes = computed(() => this.estado()?.pendientes.length ?? 0);
  readonly puedeDeshacer = computed(() => (this.estado()?.jugadas.length ?? 0) > 0);
  /** Planilla sin minutos en curso; para minutos al día usar planilla(ahora). */
  private readonly planillaBase = computed(() => {
    const e = this.estado();
    return e ? calcular(datosPartido(e), e.jugadas) : null;
  });
  readonly enCancha = computed(() => this.planillaBase()?.enCancha ?? {});
  readonly puntosLocal = computed(() => this.puntos(this.estado()?.local.id));
  readonly puntosVisitante = computed(() => this.puntos(this.estado()?.visitante.id));

  constructor() {
    effect(() => {
      const estado = this.estado();
      if (estado) localStorage.setItem(CLAVE, JSON.stringify(estado));
      else localStorage.removeItem(CLAVE);
    });
    if (typeof window !== 'undefined') window.addEventListener('online', () => this.sincronizar());
    if (this.pendientes() > 0) this.sincronizar();
  }

  /** Crea el partido en la API y empieza a anotarlo en este dispositivo. */
  async iniciar(datos: {
    fecha: string | null;
    lugar: string | null;
    duracionCuartoMin?: number;
    local: EquipoEnVivo;
    visitante: EquipoEnVivo;
    /** Partido del fixture de una liga que se empieza a anotar. */
    programadoId?: number;
  }) {
    const { programadoId, ...resto } = datos;
    const duracionCuartoMin = datos.duracionCuartoMin ?? 10;
    const partidoId = await this.api.post<number>('/Partido/Iniciar', {
      equipoLocal: datos.local.id,
      equipoVisitante: datos.visitante.id,
      fecha: datos.fecha,
      lugar: datos.lugar,
      duracionCuartoMin,
      partidoId: programadoId,
    });
    this.estado.set({
      ...resto,
      partidoId,
      duracionCuartoMin,
      jugadas: [],
      pendientes: [],
      cuarto: 1,
      reloj: { restanteMs: duracionCuarto(1, duracionCuartoMin), corriendoDesde: null },
    });
  }

  /** Sigue en este dispositivo un partido que se empezó en otro (o antes de perder los datos locales). */
  retomar(datos: Omit<EstadoPartido, 'pendientes' | 'cuarto' | 'reloj'>) {
    const ultima = datos.jugadas.at(-1);
    const cuarto = ultima?.cuarto ?? 1;
    this.estado.set({
      ...datos,
      pendientes: [],
      cuarto,
      reloj: {
        restanteMs: ultima?.relojMs ?? duracionCuarto(cuarto, datos.duracionCuartoMin),
        corriendoDesde: null,
      },
    });
  }

  /** Olvida el partido en este dispositivo y lo da de baja en la API. */
  async descartar() {
    const id = this.estado()?.partidoId;
    this.estado.set(null);
    if (id) await this.api.delete('/Partido/Eliminar', { id }).catch(() => undefined);
  }

  /** Registra una jugada de un jugador (o del equipo si jugadorId es null). */
  registrar(jugadorId: number | null, accion: Accion, equipoId?: number, ahora = Date.now()) {
    const e = this.estado();
    if (!e) return;
    const equipo = equipoId ?? (jugadorId === null ? null : equipoDe(e, jugadorId));
    if (equipo === null) return;
    this.agregar([{ ...jugadaDeAccion(accion), equipoId: equipo, jugadorId }], ahora);
  }

  /** Cambia los jugadores en cancha de un equipo: genera una jugada por cada uno que entra o sale. */
  cambiar(equipoId: number, enCancha: number[], ahora = Date.now()) {
    const actuales = this.enCancha()[equipoId] ?? [];
    const nuevos = enCancha.slice(0, MAX_EN_CANCHA);
    const salen = actuales.filter((id) => !nuevos.includes(id));
    const entran = nuevos.filter((id) => !actuales.includes(id));
    const cambios = Array.from({ length: Math.max(salen.length, entran.length) }, (_, i) => ({
      tipo: 'Cambio' as const,
      equipoId,
      jugadorId: entran[i] ?? null,
      saleId: salen[i] ?? null,
    }));
    this.agregar(cambios, ahora);
  }

  /** Registra una jugada con todos sus datos (tiros con ubicación, rebotes, etc.). Devuelve la jugada creada. */
  anotar(datos: Omit<Jugada, 'id' | 'numero' | 'cuarto' | 'relojMs'>, ahora = Date.now()) {
    return this.agregar([datos], ahora)[0];
  }

  /** Borra la última jugada. Un cambio de varios jugadores se deshace entero. Devuelve las jugadas borradas. */
  deshacer() {
    const e = this.estado();
    const ultima = e?.jugadas.at(-1);
    if (!e || !ultima) return [];
    const raiz = ultima.tipo === 'Cambio' ? (ultima.relacionadaId ?? ultima.id) : ultima.id;
    const ids = e.jugadas.filter((j) => j.id === raiz || (j.tipo === 'Cambio' && j.relacionadaId === raiz)).map((j) => j.id);
    return this.borrar(ids);
  }

  /** Borra jugadas del registro, en este dispositivo y en la API. */
  borrar(ids: string[]) {
    const e = this.estado();
    if (!e) return [];
    const borrar = new Set(ids);
    let pendientes = e.pendientes;
    for (const id of borrar) {
      // Si todavía no se mandó, alcanza con sacarla de la cola.
      const enCola = pendientes.some((o) => o.tipo === 'alta' && o.jugada.id === id);
      pendientes = enCola
        ? pendientes.filter((o) => !(o.tipo === 'alta' && o.jugada.id === id))
        : [...pendientes, { tipo: 'baja', id }];
    }
    const borradas = e.jugadas.filter((j) => borrar.has(j.id));
    this.estado.set({ ...e, jugadas: e.jugadas.filter((j) => !borrar.has(j.id)), pendientes });
    this.enviarSiHayConexion();
    return borradas;
  }

  /** Agrega un jugador al plantel del partido (por ejemplo, uno que llegó tarde). */
  sumarJugador(equipoId: number, jugador: JugadorEnVivo) {
    this.actualizar((e) => {
      const equipo = e.local.id === equipoId ? e.local : e.visitante;
      equipo.jugadores = [...equipo.jugadores, jugador].sort((a, b) => a.numero - b.numero);
    });
  }

  /** Planilla con los minutos de los que están en cancha al día. */
  planilla(ahora = Date.now()) {
    const e = this.estado();
    return e ? calcular(datosPartido(e), e.jugadas, { cuarto: e.cuarto, relojMs: this.restante(ahora) }) : null;
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
    this.actualizar((e) => {
      if (e.reloj.corriendoDesde === null && e.reloj.restanteMs > 0) e.reloj.corriendoDesde = ahora;
    });
  }

  parar(ahora = Date.now()) {
    const restante = this.restante(ahora);
    this.actualizar((e) => (e.reloj = { restanteMs: restante, corriendoDesde: null }));
  }

  /** Lo llama la pantalla periódicamente: para el reloj cuando llega a cero. */
  revisar(ahora = Date.now()) {
    if (this.corriendo() && this.restante(ahora) === 0) this.parar(ahora);
  }

  /** Pone el reloj en un valor, parado. */
  fijarReloj(ms: number) {
    this.actualizar((e) => (e.reloj = { restanteMs: Math.max(0, ms), corriendoDesde: null }));
  }

  /** Pasa al cuarto siguiente (del 5 en adelante son prórrogas de 5 minutos). */
  siguienteCuarto() {
    this.actualizar((e) => {
      e.cuarto++;
      e.reloj = { restanteMs: duracionCuarto(e.cuarto, e.duracionCuartoMin), corriendoDesde: null };
    });
  }

  /** Manda lo pendiente y termina el partido en la API. Devuelve el id. */
  async finalizar(ahora = Date.now()) {
    await this.sincronizar();
    const e = this.estado()!;
    if (e.pendientes.length > 0) {
      throw new ErrorApi('Hay jugadas sin enviar. Revisá la conexión y probá de nuevo.', 0);
    }
    await this.api.post('/Partido/Finalizar?id=' + e.partidoId, { cuarto: e.cuarto, relojMs: this.restante(ahora) });
    this.estado.set(null);
    return e.partidoId;
  }

  /** Manda la cola de pendientes en orden. Si no hay conexión, reintenta más tarde. */
  sincronizar(): Promise<void> {
    this.envio ??= this.enviar().finally(() => (this.envio = null));
    return this.envio;
  }

  // Sin conexión no se intenta en cada jugada: espera al reintento programado o al evento 'online'.
  private enviarSiHayConexion() {
    if (this.conexion() !== 'sin-conexion') this.sincronizar();
  }

  private async enviar() {
    if (this.reintento) clearTimeout(this.reintento);
    this.reintento = null;
    while (true) {
      const e = this.estado();
      if (!e || e.pendientes.length === 0) {
        this.conexion.set('ok');
        return;
      }
      // Las altas seguidas van en un solo pedido.
      const primera = e.pendientes[0];
      const lote = primera.tipo === 'alta' ? tomarAltas(e.pendientes) : [primera];
      this.conexion.set('enviando');
      try {
        if (primera.tipo === 'alta') {
          await this.api.post(`/Partido/Jugadas?partidoId=${e.partidoId}`, lote.map((o) => (o as { jugada: Jugada }).jugada));
        } else {
          await this.api.delete('/Partido/Jugadas', { partidoId: e.partidoId, id: primera.id });
        }
      } catch (error) {
        if (error instanceof ErrorApi && !error.reintentable) {
          // La API no la acepta: reintentar no sirve. Se saca de la cola y se avisa.
          this.rechazo.set(error.message);
        } else {
          this.conexion.set('sin-conexion');
          this.reintento = setTimeout(() => this.sincronizar(), REINTENTO_MS);
          return;
        }
      }
      // La cola pudo cambiar mientras se enviaba: se sacan solo las operaciones enviadas.
      const enviadas = new Set(lote.map(clave));
      this.estado.update((actual) => actual && { ...actual, pendientes: actual.pendientes.filter((o) => !enviadas.has(clave(o))) });
    }
  }

  private agregar(jugadas: Omit<Jugada, 'id' | 'numero' | 'cuarto' | 'relojMs'>[], ahora: number): Jugada[] {
    const e = this.estado();
    if (!e || jugadas.length === 0) return [];
    let numero = (e.jugadas.at(-1)?.numero ?? 0) + 1;
    const relojMs = this.restante(ahora);
    const nuevas: Jugada[] = [];
    for (const j of jugadas) {
      const id = crypto.randomUUID();
      // Los cambios hechos juntos quedan relacionados con el primero, para deshacerlos juntos.
      const relacionadaId = j.tipo === 'Cambio' && nuevas.length > 0 ? nuevas[0].id : (j.relacionadaId ?? null);
      nuevas.push({ ...j, id, numero: numero++, cuarto: e.cuarto, relojMs, relacionadaId });
    }
    this.estado.set({
      ...e,
      jugadas: [...e.jugadas, ...nuevas],
      pendientes: [...e.pendientes, ...nuevas.map((jugada) => ({ tipo: 'alta' as const, jugada }))],
    });
    this.enviarSiHayConexion();
    return nuevas;
  }

  private puntos(equipoId: number | undefined) {
    return equipoId === undefined ? 0 : (this.planillaBase()?.equipos[equipoId]?.puntos ?? 0);
  }

  // Cambio que no va a la API (reloj y cuarto).
  private actualizar(cambio: (e: EstadoPartido) => void) {
    const actual = this.estado();
    if (!actual) return;
    const nuevo = structuredClone(actual);
    cambio(nuevo);
    this.estado.set(nuevo);
  }
}

const datosPartido = (e: EstadoPartido) => ({
  localId: e.local.id,
  visitanteId: e.visitante.id,
  duracionCuartoMin: e.duracionCuartoMin,
});

const equipoDe = (e: EstadoPartido, jugadorId: number) =>
  e.local.jugadores.some((j) => j.id === jugadorId) ? e.local.id : e.visitante.id;

const clave = (o: Operacion) => (o.tipo === 'alta' ? 'alta:' + o.jugada.id : 'baja:' + o.id);

function tomarAltas(pendientes: Operacion[]) {
  const lote: Operacion[] = [];
  for (const o of pendientes) {
    if (o.tipo !== 'alta' || lote.length >= 200) break;
    lote.push(o);
  }
  return lote;
}

function leer(): EstadoPartido | null {
  try {
    localStorage.removeItem('statsapp.partidoEnVivo');
    return JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
  } catch {
    return null;
  }
}
