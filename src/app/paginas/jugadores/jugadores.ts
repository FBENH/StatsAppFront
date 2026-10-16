import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Imagen } from '../../compartido/imagen';
import { Equipos, Jugadores as JugadoresServicio } from '../../core/servicios';
import { valor } from '../../core/recurso';

@Component({
  imports: [RouterLink, Imagen],
  template: `
    <section class="contenedor">
      <div class="encabezado">
        <h1>Jugadores</h1>
        <a class="boton primario" routerLink="/jugadores/nuevo">Nuevo jugador</a>
      </div>
      <div class="fila filtros">
        <input type="search" placeholder="Buscar por nombre o número" aria-label="Buscar"
          [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" />
        <select aria-label="Equipo" (change)="equipo.set($any($event.target).value)">
          <option value="">Todos los equipos</option>
          <option value="sin">Sin equipo</option>
          @for (e of equipos.hasValue() ? equipos.value() : []; track e.id) { <option [value]="e.id">{{ e.nombre }}</option> }
        </select>
      </div>
      @if (jugadores.hasValue()) {
        <div class="grilla">
          @for (j of filtrados(); track j.id) {
            <a class="tarjeta fila jugador" [routerLink]="['/jugadores', j.id]">
              <app-imagen [src]="j.foto" [nombre]="j.nombre" />
              <span>
                <strong>#{{ j.numero }} {{ j.nombre }}</strong><br />
                <span class="suave">{{ j.equipo || 'Sin equipo' }}{{ j.posicion ? ' · ' + j.posicion : '' }}</span>
              </span>
            </a>
          } @empty {
            <p class="vacio">No hay jugadores{{ busqueda() || equipo() ? ' con ese filtro' : '' }}.</p>
          }
        </div>
      } @else if (jugadores.error()) {
        <p class="error">No se pudieron cargar los jugadores.</p>
      } @else {
        <p class="suave">Cargando…</p>
      }
    </section>
  `,
  styles: `
    .filtros { margin-bottom: 1rem; flex-wrap: nowrap; }
    .filtros input { flex: 2; }
    .filtros select { flex: 1; }
    a.jugador { color: inherit; text-decoration: none; flex-wrap: nowrap; }
  `,
})
export default class Jugadores {
  private readonly servicio = inject(JugadoresServicio);
  private readonly equiposServicio = inject(Equipos);

  protected readonly jugadores = resource({ loader: () => this.servicio.listar() });
  protected readonly equipos = resource({ loader: () => this.equiposServicio.listar() });
  protected readonly busqueda = signal('');
  protected readonly equipo = signal('');

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const equipo = this.equipo();
    return (valor(this.jugadores) ?? [])
      .filter((j) => !equipo || (equipo === 'sin' ? j.equipoId === null : j.equipoId === +equipo))
      .filter((j) => !texto || j.nombre.toLowerCase().includes(texto) || String(j.numero) === texto)
      .sort((a, b) => (a.equipo ?? '~').localeCompare(b.equipo ?? '~') || a.numero - b.numero);
  });
}
