import { Component, computed, effect, inject, input, resource, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cancha, PuntoTiro } from '../../compartido/cancha';
import { FilaPlanilla, Planilla } from '../../compartido/planilla';
import { contadoresEnCero, formatearReloj } from '../../core/estadisticas';
import { EnVivo } from '../../core/en-vivo';
import { EstadoPartidoLiga, LigasPublicas } from '../../core/ligas';
import { calcular, Jugada } from '../../core/registro';
import { nombreCorto } from '../../core/relato';
import { parcialActual, relatar } from '../../core/relato-partido';
import { valor } from '../../core/recurso';

type Pestania = 'relato' | 'planilla';

/** Un partido de una liga en vivo: marcador, tiros en la cancha, relato y planilla, actualizados por SignalR. */
@Component({
  imports: [RouterLink, Cancha, Planilla],
  templateUrl: './partido-vivo.html',
  styleUrl: './partido-vivo.css',
})
export default class PartidoVivo {
  private readonly api = inject(LigasPublicas);

  readonly slug = input.required<string>();
  readonly id = input.required<string>();

  protected readonly detalle = resource({
    params: () => ({ slug: this.slug(), id: +this.id() }),
    loader: ({ params }) => this.api.partido(params.slug, params.id),
  });
  protected readonly jugadas = signal<Jugada[]>([]);
  protected readonly estado = signal<EstadoPartidoLiga | null>(null);
  protected readonly pestania = signal<Pestania>('relato');
  /** Equipo o jugador cuyos tiros se muestran; null son todos. */
  protected readonly filtroTiros = signal<string>('todos');
  /** El último tiro, que se muestra con su cartel en la cancha unos segundos. */
  protected readonly ultimoTiro = signal<{ id: string; x: number; y: number; texto: string; acierto: boolean } | null>(null);
  private cartelTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly nombres = computed(() => {
    const mapa = new Map<number, string>();
    for (const j of valor(this.detalle)?.jugadores ?? []) mapa.set(j.id, nombreCorto(j));
    return mapa;
  });
  private readonly datos = computed(() => {
    const d = valor(this.detalle)!;
    return {
      localId: d.local.id,
      visitanteId: d.visitante.id,
      quien: (id: number) => this.nombres().get(id) ?? '#?',
      equipo: (id: number) => (id === d.local.id ? d.local.nombre : d.visitante.nombre),
    };
  });

  private readonly planillaEnVivo = computed(() => {
    const d = valor(this.detalle);
    if (!d || this.jugadas().length === 0) return null;
    return calcular({ localId: d.local.id, visitanteId: d.visitante.id, duracionCuartoMin: d.duracionCuartoMin }, this.jugadas());
  });
  protected readonly puntos = computed(() => {
    const d = valor(this.detalle);
    if (!d) return { local: 0, visitante: 0 };
    const enVivo = this.planillaEnVivo();
    const de = (id: number) => enVivo?.equipos[id]?.puntos ?? d.equipos.find((e) => e.equipoId === id)?.puntos ?? 0;
    return { local: de(d.local.id), visitante: de(d.visitante.id) };
  });

  protected readonly relato = computed(() => (valor(this.detalle) ? relatar(this.jugadas(), this.datos()) : []));
  protected readonly relatoInverso = computed(() => [...this.relato()].reverse());
  protected readonly parcial = computed(() => {
    const p = parcialActual(this.relato());
    return p && this.estado() === 'EnCurso' ? { ...p, equipo: this.datos().equipo(p.equipoId) } : null;
  });

  protected readonly momento = computed(() => {
    const ultima = this.jugadas().at(-1);
    if (!ultima) return '';
    const cuarto = ultima.cuarto <= 4 ? `${ultima.cuarto}.º cuarto` : `Prórroga ${ultima.cuarto - 4}`;
    return ultima.relojMs == null ? cuarto : `${cuarto} · ${formatearReloj(ultima.relojMs)}`;
  });

  protected readonly tiros = computed((): PuntoTiro[] => {
    const filtro = this.filtroTiros();
    const ultimo = this.ultimoTiro()?.id;
    return this.jugadas()
      .filter((j) => j.tipo === 'Tiro' && j.x != null && j.y != null)
      .filter((j) => filtro === 'todos' || `e${j.equipoId}` === filtro || `j${j.jugadorId}` === filtro)
      .map((j) => ({ x: j.x!, y: j.y!, acierto: !!j.acierto, titulo: this.datos().quien(j.jugadorId ?? 0), nuevo: j.id === ultimo }));
  });
  protected readonly tirosResumen = computed(() => {
    const t = this.tiros();
    return `${t.filter((x) => x.acierto).length}/${t.length}`;
  });

