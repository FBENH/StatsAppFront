import { Component, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorApi, mensajeDeError } from '../../core/api';
import { Equipo } from '../../core/modelos';
import { EquipoEnVivo, PartidoEnVivo } from '../../core/partido-en-vivo';
import { Equipos, Jugadores } from '../../core/servicios';

@Component({
  imports: [FormsModule, RouterLink],
  template: `
    <section class="contenedor">
      <h1>Nuevo partido</h1>
      @if (vivo.estado()) {
        <p class="tarjeta aviso">
          Ya hay un partido en curso en este dispositivo. Si empezás otro, se descarta.
          <a routerLink="/partidos/en-vivo">Volver al partido en curso</a>
        </p>
      }
      <div class="tarjeta formulario">
        <div class="campos-dobles">
          @for (lado of lados; track lado.clave) {
            <label class="campo">
              <span>{{ lado.titulo }}</span>
              <select [(ngModel)]="seleccion[lado.clave]" [ngModelOptions]="{ standalone: true }">
                <option [ngValue]="null">Elegí un equipo</option>
                @for (e of equipos.value(); track e.id) { <option [ngValue]="e.id">{{ e.nombre }}</option> }
              </select>
            </label>
          }
        </div>
        <div class="campos-dobles">
          <label class="campo"><span>Fecha</span><input type="date" [(ngModel)]="fecha" /></label>
          <label class="campo"><span>Lugar (opcional)</span><input [(ngModel)]="lugar" maxlength="100" /></label>
        </div>

        <details>
          <summary>¿El equipo no está cargado? Crealo rápido con los números de camiseta</summary>
          <div class="formulario rapido">
            <label class="campo"><span>Nombre</span><input [(ngModel)]="rapido.nombre" maxlength="30" /></label>
            <label class="campo">
              <span>Números, separados por coma</span>
              <input [(ngModel)]="rapido.numeros" placeholder="4, 5, 7, 8, 10, 11, 12, 15" />
            </label>
            <button class="boton" type="button" (click)="crearRapido()" [disabled]="!rapido.nombre || ocupado()">Crear equipo</button>
          </div>
        </details>

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="boton primario" type="button" (click)="empezar()" [disabled]="ocupado()">Empezar partido</button>
      </div>
    </section>
  `,
  styles: `
    .aviso { border-color: var(--acento); }
    .formulario { max-width: 640px; }
    summary { cursor: pointer; color: var(--acento); font-weight: 600; }
    .rapido { margin-top: 0.75rem; }
  `,
})
export default class NuevoPartido {
  private readonly equiposServicio = inject(Equipos);
  private readonly jugadores = inject(Jugadores);
  private readonly router = inject(Router);
  protected readonly vivo = inject(PartidoEnVivo);

  protected readonly lados = [
    { clave: 'local', titulo: 'Local' },
    { clave: 'visitante', titulo: 'Visitante' },
  ] as const;
  protected readonly equipos = resource({ loader: () => this.equiposServicio.listar() });
  protected seleccion: Record<'local' | 'visitante', number | null> = { local: null, visitante: null };
  protected fecha = new Date().toISOString().slice(0, 10);
  protected lugar = '';
  protected rapido = { nombre: '', numeros: '' };
  protected readonly error = signal<string | null>(null);
  protected readonly ocupado = signal(false);

  protected async crearRapido() {
    const numeros = [...new Set(this.rapido.numeros.split(/[\s,;]+/).filter(Boolean).map(Number))];
    if (numeros.some((n) => !Number.isInteger(n) || n < 0 || n > 99)) {
      this.error.set('Los números tienen que ser enteros entre 0 y 99.');
      return;
    }
    await this.ejecutar(async () => {
      const id = await this.equiposServicio.crearRapido(this.rapido.nombre.trim(), numeros);
      this.equipos.reload();
      if (this.seleccion.local === null) this.seleccion.local = id;
      else if (this.seleccion.visitante === null) this.seleccion.visitante = id;
      this.rapido = { nombre: '', numeros: '' };
    });
  }

  protected empezar() {
    const { local, visitante } = this.seleccion;
    if (local === null || visitante === null) return this.error.set('Elegí los dos equipos.');
    if (local === visitante) return this.error.set('El local y el visitante tienen que ser distintos.');
    return this.ejecutar(async () => {
      const [l, v] = await Promise.all([this.equipoEnVivo(local), this.equipoEnVivo(visitante)]);
      const sinJugadores = [l, v].find((e) => e.jugadores.length === 0);
      if (sinJugadores) throw new ErrorApi(`${sinJugadores.nombre} no tiene jugadores.`);
      this.vivo.iniciar({ fecha: this.fecha || null, lugar: this.lugar.trim() || null, local: l, visitante: v });
      this.router.navigate(['/partidos/en-vivo']);
    });
  }

  private async equipoEnVivo(id: number): Promise<EquipoEnVivo> {
    const equipo = this.equipos.value()?.find((e) => e.id === id) as Equipo;
    const jugadores = await this.jugadores.porEquipo(id);
    return {
      id,
      nombre: equipo.nombre,
      escudo: equipo.escudo,
      jugadores: jugadores
        .map((j) => ({ id: j.id, nombre: j.nombre, numero: j.numero }))
        .sort((a, b) => a.numero - b.numero),
      enCancha: [],
    };
  }

  private async ejecutar(accion: () => Promise<void>) {
    this.ocupado.set(true);
    this.error.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(false);
    }
  }
}
