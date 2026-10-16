import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { EnVivo } from '../../core/en-vivo';
import { LigasPublicas, PartidoDeLiga } from '../../core/ligas';
import { valor } from '../../core/recurso';

/**
 * Marcador chico para incrustar con un iframe en el sitio de una liga:
 * los partidos en vivo, los últimos resultados y los próximos, actualizados por SignalR.
 */
@Component({
  imports: [DatePipe],
  template: `
    @if (liga.hasValue() && liga.value(); as l) {
      <div class="widget">
        <a class="titulo" [href]="'/liga/' + slug()" target="_blank" rel="noopener">{{ l.nombre }}</a>
        @for (g of grupos(); track g.titulo) {
          @if (g.partidos.length > 0) {
            <p class="seccion">{{ g.titulo }}</p>
            @for (p of g.partidos; track p.id) {
              <a class="partido" [class.vivo]="p.estado === 'EnCurso'" target="_blank" rel="noopener"
                [attr.href]="p.estado === 'Programado' ? null : '/liga/' + slug() + '/partido/' + p.id">
                <span class="equipo">{{ p.local.nombre }}</span>
                @if (p.estado === 'Programado') {
                  <span class="suave">{{ p.fecha ? (p.fecha | date: 'dd/MM') : 'vs' }}</span>
                } @else {
                  @for (t of [p.local.puntos + '-' + p.visitante.puntos]; track t) {
                    <strong class="tanteador">{{ p.local.puntos }} – {{ p.visitante.puntos }}</strong>
                  }
                }
                <span class="equipo visitante">{{ p.visitante.nombre }}</span>
              </a>
            }
          }
        } @empty {
          <p class="suave">Todavía no hay partidos.</p>
        }
        <p class="pie suave">StatsApp</p>
      </div>
    }
  `,
  styles: `
    .widget { display: grid; gap: 0.35rem; padding: 0.6rem; font-size: 0.9rem; }
    .titulo { font-weight: 700; color: inherit; text-decoration: none; }
    .seccion { margin: 0.4rem 0 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--texto-suave); }
    .partido {
      display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.5rem; align-items: center; padding: 0.4rem 0.5rem;
      border: 1px solid var(--borde); border-radius: var(--radio); background: var(--superficie); color: inherit; text-decoration: none;
    }
    .partido.vivo { border-color: var(--peligro); }
    .equipo { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; }
    .equipo.visitante { text-align: left; }
    .tanteador { font-variant-numeric: tabular-nums; animation: salto 0.5s ease-out; }
    @keyframes salto { from { transform: scale(1.3); color: var(--acento); } }
    .pie { margin: 0.2rem 0 0; font-size: 0.7rem; text-align: right; }
    @media (prefers-reduced-motion: reduce) { .tanteador { animation: none; } }
  `,
})
export default class Widget {
  private readonly api = inject(LigasPublicas);
  readonly slug = input.required<string>();

  protected readonly liga = resource({ params: () => this.slug(), loader: ({ params }) => this.api.liga(params) });
  protected readonly partidos = resource({ params: () => this.slug(), loader: ({ params }) => this.api.partidos(params) });

  protected readonly grupos = computed(() => {
    const todos = valor(this.partidos) ?? [];
    const cuando = (p: PartidoDeLiga) => (p.fecha ? Date.parse(p.fecha) : 0);
    const finalizados = todos.filter((p) => p.estado === 'Finalizado').sort((a, b) => cuando(b) - cuando(a) || b.id - a.id);
    const programados = todos.filter((p) => p.estado === 'Programado').sort((a, b) => cuando(a) - cuando(b) || a.id - b.id);
    return [
      { titulo: 'En vivo', partidos: todos.filter((p) => p.estado === 'EnCurso') },
      { titulo: 'Resultados', partidos: finalizados.slice(0, 3) },
      { titulo: 'Próximos', partidos: programados.slice(0, 3) },
    ].filter((g) => g.partidos.length > 0);
  });

  constructor() {
    const vivo = inject(EnVivo);
    effect((alLimpiar) => {
      vivo.seguirLiga(
        this.slug(),
        {
          partido: (p) => {
            if (valor(this.partidos)?.some((x) => x.id === p.id)) {
              this.partidos.update((lista) => lista?.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
            } else this.partidos.reload();
          },
          reconectado: () => this.partidos.reload(),
        },
        alLimpiar,
      );
    });
  }
}
