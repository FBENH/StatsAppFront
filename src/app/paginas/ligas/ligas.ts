import { Component, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api';
import { Ligas as LigasServicio } from '../../core/ligas';

@Component({
  imports: [RouterLink, FormsModule],
  template: `
    <section class="contenedor">
      <h1>Ligas</h1>
      <p class="suave intro">
        Una liga junta temporadas, divisiones y el fixture. Cada liga tiene una página pública con la tabla,
        los resultados, los partidos en vivo y los líderes.
      </p>
      @if (ligas.value(); as lista) {
        <div class="grilla">
          @for (l of lista; track l.id) {
            <a class="tarjeta liga" [routerLink]="['/ligas', l.id]">
              <strong>{{ l.nombre }}</strong>
              <span class="suave">/liga/{{ l.slug }} · {{ l.temporadas }} {{ l.temporadas === 1 ? 'temporada' : 'temporadas' }}</span>
            </a>
          } @empty {
            <p class="vacio">Todavía no tenés ligas.</p>
          }
        </div>
      } @else if (ligas.error()) {
        <p class="error">No se pudieron cargar las ligas.</p>
      }

      <form class="tarjeta formulario" (ngSubmit)="crear()">
        <h2>Nueva liga</h2>
        <label class="campo"><span>Nombre</span><input name="nombre" [(ngModel)]="nombre" maxlength="60" required /></label>
        <label class="campo">
          <span>Primera temporada (opcional)</span>
          <input name="temporada" [(ngModel)]="temporada" maxlength="40" placeholder="{{ anio }}" />
        </label>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="boton primario" type="submit" [disabled]="!nombre.trim() || ocupado()">Crear liga</button>
      </form>
    </section>
  `,
  styles: `
    .intro { max-width: 40rem; }
    .liga { display: grid; gap: 0.25rem; color: inherit; text-decoration: none; }
    .formulario { max-width: 30rem; margin-top: 1.5rem; }
    h2 { margin-top: 0; }
  `,
})
export default class Ligas {
  private readonly servicio = inject(LigasServicio);
  private readonly router = inject(Router);
  protected readonly ligas = resource({ loader: () => this.servicio.listar() });
  protected readonly anio = new Date().getFullYear();
  protected nombre = '';
  protected temporada = '';
  protected readonly error = signal<string | null>(null);
  protected readonly ocupado = signal(false);

  protected async crear() {
    this.ocupado.set(true);
    this.error.set(null);
    try {
      const id = await this.servicio.crear({ nombre: this.nombre, slug: null, descripcion: null, temporada: this.temporada || null });
      this.router.navigate(['/ligas', id]);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(false);
    }
  }
}
