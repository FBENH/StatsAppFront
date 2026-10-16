import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SubirImagen } from '../../compartido/subir-imagen';
import { mensajeDeError } from '../../core/api';
import { Equipo } from '../../core/modelos';
import { Equipos } from '../../core/servicios';

/** Alta de equipo (como página) o edición (dentro del detalle, con `equipo`). */
@Component({
  selector: 'app-equipo-form',
  imports: [ReactiveFormsModule, SubirImagen],
  template: `
    <section [class.contenedor]="!equipo()">
      <form class="formulario" [class.tarjeta]="!equipo()" [formGroup]="form" (ngSubmit)="guardar()">
        @if (!equipo()) { <h1>Nuevo equipo</h1> }
        <label class="campo"><span>Nombre</span><input formControlName="nombre" maxlength="30" /></label>
        <div class="campos-dobles">
          <label class="campo"><span>Ciudad</span><input formControlName="ciudad" maxlength="50" /></label>
          <label class="campo"><span>Entrenador</span><input formControlName="entrenador" maxlength="50" /></label>
        </div>
        <app-subir-imagen etiqueta="Escudo" [nombre]="form.controls.nombre.value" [(url)]="escudo" />
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <div class="fila">
          <button class="boton primario" [disabled]="form.invalid || guardando()">Guardar</button>
          <button class="boton" type="button" (click)="cancelar()">Cancelar</button>
        </div>
      </form>
    </section>
  `,
})
export default class EquipoForm {
  private readonly servicio = inject(Equipos);
  private readonly router = inject(Router);

  readonly equipo = input<Equipo | null>(null);
  readonly cerrado = output<boolean>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(30)]],
    ciudad: [''],
    entrenador: [''],
  });
  protected readonly escudo = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);

  constructor() {
    effect(() => {
      const e = this.equipo();
      if (!e) return;
      this.form.setValue({ nombre: e.nombre, ciudad: e.ciudad ?? '', entrenador: e.entrenador ?? '' });
      this.escudo.set(e.escudo);
    });
  }

  protected async guardar() {
    this.guardando.set(true);
    this.error.set(null);
    const { nombre, ciudad, entrenador } = this.form.getRawValue();
    const datos = { nombre, ciudad: ciudad || null, entrenador: entrenador || null, escudo: this.escudo() };
    try {
      const actual = this.equipo();
      if (actual) {
        await this.servicio.modificar({ ...datos, id: actual.id });
        this.cerrado.emit(true);
      } else {
        await this.servicio.crear(datos);
        this.router.navigate(['/equipos']);
      }
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar() {
    if (this.equipo()) this.cerrado.emit(false);
    else this.router.navigate(['/equipos']);
  }
}
