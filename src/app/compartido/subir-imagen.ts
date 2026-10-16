import { Component, inject, input, model, signal } from '@angular/core';
import { mensajeDeError } from '../core/api';
import { Imagenes } from '../core/servicios';
import { Imagen } from './imagen';

/** Elige una imagen, la sube y deja su URL en `url`. */
@Component({
  selector: 'app-subir-imagen',
  imports: [Imagen],
  template: `
    <div class="fila">
      <app-imagen [src]="url()" [nombre]="nombre()" [grande]="true" />
      <div class="campo">
        <span>{{ etiqueta() }}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" (change)="elegir($event)" [disabled]="subiendo()" />
        @if (subiendo()) { <small class="suave">Subiendo…</small> }
        @if (error()) { <small class="error">{{ error() }}</small> }
        @if (url() && !subiendo()) {
          <button class="boton chico" type="button" (click)="url.set(null)">Quitar imagen</button>
        }
      </div>
    </div>
  `,
})
export class SubirImagen {
  private readonly imagenes = inject(Imagenes);

  readonly url = model<string | null>(null);
  readonly nombre = input('');
  readonly etiqueta = input('Imagen');
  protected readonly subiendo = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async elegir(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    this.error.set(null);
    this.subiendo.set(true);
    try {
      this.url.set(await this.imagenes.subir(archivo));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.subiendo.set(false);
    }
  }
}
