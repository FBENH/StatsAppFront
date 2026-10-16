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
        <h1>Crear cuenta</h1>
        <label class="campo">
          <span>Usuario</span>
          <input formControlName="usuario" autocomplete="username" maxlength="16" />
          <small class="suave">Hasta 16 caracteres.</small>
        </label>
        <label class="campo">
          <span>Contraseña</span>
          <input type="password" formControlName="pass" autocomplete="new-password" />
          <small class="suave">Al menos 6 caracteres.</small>
        </label>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="boton primario" [disabled]="form.invalid || enviando()">Crear cuenta</button>
        <p class="suave">¿Ya tenés cuenta? <a routerLink="/ingresar">Ingresá</a>.</p>
      </form>
    </section>
  `,
  styles: `form { margin: 2rem auto 0; }`,
})
export default class Registro {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    usuario: ['', [Validators.required, Validators.maxLength(16)]],
    pass: ['', [Validators.required, Validators.minLength(6)]],
  });
  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected async enviar() {
    this.enviando.set(true);
    this.error.set(null);
    try {
      const { usuario, pass } = this.form.getRawValue();
      await this.auth.registrar(usuario, pass);
      await this.auth.ingresar(usuario, pass);
      this.router.navigate(['/inicio']);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
