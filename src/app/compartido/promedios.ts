import { Component, computed, input } from '@angular/core';
import { porcentaje, promediar, sumar, tirosDeCampo } from '../core/estadisticas';
import { Contadores } from '../core/modelos';

/** Promedios por partido y porcentajes de tiro (calculados sobre el total de intentos). */
@Component({
  selector: 'app-promedios',
  template: `
    @if (cifras(); as c) {
      <div class="cifras">
        @for (cifra of c; track cifra.nombre) {
          <div class="cifra"><strong>{{ cifra.valor }}</strong><span>{{ cifra.nombre }}</span></div>
        }
      </div>
    } @else {
      <p class="suave">Sin partidos todavía.</p>
    }
  `,
})
export class Promedios {
  readonly planillas = input.required<Contadores[]>();

  protected readonly cifras = computed(() => {
    const promedio = promediar(this.planillas());
    if (!promedio) return null;
    const total = sumar(this.planillas());
    const tc = tirosDeCampo(total);
    const pct = (a: number, i: number) => {
      const p = porcentaje(a, i);
      return p === null ? '–' : `${p}%`;
    };
    return [
      { nombre: 'Partidos', valor: this.planillas().length },
      { nombre: 'Puntos', valor: promedio.puntos },
      { nombre: 'Rebotes', valor: promedio.rebotes },
      { nombre: 'Asistencias', valor: promedio.asistencias },
      { nombre: 'Robos', valor: promedio.robos },
      { nombre: 'Tapones', valor: promedio.tapones },
      { nombre: 'Pérdidas', valor: promedio.perdidas },
      { nombre: 'Faltas', valor: promedio.faltas },
      { nombre: 'Tiros de campo', valor: pct(tc.aciertos, tc.intentos) },
      { nombre: 'Triples', valor: pct(total.aciertos3Puntos, total.intentos3Puntos) },
      { nombre: 'Libres', valor: pct(total.aciertos1Punto, total.intentos1Punto) },
    ];
  });
}
