import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BotonEliminar } from '../../compartido/boton-eliminar';
import { FilaPlanilla, Planilla } from '../../compartido/planilla';
import { mensajeDeError } from '../../core/api';
import { formatearReloj, porcentaje, tirosDeCampo } from '../../core/estadisticas';
import { Contadores } from '../../core/modelos';
import { Cancha, PuntoTiro } from '../../compartido/cancha';
import { describir, nombreCorto } from '../../core/relato';
import { Jugada } from '../../core/registro';
import { Partidos } from '../../core/servicios';
import { valor } from '../../core/recurso';

@Component({
  imports: [DatePipe, Planilla, BotonEliminar, RouterLink, Cancha],
  template: `
    <section class="contenedor">
      @if (partido.hasValue() && partido.value(); as p) {
        <div class="tarjeta marcador">
          <div class="lado">
            <span class="nombre">{{ p.local }}</span>
            <strong class="puntos local">{{ local()?.puntos ?? 0 }}</strong>
          </div>
          <span class="suave">–</span>
          <div class="lado">
            <strong class="puntos visitante">{{ visitante()?.puntos ?? 0 }}</strong>
            <span class="nombre">{{ p.visitante }}</span>
          </div>
        </div>
        <p class="suave centro">{{ p.fecha | date: 'dd/MM/yyyy' }}{{ p.lugar ? ' · ' + p.lugar : '' }}</p>
        @if (p.estado === 'EnCurso') {
          <p class="tarjeta centro">
            Este partido todavía se está anotando; la planilla se completa al terminarlo.
            <a routerLink="/partidos/nuevo">Seguir anotando</a>
          </p>
        }

        <h2>Comparación</h2>
        <div class="tabla-envoltorio">
          <table class="tabla comparacion">
            <thead><tr><th>{{ p.local }}</th><th></th><th>{{ p.visitante }}</th></tr></thead>
            <tbody>
              @for (f of comparacion(); track f.nombre) {
                <tr><td>{{ f.local }}</td><th>{{ f.nombre }}</th><td>{{ f.visitante }}</td></tr>
              }
            </tbody>
          </table>
        </div>

        @if (hayTiros()) {
          <h2>Mapa de tiros</h2>
          <div class="mapas">
            @for (m of mapas(); track m.equipoId) {
              <figure class="tarjeta">
                <figcaption>
                  <strong>{{ m.nombre }}</strong>
                  <span class="suave">{{ m.aciertos }}/{{ m.tiros.length }} con ubicación</span>
                </figcaption>
                <app-cancha [tiros]="m.tiros" [etiqueta]="'Mapa de tiros de ' + m.nombre" />
              </figure>
            }
          </div>
          <label class="campo filtro">
            <span>Ver solo a</span>
            <select (change)="filtro.set(+$any($event.target).value || null)">
              <option value="">Todos</option>
              @for (j of jugadoresOrdenados(); track j.id) { <option [value]="j.id">{{ nombre(j) }}</option> }
            </select>
          </label>
        }

        <h2>{{ p.local }}</h2>
        <app-planilla [conMinutos]="true" [filas]="filas(p.equipoLocalId)" [total]="local()" />
        <h2>{{ p.visitante }}</h2>
        <app-planilla [conMinutos]="true" [filas]="filas(p.equipoVisitanteId)" [total]="visitante()" />

        @if (relato().length > 0) {
          <details class="relato">
            <summary>Jugada a jugada ({{ relato().length }})</summary>
            <ol>
              @for (r of relato(); track r.id) {
                <li><span class="suave">{{ r.momento }}</span> {{ r.texto }} <span class="suave">{{ r.marcador }}</span></li>
              }
            </ol>
          </details>
        }

        <div class="fila eliminar">
          <app-boton-eliminar pregunta="¿Eliminar el partido?" (confirmado)="eliminar()" />
          @if (error()) { <span class="error">{{ error() }}</span> }
        </div>
      } @else if (partido.error()) {
        <p class="error">No se encontró el partido.</p>
      } @else {
        <p class="suave">Cargando…</p>
      }
    </section>
  `,
  styles: `
    h2 { margin-top: 1.75rem; }
    .marcador { display: flex; align-items: center; justify-content: center; gap: 1rem; }
    .lado { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .lado:first-child { justify-content: flex-end; }
    .nombre { font-weight: 700; font-size: 1.1rem; }
    .puntos { font-size: 2.5rem; font-variant-numeric: tabular-nums; }
    .puntos.local { color: var(--local); }
    .puntos.visitante { color: var(--visitante); }
    .centro { text-align: center; }
    .comparacion td, .comparacion th { text-align: center !important; }
    .eliminar { margin-top: 2rem; }
    .mapas { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    figure { margin: 0; }
    figcaption { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .filtro { max-width: 16rem; margin-top: 0.75rem; }
    .relato { margin-top: 1.75rem; }
    .relato summary { cursor: pointer; font-weight: 600; }
    .relato ol { list-style: none; padding: 0; display: grid; gap: 0.25rem; font-size: 0.9rem; }
  `,
})
export default class Partido {
  private readonly servicio = inject(Partidos);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly error = signal<string | null>(null);
  protected readonly partido = resource({ params: () => +this.id(), loader: ({ params }) => this.servicio.obtener(params) });

