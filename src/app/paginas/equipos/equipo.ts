import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BotonEliminar } from '../../compartido/boton-eliminar';
import { Imagen } from '../../compartido/imagen';
import { FilaPlanilla, Planilla } from '../../compartido/planilla';
import { Promedios } from '../../compartido/promedios';
import { mensajeDeError } from '../../core/api';
import { Equipos, Partidos } from '../../core/servicios';
import EquipoForm from './equipo-form';
import { valor } from '../../core/recurso';

@Component({
  imports: [RouterLink, Imagen, Promedios, Planilla, BotonEliminar, EquipoForm],
  template: `
    <section class="contenedor">
      @if (equipo.hasValue() && equipo.value(); as e) {
        <div class="tarjeta">
          @if (editando()) {
            <app-equipo-form [equipo]="e" (cerrado)="cerrarEdicion($event)" />
          } @else {
            <div class="fila cabecera">
              <app-imagen [src]="e.escudo" [nombre]="e.nombre" [grande]="true" />
              <div>
                <h1>{{ e.nombre }}</h1>
                <p class="suave">{{ e.ciudad || 'Sin ciudad' }} · Entrenador: {{ e.entrenador || 'sin datos' }}</p>
                <div class="fila">
                  <button class="boton" type="button" (click)="editando.set(true)">Editar</button>
                  <app-boton-eliminar pregunta="¿Eliminar el equipo?" (confirmado)="eliminar()" />
                </div>
                @if (error()) { <p class="error">{{ error() }}</p> }
              </div>
            </div>
          }
        </div>

        <h2>Plantel</h2>
        <div class="grilla">
          @for (j of e.jugadores; track j.id) {
            <a class="tarjeta fila jugador" [routerLink]="['/jugadores', j.id]">
              <app-imagen [src]="j.foto" [nombre]="j.nombre" />
              <span><strong>#{{ j.numero }}</strong> {{ j.nombre }}<br /><span class="suave">{{ j.posicion }}</span></span>
            </a>
          } @empty {
            <p class="suave">Sin jugadores. Agregalos desde <a routerLink="/jugadores/nuevo">Nuevo jugador</a>.</p>
          }
        </div>

        <h2>Promedios por partido</h2>
        <app-promedios [planillas]="e.estadisticasPartidos ?? []" />

        @if (filas().length) {
          <h2>Partidos</h2>
          <app-planilla primeraColumna="Partido" [filas]="filas()" />
        }
      } @else if (equipo.error()) {
        <p class="error">No se encontró el equipo.</p>
      } @else {
        <p class="suave">Cargando…</p>
      }
    </section>
  `,
  styles: `
    h2 { margin-top: 1.75rem; }
    .cabecera { align-items: flex-start; gap: 1.25rem; }
    a.jugador { color: inherit; text-decoration: none; flex-wrap: nowrap; }
  `,
})
export default class Equipo {
  private readonly equipos = inject(Equipos);
  private readonly partidos = inject(Partidos);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly editando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly equipo = resource({ params: () => +this.id(), loader: ({ params }) => this.equipos.obtener(params) });
  private readonly listaPartidos = resource({ loader: () => this.partidos.listar() });

  protected readonly filas = computed<FilaPlanilla[]>(() => {
    const e = valor(this.equipo);
    const partidos = new Map((valor(this.listaPartidos) ?? []).map((p) => [p.id, p]));
    const fecha = new DatePipe('en-US');
    return (e?.estadisticasPartidos ?? []).map((s) => {
      const p = partidos.get(s.partidoId);
      const rival = !p ? 'Partido' : p.equipoLocalId === e!.id ? `vs ${p.visitante}` : `en ${p.local}`;
      return { ...s, titulo: [fecha.transform(p?.fecha, 'dd/MM'), rival].filter(Boolean).join(' '), enlace: ['/partidos', s.partidoId] };
    });
  });

  protected cerrarEdicion(guardado: boolean) {
    this.editando.set(false);
    if (guardado) this.equipo.reload();
  }

  protected async eliminar() {
    try {
      await this.equipos.eliminar(+this.id());
      this.router.navigate(['/equipos']);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }
}
