import { Component, effect, inject, input, output, resource, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SubirImagen } from '../../compartido/subir-imagen';
import { mensajeDeError } from '../../core/api';
import { Jugador, POSICIONES } from '../../core/modelos';
import { Equipos, Jugadores } from '../../core/servicios';

/** Alta de jugador (como página) o edición (dentro del detalle, con `jugador`). */
@Component({
  selector: 'app-jugador-form',
  imports: [ReactiveFormsModule, SubirImagen],
  template: `
    <section [class.contenedor]="!jugador()">
      <form class="formulario" [class.tarjeta]="!jugador()" [formGroup]="form" (ngSubmit)="guardar()">
        @if (!jugador()) { <h1>Nuevo jugador</h1> }
        <div class="campos-dobles">
          <label class="campo"><span>Nombre</span><input formControlName="nombre" maxlength="30" /></label>
          <label class="campo"><span>Número</span><input type="number" formControlName="numero" min="0" max="99" /></label>
        </div>
        <div class="campos-dobles">
          <label class="campo">
            <span>Posición</span>
            <select formControlName="posicion">
              <option value="">Sin posición</option>
              @for (p of posiciones; track p) { <option [value]="p">{{ p }}</option> }
            </select>
          </label>
          <label class="campo">
            <span>Equipo</span>
            <select formControlName="equipoId">
              <option [ngValue]="null">Sin equipo</option>
              @for (e of equipos.hasValue() ? equipos.value() : []; track e.id) { <option [ngValue]="e.id">{{ e.nombre }}</option> }
            </select>
          </label>
        </div>
        <div class="campos-dobles">
          <label class="campo"><span>Altura (cm)</span><input type="number" formControlName="altura" min="0" max="250" /></label>
          <label class="campo"><span>Peso (kg)</span><input type="number" formControlName="peso" min="0" max="250" /></label>
        </div>
        <app-subir-imagen etiqueta="Foto" [nombre]="form.controls.nombre.value ?? ''" [(url)]="foto" />
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <div class="fila">
          <button class="boton primario" [disabled]="form.invalid || guardando()">Guardar</button>
          <button class="boton" type="button" (click)="cancelar()">Cancelar</button>
        </div>
      </form>
    </section>
  `,
})
export default class JugadorForm {
  private readonly servicio = inject(Jugadores);
  private readonly equiposServicio = inject(Equipos);
  private readonly router = inject(Router);

  readonly jugador = input<Jugador | null>(null);
  readonly cerrado = output<boolean>();

  protected readonly posiciones = POSICIONES;
  protected readonly equipos = resource({ loader: () => this.equiposServicio.listar() });
  protected readonly form = inject(FormBuilder).group({
    nombre: ['', [Validators.required, Validators.maxLength(30)]],
    numero: [null as number | null, [Validators.required, Validators.min(0), Validators.max(99)]],
    posicion: [''],
    equipoId: [null as number | null],
    altura: [null as number | null, [Validators.min(0), Validators.max(250)]],
    peso: [null as number | null, [Validators.min(0), Validators.max(250)]],
  });
  protected readonly foto = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);

  constructor() {
    effect(() => {
      const j = this.jugador();
      if (!j) return;
      this.form.setValue({
        nombre: j.nombre, numero: j.numero, posicion: j.posicion ?? '',
        equipoId: j.equipoId, altura: j.altura, peso: j.peso,
      });
      this.foto.set(j.foto);
    });
  }

  protected async guardar() {
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const datos = {
      nombre: v.nombre ?? '', numero: v.numero ?? 0, posicion: v.posicion || null,
      equipoId: v.equipoId, altura: v.altura, peso: v.peso, foto: this.foto(),
    };
    try {
      const actual = this.jugador();
      if (actual) {
        await this.servicio.modificar({ ...datos, id: actual.id });
        this.cerrado.emit(true);
      } else {
        await this.servicio.crear(datos);
        this.router.navigate(['/jugadores']);
      }
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar() {
    if (this.jugador()) this.cerrado.emit(false);
    else this.router.navigate(['/jugadores']);
  }
}