  private readonly jugadas = resource({
    params: () => +this.id(),
    loader: ({ params }) => this.servicio.jugadas(params),
  });
  protected readonly filtro = signal<number | null>(null);

  protected readonly jugadoresOrdenados = computed(() =>
    [...(valor(this.partido)?.jugadores ?? [])].sort((a, b) => a.numero - b.numero),
  );
  protected readonly hayTiros = computed(() => (valor(this.jugadas) ?? []).some((j) => j.tipo === 'Tiro' && j.x != null));

  protected readonly mapas = computed(() => {
    const p = valor(this.partido);
    if (!p) return [];
    const filtro = this.filtro();
    return [
      { equipoId: p.equipoLocalId, nombre: p.local },
      { equipoId: p.equipoVisitanteId, nombre: p.visitante },
    ].map((equipo) => {
      const tiros: PuntoTiro[] = (valor(this.jugadas) ?? [])
        .filter((j) => j.tipo === 'Tiro' && j.x != null && j.y != null && j.equipoId === equipo.equipoId)
        .filter((j) => filtro === null || j.jugadorId === filtro)
        .map((j) => ({ x: j.x!, y: j.y!, acierto: !!j.acierto, titulo: this.texto(j) }));
      return { ...equipo, tiros, aciertos: tiros.filter((t) => t.acierto).length };
    });
  });

  /** Cada jugada con el marcador como quedó después. */
  protected readonly relato = computed(() => {
    const p = valor(this.partido);
    if (!p) return [];
    let local = 0;
    let visitante = 0;
    return (valor(this.jugadas) ?? [])
      .filter((j) => j.tipo !== 'Cambio')
      .map((j) => {
        const puntos = (j.tipo === 'Tiro' || j.tipo === 'Libre') && j.acierto ? (j.tipo === 'Libre' ? 1 : (j.valor ?? 2)) : 0;
        if (j.equipoId === p.equipoLocalId) local += puntos;
        else visitante += puntos;
        const cuarto = j.cuarto <= 4 ? `${j.cuarto}C` : `P${j.cuarto - 4}`;
        return {
          id: j.id,
          momento: j.relojMs == null ? cuarto : `${cuarto} ${formatearReloj(j.relojMs)}`,
          texto: this.texto(j),
          marcador: puntos ? `${local}-${visitante}` : '',
        };
      })
      .reverse();
  });

  protected nombre(j: { numero: number; nombre: string }) {
    return nombreCorto(j);
  }

  private texto(j: Jugada) {
    const p = valor(this.partido)!;
    return describir(
      j,
      (id) => {
        const jugador = p.jugadores.find((x) => x.id === id);
        return jugador ? nombreCorto(jugador) : '#?';
      },
      (id) => (id === p.equipoLocalId ? p.local : p.visitante),
    );
  }

  protected readonly local = computed(() => this.estadisticaDe(valor(this.partido)?.equipoLocalId));
  protected readonly visitante = computed(() => this.estadisticaDe(valor(this.partido)?.equipoVisitanteId));

  protected readonly comparacion = computed(() => {
    const l = this.local();
    const v = this.visitante();
    if (!l || !v) return [];
    const pct = (a: number, i: number) => `${porcentaje(a, i) ?? '–'}% (${a}/${i})`;
    const tc = (c: Contadores) => tirosDeCampo(c);
    return [
      { nombre: 'Tiros de campo', local: pct(tc(l).aciertos, tc(l).intentos), visitante: pct(tc(v).aciertos, tc(v).intentos) },
      { nombre: 'Triples', local: pct(l.aciertos3Puntos, l.intentos3Puntos), visitante: pct(v.aciertos3Puntos, v.intentos3Puntos) },
      { nombre: 'Libres', local: pct(l.aciertos1Punto, l.intentos1Punto), visitante: pct(v.aciertos1Punto, v.intentos1Punto) },
      { nombre: 'Rebotes', local: l.rebotes, visitante: v.rebotes },
      { nombre: 'Asistencias', local: l.asistencias, visitante: v.asistencias },
      { nombre: 'Robos', local: l.robos, visitante: v.robos },
      { nombre: 'Tapones', local: l.tapones, visitante: v.tapones },
      { nombre: 'Pérdidas', local: l.perdidas, visitante: v.perdidas },
      { nombre: 'Faltas', local: l.faltas, visitante: v.faltas },
    ];
  });

  protected filas(equipoId: number): FilaPlanilla[] {
    return (valor(this.partido)?.jugadores ?? [])
      .map((j) => ({ j, s: j.estadisticasJugador[0] }))
      .filter(({ s }) => s?.equipoId === equipoId)
      .sort((a, b) => a.j.numero - b.j.numero)
      .map(({ j, s }) => ({ ...s, titulo: nombreCorto(j), enlace: ['/jugadores', j.id] }));
  }

  protected async eliminar() {
    try {
      await this.servicio.eliminar(+this.id());
      this.router.navigate(['/partidos']);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  private estadisticaDe(equipoId: number | undefined) {
    return valor(this.partido)?.statPartido.find((s) => s.equipoId === equipoId) ?? null;
  }
}
