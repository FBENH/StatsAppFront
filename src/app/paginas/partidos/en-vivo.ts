import { Component, computed, DestroyRef, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Cancha, PuntoTiro } from '../../compartido/cancha';
import { FilaPlanilla, Planilla } from '../../compartido/planilla';
import { mensajeDeError } from '../../core/api';
import { valorDeTiro } from '../../core/cancha';
import { contadoresEnCero, formatearReloj } from '../../core/estadisticas';
import { EquipoEnVivo, JugadorEnVivo, MAX_EN_CANCHA, PartidoEnVivo } from '../../core/partido-en-vivo';
import { Jugada, TipoJugada } from '../../core/registro';
import { describir, nombreCorto, sinNombre } from '../../core/relato';
import { Jugadores } from '../../core/servicios';

type Simple = 'Rebote' | 'Asistencia' | 'Robo' | 'Tapon' | 'Perdida' | 'Falta';

/** Lo que la pantalla está esperando que se complete. */
type Pregunta =
  | { tipo: 'tiro'; x: number | null; y: number | null; valor: 2 | 3 | null; acierto: boolean | null; jugadorId: number | null }
  | { tipo: 'asistencia'; equipoId: number; tiradorId: number; tiroId: string }
  | { tipo: 'rebote' }
  | { tipo: 'libres'; equipoId: number | null; cantidad: number | null; tiradorId: number | null; hechos: number; ultimoAcierto: boolean }
  | { tipo: 'robo'; equipoRival: number; roboId: string }
  | { tipo: 'accion'; accion: Simple };

const ACCIONES: { accion: Simple; texto: string }[] = [
  { accion: 'Rebote', texto: 'Rebote' },
  { accion: 'Asistencia', texto: 'Asist.' },
  { accion: 'Robo', texto: 'Robo' },
  { accion: 'Tapon', texto: 'Tapón' },
  { accion: 'Perdida', texto: 'Pérdida' },
  { accion: 'Falta', texto: 'Falta' },
];

@Component({
  imports: [RouterLink, NgTemplateOutlet, Planilla, Cancha],
  templateUrl: './en-vivo.html',
  styleUrl: './en-vivo.css',
})
export default class EnVivo {
  protected readonly vivo = inject(PartidoEnVivo);
  private readonly router = inject(Router);
  private readonly jugadoresApi = inject(Jugadores);

  protected readonly acciones = ACCIONES;
  protected readonly maximo = MAX_EN_CANCHA;
  protected readonly dialogoMenu = viewChild<ElementRef<HTMLDialogElement>>('menu');
  protected readonly dialogoRegistro = viewChild<ElementRef<HTMLDialogElement>>('registro');
  protected readonly dialogoPlanilla = viewChild<ElementRef<HTMLDialogElement>>('planillaDialogo');

