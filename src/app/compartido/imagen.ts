import { Component, computed, input } from '@angular/core';

/** Foto o escudo; si no hay imagen muestra las iniciales. */
@Component({
  selector: 'app-imagen',
  template: `
    @if (src()) {
      <img class="avatar" [class.grande]="grande()" [src]="src()" [alt]="nombre()" />
    } @else {
      <span class="avatar" [class.grande]="grande()" aria-hidden="true">{{ iniciales() }}</span>
    }
  `,
  styles: `:host { display: contents; }`,
})
export class Imagen {
  readonly src = input<string | null | undefined>(null);
  readonly nombre = input('');
  readonly grande = input(false);

  protected readonly iniciales = computed(() =>
    this.nombre()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join(''),
  );
}
