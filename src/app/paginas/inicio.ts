import { DatePipe } from '@angular/common';
import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth';
import { PartidoEnVivo } from '../core/partido-en-vivo';
import { Partidos } from '../core/servicios';

@Component({
  imports: [RouterLink, DatePipe],
  template: `
    <section class="contenedor">
      <div class="encabezado">
        <h1>Hola, {{ auth.usuario() }}</h1>
        <a class="boton primario" routerLink="/partidos/nuevo">Nuevo partido</a>
      </div>

      @if (vivo.estado(); as estado) {
        <div class="tarjeta en-curso">
          <strong>Partido en curso:</strong> {{ estado.local.nombre }} {{ vivo.puntosLocal() }} –
          {{ vivo.puntosVisitante() }} {{ estado.visitante.nombre }}
          <a class="boton chico primario" routerLink="/partidos/en-vivo">Continuar</a>
        </div>
      }

      <div class="grilla accesos">
        <a class="tarjeta" routerLink="/equipos"><h2>Equipos</h2><span class="suave">Crear y editar equipos</span></a>
        <a class="tarjeta" routerLink="/jugadores"><h2>Jugadores</h2><span class="suave">Fichas y promedios</span></a>
        <a class="tarjeta" routerLink="/partidos"><h2>Partidos</h2><span class="suave">Planillas de partidos jugados</span></a>
      </div>

      <h2>Últimos partidos</h2>
      @if (partidos.hasValue() && partidos.value(); as lista) {
        @for (p of lista; track p.id) {
          <a class="tarjeta partido" [routerLink]="['/partidos', p.id]">
            <span>{{ p.local }} vs {{ p.visitante }}</span>
            <span class="suave">{{ p.fecha | date: 'dd/MM/yyyy' }}</span>
          </a>
        } @empty {
          <p class="vacio">Todavía no hay partidos. Empezá uno con “Nuevo partido”.</p>
        }
      } @else if (partidos.error()) {
        <p class="error">No se pudieron cargar los partidos.</p>
      }
    </section>
  `,
  styles: `
    .en-curso { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 1rem; border-color: var(--acento); }
    .accesos { margin-bottom: 1.5rem; }
    .accesos a, a.partido { color: inherit; text-decoration: none; }
    .accesos h2 { margin-bottom: 0.25rem; }
    a.partido { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
  `,
})
export default class Inicio {
  protected readonly auth = inject(Auth);
  protected readonly vivo = inject(PartidoEnVivo);
  private readonly servicio = inject(Partidos);

  // Los 5 más recientes: primero por fecha, después por id.
  protected readonly partidos = resource({
    loader: async () =>
      (await this.servicio.listar())
        .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '') || b.id - a.id)
        .slice(0, 5),
  });
}
