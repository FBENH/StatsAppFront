import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="contenedor">
      <form class="tarjeta formulario" [formGroup]="form" (ngSubmit)="enviar()">
        <h1>Ingresar</h1>
        <label class="campo"><span>Usuario</span><input formControlName="usuario" autocomplete="username" /></label>
        <label class="campo"><span>Contraseña</span><input type="password" formControlName="password" autocomplete="current-password" /></label>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="boton primario" [disabled]="form.invalid || enviando()">Ingresar</button>
        <p class="suave">¿No tenés cuenta? <a routerLink="/registro">Creá una</a>.</p>
      </form>
    </section>
  `,
  styles: `form { margin: 2rem auto 0; }`,
})
export default class Ingresar {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected async enviar() {
    this.enviando.set(true);
    this.error.set(null);
    try {
      const { usuario, password } = this.form.getRawValue();
      await this.auth.ingresar(usuario, password);
      this.router.navigate(['/inicio']);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
