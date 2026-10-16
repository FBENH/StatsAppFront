import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BotonEliminar } from '../../compartido/boton-eliminar';
import { FilaPlanilla, Planilla } from '../../compartido/planilla';
import { mensajeDeError } from '../../core/api';
import { porcentaje, tirosDeCampo } from '../../core/estadisticas';
import { Contadores } from '../../core/modelos';
import { Partidos } from '../../core/servicios';

@Component({
  imports: [DatePipe, Planilla, BotonEliminar, RouterLink],
  template: `
    <section class="contenedor">
      @if (partido.value(); as p) {
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

        <h2>{{ p.local }}</h2>
        <app-planilla [conMinutos]="true" [filas]="filas(p.equipoLocalId)" [total]="local()" />
        <h2>{{ p.visitante }}</h2>
        <app-planilla [conMinutos]="true" [filas]="filas(p.equipoVisitanteId)" [total]="visitante()" />

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
  `,
})
export default class Partido {
  private readonly servicio = inject(Partidos);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly error = signal<string | null>(null);
  protected readonly partido = resource({ params: () => +this.id(), loader: ({ params }) => this.servicio.obtener(params) });

  protected readonly local = computed(() => this.estadisticaDe(this.partido.value()?.equipoLocalId));
  protected readonly visitante = computed(() => this.estadisticaDe(this.partido.value()?.equipoVisitanteId));

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
    return (this.partido.value()?.jugadores ?? [])
      .map((j) => ({ j, s: j.estadisticasJugador[0] }))
      .filter(({ s }) => s?.equipoId === equipoId)
      .sort((a, b) => a.j.numero - b.j.numero)
      .map(({ j, s }) => ({ ...s, titulo: `#${j.numero} ${j.nombre}`, enlace: ['/jugadores', j.id] }));
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
    return this.partido.value()?.statPartido.find((s) => s.equipoId === equipoId) ?? null;
  }
}