  /** Diferencia de puntos (local menos visitante) después de cada jugada que suma. */
  protected readonly diferencia = computed(() => {
    const puntos = [0, ...this.relato().filter((l) => l.puntos > 0).map((l) => l.local - l.visitante)];
    const maximo = Math.max(5, ...puntos.map(Math.abs));
    const ancho = 300;
    const alto = 80;
    const x = (i: number) => (puntos.length === 1 ? 0 : (i / (puntos.length - 1)) * ancho);
    const y = (v: number) => alto / 2 - (v / maximo) * (alto / 2 - 4);
    return {
      ancho,
      alto,
      linea: puntos.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '),
      maximo,
      actual: puntos.at(-1)!,
    };
  });

  protected readonly planillas = computed(() => {
    const d = valor(this.detalle);
    if (!d) return [];
    const enVivo = this.planillaEnVivo();
    const guardada = new Map(d.planilla.map((p) => [p.estadistica.jugadorId, p.estadistica]));
    return [d.local, d.visitante].map((equipo) => {
      const jugadores = d.jugadores.filter((j) => (enVivo?.jugadores[j.id] ?? guardada.get(j.id))?.equipoId === equipo.id);
      const filas = jugadores.map((j): FilaPlanilla => {
        const vivo = enVivo?.jugadores[j.id];
        const fila = vivo ?? guardada.get(j.id) ?? { ...contadoresEnCero() };
        return { ...fila, titulo: nombreCorto(j), minutos: vivo ? aHoras(vivo.msJugados) : ((fila as { minutos?: string }).minutos ?? null) };
      });
      const total = enVivo?.equipos[equipo.id] ?? d.equipos.find((e) => e.equipoId === equipo.id) ?? contadoresEnCero();
      return { equipo: equipo.nombre, filas, total };
    });
  });

  constructor() {
    effect(() => {
      const d = valor(this.detalle);
      if (!d) return;
      // Pueden haber llegado jugadas por SignalR mientras se cargaba el partido: se juntan por id.
      const llegadas = untracked(this.jugadas).filter((j) => !d.jugadas.some((x) => x.id === j.id));
      this.jugadas.set([...d.jugadas, ...llegadas].sort((a, b) => a.numero - b.numero));
      this.estado.set(d.estado);
    });

    effect((alLimpiar) => {
      const id = +this.id();
      untracked(() => {
        this.jugadas.set([]);
        this.ultimoTiro.set(null);
      });
      alLimpiar(() => clearTimeout(this.cartelTimer));
      this.vivo.seguirPartido(
        id,
        {
          jugadas: (nuevas) => this.recibir(nuevas),
          jugadaBorrada: (borrada) => this.jugadas.update((js) => js.filter((j) => j.id !== borrada)),
          partido: (p) => this.estado.set(p.estado),
          reconectado: () => this.detalle.reload(),
        },
        alLimpiar,
      );
    });
  }

  private readonly vivo = inject(EnVivo);

  protected nombreTiro(id: number) {
    return this.nombres().get(id) ?? '';
  }

  protected jugadoresDe(equipoId: number) {
    return (valor(this.detalle)?.jugadores ?? []).filter((j) => j.equipoId === equipoId);
  }

  private recibir(nuevas: Jugada[]) {
    const conocidas = new Set(this.jugadas().map((j) => j.id));
    const agregar = nuevas.filter((j) => !conocidas.has(j.id));
    if (agregar.length === 0) return;
    this.jugadas.update((js) => [...js, ...agregar].sort((a, b) => a.numero - b.numero));
    const tiro = agregar.filter((j) => j.tipo === 'Tiro' && j.x != null).at(-1);
    if (tiro) {
      const quien = this.nombres().get(tiro.jugadorId ?? 0) ?? '';
      const texto = tiro.acierto ? `${quien} · ${tiro.valor === 3 ? 'triple' : 'doble'}` : `${quien} · falla`;
      this.ultimoTiro.set({ id: tiro.id, x: tiro.x!, y: tiro.y!, texto, acierto: !!tiro.acierto });
      clearTimeout(this.cartelTimer);
      this.cartelTimer = setTimeout(() => this.ultimoTiro.set(null), 3500);
    }
  }
}

function aHoras(ms: number) {
  const s = Math.floor(ms / 1000);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor(s / 60) % 60)}:${dos(s % 60)}`;
}
