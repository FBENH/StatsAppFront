import { Component, input, output, signal } from '@angular/core';

/** Botón de eliminar que pide confirmación en el mismo lugar. */
@Component({
  selector: 'app-boton-eliminar',
  template: `
    @if (confirmando()) {
      <span class="fila">
        <span>{{ pregunta() }}</span>
        <button class="boton chico peligro" type="button" (click)="confirmado.emit()">Sí, eliminar</button>
        <button class="boton chico" type="button" (click)="confirmando.set(false)">Cancelar</button>
      </span>
    } @else {
      <button class="boton peligro" type="button" (click)="confirmando.set(true)">Eliminar</button>
    }
  `,
})
export class BotonEliminar {
  readonly pregunta = input('¿Eliminar?');
  readonly confirmado = output();
  protected readonly confirmando = signal(false);
}
