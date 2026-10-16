import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BotonEliminar } from '../../compartido/boton-eliminar';
import { Imagen } from '../../compartido/imagen';
import { FilaPlanilla, Planilla } from '../../compartido/planilla';
import { Promedios } from '../../compartido/promedios';
import { mensajeDeError } from '../../core/api';
import { Jugadores, Partidos } from '../../core/servicios';
import JugadorForm from './jugador-form';
import { valor } from '../../core/recurso';

@Component({
  imports: [RouterLink, Imagen, Promedios, Planilla, BotonEliminar, JugadorForm],
  template: `
    <section class="contenedor">
      @if (jugador.hasValue() && jugador.value(); as j) {
        <div class="tarjeta">
          @if (editando()) {
            <app-jugador-form [jugador]="j" (cerrado)="cerrarEdicion($event)" />
          } @else {
            <div class="fila cabecera">
              <app-imagen [src]="j.foto" [nombre]="j.nombre" [grande]="true" />
              <div>
                <h1>#{{ j.numero }} {{ j.nombre }}</h1>
                <p class="suave">
                  @if (j.equipo) { <a [routerLink]="['/equipos', j.equipo.id]">{{ j.equipo.nombre }}</a> } @else { Sin equipo }
                  {{ j.posicion ? ' · ' + j.posicion : '' }}
                  {{ j.altura ? ' · ' + j.altura + ' cm' : '' }}{{ j.peso ? ' · ' + j.peso + ' kg' : '' }}
                </p>
                <div class="fila">
                  <button class="boton" type="button" (click)="editando.set(true)">Editar</button>
                  <app-boton-eliminar pregunta="¿Eliminar el jugador?" (confirmado)="eliminar()" />
                </div>
                @if (error()) { <p class="error">{{ error() }}</p> }
              </div>
            </div>
          }
        </div>

        <h2>Promedios por partido</h2>
        <app-promedios [planillas]="j.estadisticasJugador ?? []" />

        @if (filas().length) {
          <h2>Partidos</h2>
          <app-planilla primeraColumna="Partido" [conMinutos]="true" [filas]="filas()" />
        }
      } @else if (jugador.error()) {
        <p class="error">No se encontró el jugador.</p>
      } @else {
        <p class="suave">Cargando…</p>
      }
    </section>
  `,
  styles: `
    h2 { margin-top: 1.75rem; }
    .cabecera { align-items: flex-start; gap: 1.25rem; }
  `,
})
export default class Jugador {
  private readonly jugadores = inject(Jugadores);
  private readonly partidos = inject(Partidos);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly editando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly jugador = resource({ params: () => +this.id(), loader: ({ params }) => this.jugadores.obtener(params) });
  private readonly listaPartidos = resource({ loader: () => this.partidos.listar() });

  protected readonly filas = computed<FilaPlanilla[]>(() => {
    const partidos = new Map((valor(this.listaPartidos) ?? []).map((p) => [p.id, p]));
    const fecha = new DatePipe('en-US');
    return (valor(this.jugador)?.estadisticasJugador ?? []).map((s) => {
      const p = partidos.get(s.partidoId);
      const titulo = p ? `${fecha.transform(p.fecha, 'dd/MM') ?? ''} ${p.local} vs ${p.visitante}`.trim() : 'Partido';
      return { ...s, titulo, enlace: ['/partidos', s.partidoId] };
    });
  });

  protected cerrarEdicion(guardado: boolean) {
    this.editando.set(false);
    if (guardado) this.jugador.reload();
  }

  protected async eliminar() {
    try {
      await this.jugadores.eliminar(+this.id());
      this.router.navigate(['/jugadores']);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }
}