  protected readonly pregunta = signal<Pregunta | null>(null);
  /** Jugador tocado antes de elegir la jugada. */
  protected readonly elegido = signal<number | null>(null);
  protected readonly modoCambios = signal(false);
  /** En modo cambios: el que sale, a la espera de quién entra. */
  protected readonly sale = signal<number | null>(null);
  protected readonly aviso = signal<{ texto: string; ids: string[] } | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);
  private avisoTimer: ReturnType<typeof setTimeout> | null = null;

  // Se actualiza varias veces por segundo mientras el reloj corre.
  private readonly ahora = signal(Date.now());
  protected readonly reloj = computed(() => {
    this.vivo.estado();
    return formatearReloj(this.vivo.restante(this.ahora()));
  });
  protected readonly planilla = computed(() => {
    this.vivo.estado();
    return this.vivo.planilla(this.ahora());
  });

  private readonly jugadoresPorId = computed(() => {
    const e = this.vivo.estado();
    const mapa = new Map<number, JugadorEnVivo & { equipoId: number }>();
    for (const equipo of e ? [e.local, e.visitante] : []) {
      for (const j of equipo.jugadores) mapa.set(j.id, { ...j, equipoId: equipo.id });
    }
    return mapa;
  });

  /** Faltas de cada equipo en el cuarto actual. */
  protected readonly faltasCuarto = computed(() => {
    const e = this.vivo.estado();
    const faltas: Record<number, number> = {};
    for (const j of e?.jugadas ?? []) {
      if (j.tipo === 'Falta' && j.cuarto === e!.cuarto) faltas[j.equipoId] = (faltas[j.equipoId] ?? 0) + 1;
    }
    return faltas;
  });

  protected readonly tiros = computed((): PuntoTiro[] => {
    const jugadas = this.vivo.estado()?.jugadas ?? [];
    const conLugar = jugadas.filter((j) => j.tipo === 'Tiro' && j.x != null && j.y != null);
    return conLugar.map((j, i) => ({
      x: j.x!,
      y: j.y!,
      acierto: !!j.acierto,
      titulo: this.describir(j),
      nuevo: i === conLugar.length - 1,
    }));
  });

  /** Lugar del tiro que se está anotando. */
  protected readonly marca = computed(() => {
    const p = this.pregunta();
    return p?.tipo === 'tiro' && p.x !== null && p.y !== null ? { x: p.x, y: p.y } : null;
  });

  protected readonly ultimas = computed(() => (this.vivo.estado()?.jugadas ?? []).slice(-3).reverse());
  protected readonly registroInverso = computed(() => [...(this.vivo.estado()?.jugadas ?? [])].reverse());

  protected readonly planillas = computed(() => {
    const e = this.vivo.estado();
    const p = this.planilla();
    if (!e || !p) return [];
    return [e.local, e.visitante].map((equipo) => ({
      equipo: equipo.nombre,
      total: p.equipos[equipo.id],
      filas: equipo.jugadores.map((j): FilaPlanilla => {
        const fila = p.jugadores[j.id] ?? { ...contadoresEnCero(), msJugados: 0 };
        return {
          ...fila,
          titulo: `${nombreCorto(j)}${p.enCancha[equipo.id]?.includes(j.id) ? ' •' : ''}`,
          minutos: aHoras(fila.msJugados),
        };
      }),
    }));
  });

  constructor() {
    const intervalo = setInterval(() => {
      this.ahora.set(Date.now());
      this.vivo.revisar();
    }, 250);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(intervalo);
      if (this.avisoTimer) clearTimeout(this.avisoTimer);
    });

    // Al empezar no hay nadie en cancha: se abre el modo cambios para elegir los titulares.
    effect(() => {
      const e = this.vivo.estado();
      if (e && e.jugadas.length === 0 && Object.values(this.vivo.enCancha()).flat().length === 0) {
        this.modoCambios.set(true);
      }
    });
  }

  // Datos para la plantilla

  protected enCancha(equipo: EquipoEnVivo) {
    const ids = this.vivo.enCancha()[equipo.id] ?? [];
    return equipo.jugadores.filter((j) => ids.includes(j.id));
  }

  protected banco(equipo: EquipoEnVivo) {
    const ids = this.vivo.enCancha()[equipo.id] ?? [];
    return equipo.jugadores.filter((j) => !ids.includes(j.id));
  }

  protected equipos() {
    const e = this.vivo.estado();
    return e ? [e.local, e.visitante] : [];
  }

  protected rival(equipoId: number) {
    const e = this.vivo.estado()!;
    return e.local.id === equipoId ? e.visitante : e.local;
  }

  protected equipoDe(jugadorId: number) {
    return this.jugadoresPorId().get(jugadorId)?.equipoId ?? 0;
  }

  protected nombre(j: JugadorEnVivo) {
    return sinNombre(j.nombre) ? '' : j.nombre;
  }

  protected tiemposMuertos(equipoId: number) {
    return (this.vivo.estado()?.jugadas ?? []).filter((j) => j.tipo === 'TiempoMuerto' && j.equipoId === equipoId).length;
  }

  protected puntos(id: number) {
    return this.planilla()?.jugadores[id]?.puntos ?? 0;
  }

  protected faltas(id: number) {
    return this.planilla()?.jugadores[id]?.faltas ?? 0;
  }

  protected describir(j: Jugada) {
    const jugadores = this.jugadoresPorId();
    const e = this.vivo.estado();
    return describir(
      j,
      (id) => {
        const jugador = jugadores.get(id);
        return jugador ? nombreCorto(jugador) : `#?`;
      },
      (id) => (e?.local.id === id ? e.local.nombre : (e?.visitante.nombre ?? '')),
    );
  }

  protected momento(j: Jugada) {
    const cuarto = j.cuarto <= 4 ? `${j.cuarto}C` : `P${j.cuarto - 4}`;
    return j.relojMs == null ? cuarto : `${cuarto} ${formatearReloj(j.relojMs)}`;
  }

  protected nombreCuarto(cuarto: number) {
    return cuarto <= 4 ? `${cuarto}.º cuarto` : `Prórroga ${cuarto - 4}`;
  }

  /** Jugadores que se pueden tocar en la pregunta actual. */
  protected opciones(): { equipo: EquipoEnVivo; jugadores: JugadorEnVivo[] }[] {
    const p = this.pregunta();
    const todos = this.equipos().map((equipo) => ({ equipo, jugadores: this.enCancha(equipo) }));
    if (!p) return [];
    switch (p.tipo) {
      case 'asistencia':
        return todos
          .filter((o) => o.equipo.id === p.equipoId)
          .map((o) => ({ ...o, jugadores: o.jugadores.filter((j) => j.id !== p.tiradorId) }));
      case 'robo':
        return todos.filter((o) => o.equipo.id === p.equipoRival);
      case 'libres':
        return p.equipoId === null ? todos : todos.filter((o) => o.equipo.id === p.equipoId);
      default:
        return todos;
    }
  }

  protected titulo(): string {
    const p = this.pregunta();
    if (!p) return '';
    switch (p.tipo) {
      case 'tiro':
        return p.x === null ? 'Tiro' : `${p.valor === 3 ? 'Triple' : 'Doble'}: ¿entró y quién tiró?`;
      case 'asistencia':
        return '¿Hubo asistencia?';
      case 'rebote':
        return '¿Quién tomó el rebote?';
      case 'robo':
        return '¿A quién se la robaron?';
      case 'accion':
        return `${ACCIONES.find((a) => a.accion === p.accion)!.texto}: ¿de quién?`;
      case 'libres':
        if (p.cantidad === null) return '¿Cuántos tiros libres?';
        if (p.tiradorId === null) return '¿Quién tira los libres?';
        return `Libre ${p.hechos + 1} de ${p.cantidad}`;
    }
  }

  protected seleccionado(id: number) {
    const p = this.pregunta();
    if (p?.tipo === 'tiro') return p.jugadorId === id;
    return this.elegido() === id || this.sale() === id;
  }

  // Cancha y botones

  protected tocarCancha(lugar: { x: number; y: number }) {
    if (this.modoCambios()) return;
    const actual = this.pregunta();
    const jugadorId = actual?.tipo === 'tiro' ? actual.jugadorId : this.elegido();
    this.pregunta.set({ tipo: 'tiro', ...lugar, valor: valorDeTiro(lugar.x, lugar.y), acierto: null, jugadorId });
    this.elegido.set(null);
  }

  protected tiroSinLugar() {
    this.pregunta.set({ tipo: 'tiro', x: null, y: null, valor: null, acierto: null, jugadorId: this.elegido() });
    this.elegido.set(null);
  }

  protected libres() {
    const tirador = this.elegido();
    this.pregunta.set({
      tipo: 'libres',
      equipoId: tirador === null ? null : this.equipoDe(tirador),
      cantidad: null,
      tiradorId: tirador,
      hechos: 0,
      ultimoAcierto: true,
    });
    this.elegido.set(null);
  }

  protected accion(accion: Simple) {
    const elegido = this.elegido();
    this.elegido.set(null);
    if (elegido !== null) this.anotarSimple(accion, elegido);
    else this.pregunta.set({ tipo: 'accion', accion });
  }

  protected valor(valor: 2 | 3) {
    this.completarTiro({ valor });
  }

  protected resultado(acierto: boolean) {
    const p = this.pregunta();
    if (p?.tipo === 'tiro') this.completarTiro({ acierto });
    else if (p?.tipo === 'libres') this.anotarLibre(acierto);
  }

  protected cantidadLibres(cantidad: number) {
    const p = this.pregunta();
    if (p?.tipo === 'libres') this.pregunta.set({ ...p, cantidad });
  }

  protected reboteDeEquipo(equipoId: number) {
    this.anotarRebote(null, equipoId);
  }

  protected cerrarPregunta() {
    this.pregunta.set(null);
  }

  protected tocarJugador(id: number) {
    if (this.modoCambios()) return this.tocarEnCambios(id);
    const p = this.pregunta();
    const equipoId = this.equipoDe(id);
    if (!p) {
      this.elegido.update((actual) => (actual === id ? null : id));
      return;
    }
    switch (p.tipo) {
      case 'tiro':
        return this.completarTiro({ jugadorId: id });
      case 'asistencia':
        this.registrar({ tipo: 'Asistencia', equipoId, jugadorId: id, relacionadaId: p.tiroId });
        return this.pregunta.set(null);
      case 'rebote':
        return this.anotarRebote(id, equipoId);
      case 'robo':
        this.registrar({ tipo: 'Perdida', equipoId, jugadorId: id, relacionadaId: p.roboId });
        return this.pregunta.set(null);
      case 'libres':
        return this.pregunta.set({ ...p, tiradorId: id, equipoId });
      case 'accion':
        return this.anotarSimple(p.accion, id);
    }
  }

  // Registro de jugadas

  private completarTiro(cambios: Partial<{ valor: 2 | 3; acierto: boolean; jugadorId: number }>) {
    const p = this.pregunta();
    if (p?.tipo !== 'tiro') return;
    const tiro = { ...p, ...cambios };
    if (tiro.valor === null || tiro.acierto === null || tiro.jugadorId === null) return this.pregunta.set(tiro);
    const equipoId = this.equipoDe(tiro.jugadorId);
    const jugada = this.registrar({
      tipo: 'Tiro',
      equipoId,
      jugadorId: tiro.jugadorId,
      valor: tiro.valor,
      acierto: tiro.acierto,
      x: tiro.x,
      y: tiro.y,
    });
    this.pregunta.set(
      tiro.acierto ? { tipo: 'asistencia', equipoId, tiradorId: tiro.jugadorId, tiroId: jugada.id } : { tipo: 'rebote' },
    );
  }

  private anotarLibre(acierto: boolean) {
    const p = this.pregunta();
    if (p?.tipo !== 'libres' || p.tiradorId === null || p.cantidad === null) return;
    this.registrar({ tipo: 'Libre', equipoId: this.equipoDe(p.tiradorId), jugadorId: p.tiradorId, acierto });
    const hechos = p.hechos + 1;
    if (hechos < p.cantidad) return this.pregunta.set({ ...p, hechos, ultimoAcierto: acierto });
    this.pregunta.set(acierto ? null : { tipo: 'rebote' });
  }

  private anotarRebote(jugadorId: number | null, equipoId: number) {
    // Es ofensivo si lo toma el mismo equipo que falló el último tiro.
    const fallo = [...(this.vivo.estado()?.jugadas ?? [])].reverse().find((j) => j.tipo === 'Tiro' || j.tipo === 'Libre');
    const ofensivo = !!fallo && !fallo.acierto && fallo.equipoId === equipoId;
    this.registrar({ tipo: 'Rebote', equipoId, jugadorId, ofensivo });
    this.pregunta.set(null);
  }

  private anotarSimple(accion: Simple, jugadorId: number) {
    if (accion === 'Rebote') return this.anotarRebote(jugadorId, this.equipoDe(jugadorId));
    const equipoId = this.equipoDe(jugadorId);
    const jugada = this.registrar({ tipo: accion as TipoJugada, equipoId, jugadorId });
    if (accion === 'Falta') {
      this.pregunta.set({
        tipo: 'libres',
        equipoId: this.rival(equipoId).id,
        cantidad: null,
        tiradorId: null,
        hechos: 0,
        ultimoAcierto: true,
      });
    } else if (accion === 'Robo') {
      this.pregunta.set({ tipo: 'robo', equipoRival: this.rival(equipoId).id, roboId: jugada.id });
    } else {
      this.pregunta.set(null);
    }
  }

  private registrar(datos: Omit<Jugada, 'id' | 'numero' | 'cuarto' | 'relojMs'>) {
    const jugada = this.vivo.anotar(datos);
    this.avisar(this.describir(jugada), [jugada.id]);
    return jugada;
  }

  private avisar(texto: string, ids: string[]) {
    if (this.avisoTimer) clearTimeout(this.avisoTimer);
    this.aviso.set({ texto, ids });
    this.avisoTimer = setTimeout(() => this.aviso.set(null), 5000);
  }

  protected deshacerAviso() {
    const aviso = this.aviso();
    if (!aviso) return;
    this.vivo.borrar(aviso.ids);
    this.aviso.set(null);
    // Si la jugada abrió una pregunta (asistencia, rebote...), ya no corresponde.
    this.pregunta.set(null);
  }

  protected deshacer() {
    const borradas = this.vivo.deshacer();
    this.pregunta.set(null);
    if (borradas.length > 0) {
      if (this.avisoTimer) clearTimeout(this.avisoTimer);
      this.aviso.set(null);
    }
  }

  protected borrarDelRegistro(j: Jugada) {
    if (!confirm(`¿Borrar "${this.describir(j)}"?`)) return;
    this.vivo.borrar([j.id]);
  }

  // Cambios

  protected alternarCambios() {
    this.modoCambios.update((v) => !v);
    this.sale.set(null);
    this.pregunta.set(null);
    this.elegido.set(null);
  }

  private tocarEnCambios(id: number) {
    const equipoId = this.equipoDe(id);
    const enCancha = this.vivo.enCancha()[equipoId] ?? [];
    const sale = this.sale();
    if (enCancha.includes(id)) {
      this.sale.set(sale === id ? null : id);
      return;
    }
    // Toca uno del banco: entra por el que se eligió, o se suma si hay lugar.
    if (sale !== null && this.equipoDe(sale) === equipoId) {
      this.registrarCambio(equipoId, id, sale);
      this.sale.set(null);
    } else if (enCancha.length < MAX_EN_CANCHA) {
      this.registrarCambio(equipoId, id, null);
    } else {
      this.error.set('Ya hay 5 en cancha: tocá primero al que sale.');
    }
  }

  private registrarCambio(equipoId: number, entra: number, sale: number | null) {
    this.error.set(null);
    this.registrar({ tipo: 'Cambio', equipoId, jugadorId: entra, saleId: sale });
  }

  protected sacar() {
    const sale = this.sale();
    if (sale === null) return;
    this.registrar({ tipo: 'Cambio', equipoId: this.equipoDe(sale), jugadorId: null, saleId: sale });
    this.sale.set(null);
  }

  protected async agregarJugador(equipo: EquipoEnVivo) {
    const texto = prompt(`Número del jugador nuevo de ${equipo.nombre}`);
    if (texto === null) return;
    const numero = Number(texto);
    if (!Number.isInteger(numero) || numero < 0 || numero > 99) return this.error.set('El número tiene que ser de 0 a 99.');
    if (equipo.jugadores.some((j) => j.numero === numero)) return this.error.set(`Ya hay un #${numero} en ${equipo.nombre}.`);
    try {
      const nombre = `#${numero}`;
      const id = await this.jugadoresApi.crear({
        nombre, numero, equipoId: equipo.id, posicion: null, altura: null, peso: null, foto: null,
      });
      this.vivo.sumarJugador(equipo.id, { id, nombre, numero });
      this.error.set(null);
    } catch (e) {
      this.error.set('No se pudo agregar el jugador (hace falta conexión). ' + mensajeDeError(e));
    }
  }

  // Menú

  protected abrir(dialogo: 'menu' | 'registro' | 'planilla') {
    const dialogos = { menu: this.dialogoMenu, registro: this.dialogoRegistro, planilla: this.dialogoPlanilla };
    dialogos[dialogo]()?.nativeElement.showModal();
  }

  protected tiempoMuerto(equipoId: number) {
    this.registrar({ tipo: 'TiempoMuerto', equipoId });
    this.vivo.parar();
    this.dialogoMenu()?.nativeElement.close();
  }

  protected alternarReloj() {
    if (this.vivo.corriendo()) this.vivo.parar();
    else this.vivo.arrancar();
  }

  protected editarReloj() {
    const texto = prompt('Tiempo restante (m:ss)', formatearReloj(this.vivo.restante()));
    if (texto === null) return;
    const partes = texto.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!partes) return this.error.set('El tiempo tiene que tener la forma m:ss, por ejemplo 7:30.');
    this.error.set(null);
    this.vivo.fijarReloj((Number(partes[1]) * 60 + Number(partes[2] ?? 0)) * 1000);
  }

  protected siguienteCuarto() {
    const e = this.vivo.estado();
    if (!e || !confirm(`¿Terminar el ${this.nombreCuarto(e.cuarto).toLowerCase()} y pasar al siguiente?`)) return;
    this.vivo.siguienteCuarto();
    this.dialogoMenu()?.nativeElement.close();
  }

  protected async finalizar() {
    if (!confirm('¿Terminar el partido y guardarlo?')) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      const id = await this.vivo.finalizar();
      this.router.navigate(['/partidos', id]);
    } catch (e) {
      this.error.set(mensajeDeError(e));
      this.dialogoMenu()?.nativeElement.close();
    } finally {
      this.guardando.set(false);
    }
  }

  protected descartar() {
    if (!confirm('¿Descartar el partido? Se pierde todo lo anotado.')) return;
    this.vivo.descartar();
    this.router.navigate(['/partidos']);
  }
}

// Milisegundos -> "hh:mm:ss", el mismo formato que devuelve la API.
function aHoras(ms: number) {
  const s = Math.floor(ms / 1000);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor(s / 60) % 60)}:${dos(s % 60)}`;
}
