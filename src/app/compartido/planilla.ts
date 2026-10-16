import { Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { formatearMinutos } from '../core/estadisticas';
import { Contadores } from '../core/modelos';

export interface FilaPlanilla extends Contadores {
  titulo: string;
  enlace?: unknown[];
  minutos?: string | null;
}

/** Tabla de estadísticas: una fila por jugador o por partido, y una fila de totales opcional. */
@Component({
  selector: 'app-planilla',
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <div class="tabla-envoltorio">
      <table class="tabla">
        <thead>
          <tr>
            <th>{{ primeraColumna() }}</th>
            @if (conMinutos()) { <th>Min</th> }
            <th>Pts</th><th>Reb</th><th>RO</th><th>RD</th><th>Ast</th><th>Rob</th><th>Tap</th><th>Pér</th><th>Fal</th>
            <th>TC</th><th>2P</th><th>3P</th><th>TL</th>
          </tr>
        </thead>
        <tbody>
          @for (f of filas(); track $index) {
            <tr>
              <td>
                @if (f.enlace) { <a [routerLink]="f.enlace">{{ f.titulo }}</a> } @else { {{ f.titulo }} }
              </td>
              @if (conMinutos()) { <td>{{ minutos(f.minutos ?? null) }}</td> }
              <ng-container *ngTemplateOutlet="celdas; context: { $implicit: f }" />
            </tr>
          }
        </tbody>
        @if (total(); as t) {
          <tfoot>
            <tr>
              <td>Total</td>
              @if (conMinutos()) { <td></td> }
              <ng-container *ngTemplateOutlet="celdas; context: { $implicit: t }" />
            </tr>
          </tfoot>
        }
      </table>
    </div>
    <ng-template #celdas let-f>
      <td>{{ f.puntos }}</td><td>{{ f.rebotes }}</td><td>{{ f.rebotesOfensivos }}</td><td>{{ f.rebotesDefensivos }}</td>
      <td>{{ f.asistencias }}</td><td>{{ f.robos }}</td><td>{{ f.tapones }}</td><td>{{ f.perdidas }}</td><td>{{ f.faltas }}</td>
      <td>{{ f.aciertos2Puntos + f.aciertos3Puntos }}/{{ f.intentos2Puntos + f.intentos3Puntos }}</td>
      <td>{{ f.aciertos2Puntos }}/{{ f.intentos2Puntos }}</td>
      <td>{{ f.aciertos3Puntos }}/{{ f.intentos3Puntos }}</td>
      <td>{{ f.aciertos1Punto }}/{{ f.intentos1Punto }}</td>
    </ng-template>
  `,
})
export class Planilla {
  readonly filas = input.required<FilaPlanilla[]>();
  readonly total = input<Contadores | null>(null);
  readonly primeraColumna = input('Jugador');
  readonly conMinutos = input(false);

  protected readonly minutos = formatearMinutos;
}
