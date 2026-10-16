import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Imagen } from '../../compartido/imagen';
import { Equipos as EquiposServicio } from '../../core/servicios';

@Component({
  imports: [RouterLink, Imagen],
  template: `
    <section class="contenedor">
      <div class="encabezado">
        <h1>Equipos</h1>
        <a class="boton primario" routerLink="/equipos/nuevo">Nuevo equipo</a>
      </div>
      @if (equipos.hasValue() && equipos.value(); as lista) {
        <div class="grilla">
          @for (e of lista; track e.id) {
            <a class="tarjeta fila equipo" [routerLink]="['/equipos', e.id]">
              <app-imagen [src]="e.escudo" [nombre]="e.nombre" />
              <span>
                <strong>{{ e.nombre }}</strong><br />
                <span class="suave">{{ e.ciudad || 'Sin ciudad' }}</span>
              </span>
            </a>
          } @empty {
            <p class="vacio">Todavía no hay equipos.</p>
          }
        </div>
      } @else if (equipos.error()) {
        <p class="error">No se pudieron cargar los equipos.</p>
      } @else {
        <p class="suave">Cargando…</p>
      }
    </section>
  `,
  styles: `a.equipo { color: inherit; text-decoration: none; flex-wrap: nowrap; }`,
})
export default class Equipos {
  private readonly servicio = inject(EquiposServicio);
  protected readonly equipos = resource({ loader: () => this.servicio.listar() });
}
