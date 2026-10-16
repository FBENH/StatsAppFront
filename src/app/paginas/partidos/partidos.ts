import { DatePipe } from '@angular/common';
import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Partidos as PartidosServicio } from '../../core/servicios';

@Component({
  imports: [RouterLink, DatePipe],
  template: `
    <section class="contenedor">
      <div class="encabezado">
        <h1>Partidos</h1>
        <a class="boton primario" routerLink="/partidos/nuevo">Nuevo partido</a>
      </div>
      @if (partidos.value()) {
        @for (p of ordenados(); track p.id) {
          <a class="tarjeta partido" [routerLink]="['/partidos', p.id]">
            <span class="equipos">
              <span [class.ganador]="p.ganador === p.equipoLocalId">{{ p.local }}</span>
              <span class="suave">vs</span>
              <span [class.ganador]="p.ganador === p.equipoVisitanteId">{{ p.visitante }}</span>
            </span>
            <span class="suave">{{ p.fecha | date: 'dd/MM/yyyy' }}{{ p.lugar ? ' · ' + p.lugar : '' }}</span>
          </a>
        } @empty {
          <p class="vacio">Todavía no hay partidos.</p>
        }
      } @else if (partidos.error()) {
        <p class="error">No se pudieron cargar los partidos.</p>
      } @else {
        <p class="suave">Cargando…</p>
      }
    </section>
  `,
  styles: `
    a.partido { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem 1rem; margin-bottom: 0.5rem; color: inherit; text-decoration: none; }
    .equipos { display: flex; gap: 0.5rem; }
    .ganador { font-weight: 700; }
  `,
})
export default class Partidos {
  private readonly servicio = inject(PartidosServicio);
  protected readonly partidos = resource({ loader: () => this.servicio.listar() });
  protected readonly ordenados = computed(() =>
    [...(this.partidos.value() ?? [])].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '') || b.id - a.id),
  );
}
