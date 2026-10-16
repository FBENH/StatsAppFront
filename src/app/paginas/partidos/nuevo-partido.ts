import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorApi, mensajeDeError } from '../../core/api';
import { Equipo } from '../../core/modelos';
import { EquipoEnVivo, PartidoEnVivo } from '../../core/partido-en-vivo';
import { Equipos, Jugadores, PartidoEnCurso, Partidos } from '../../core/servicios';

@Component({
  imports: [FormsModule, RouterLink],
  template: `
    <section class="contenedor">
      <h1>Nuevo partido</h1>
      @if (vivo.estado()) {
        <p class="tarjeta aviso">
          Ya hay un partido en curso en este dispositivo. Si empezás o retomás otro, deja de anotarse acá
          (lo ya guardado queda en tu cuenta).
          <a routerLink="/partidos/en-vivo">Volver al partido en curso</a>
        </p>
      }
      @if (otrosEnCurso().length > 0) {
        <div class="tarjeta en-curso">
          <h2>Partidos sin terminar</h2>
          <p class="suave">Se empezaron a anotar y no se terminaron. Podés seguirlos desde este dispositivo.</p>
          @for (p of otrosEnCurso(); track p.id) {
            <div class="fila">
              <span>{{ p.local }} vs {{ p.visitante }} · {{ p.jugadas }} jugadas</span>
              <button class="boton chico" type="button" (click)="retomar(p)" [disabled]="ocupado()">Seguir anotando</button>
            </div>
          }
        </div>
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
        <label class="campo minutos">
          <span>Minutos por cuarto</span>
          <input type="number" [(ngModel)]="duracionCuartoMin" min="1" max="20" />
        </label>

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
    .minutos { max-width: 10rem; }
    .en-curso { margin-bottom: 1rem; display: grid; gap: 0.5rem; }
    .en-curso h2, .en-curso p { margin: 0; }
    .en-curso .fila { justify-content: space-between; }
  `,
})
export default class NuevoPartido {
  private readonly equiposServicio = inject(Equipos);
  private readonly jugadores = inject(Jugadores);
  private readonly partidos = inject(Partidos);
  private readonly router = inject(Router);
  protected readonly vivo = inject(PartidoEnVivo);

  protected readonly lados = [
    { clave: 'local', titulo: 'Local' },
    { clave: 'visitante', titulo: 'Visitante' },
  ] as const;
  protected readonly equipos = resource({ loader: () => this.equiposServicio.listar() });
  private readonly enCurso = resource({ loader: () => this.partidos.enCurso() });
  protected readonly otrosEnCurso = computed(() =>
    (this.enCurso.value() ?? []).filter((p) => p.id !== this.vivo.estado()?.partidoId),
  );
  protected duracionCuartoMin = 10;
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
      const duracion = Math.round(this.duracionCuartoMin);
      if (!(duracion >= 1 && duracion <= 20)) throw new ErrorApi('Los cuartos tienen que durar entre 1 y 20 minutos.');
      await this.vivo.iniciar({
        fecha: this.fecha || null,
        lugar: this.lugar.trim() || null,
        duracionCuartoMin: duracion,
        local: l,
        visitante: v,
      });
      this.router.navigate(['/partidos/en-vivo']);
    });
  }

  protected retomar(p: PartidoEnCurso) {
    return this.ejecutar(async () => {
      const [jugadas, local, visitante] = await Promise.all([
        this.partidos.jugadas(p.id),
        this.equipoEnVivo(p.equipoLocalId, p.local),
        this.equipoEnVivo(p.equipoVisitanteId, p.visitante),
      ]);
      this.vivo.retomar({
        partidoId: p.id,
        fecha: p.fecha,
        lugar: p.lugar,
        duracionCuartoMin: p.duracionCuartoMin,
        local,
        visitante,
        jugadas,
      });
      this.router.navigate(['/partidos/en-vivo']);
    });
  }

  private async equipoEnVivo(id: number, nombre?: string): Promise<EquipoEnVivo> {
    const equipo = this.equipos.value()?.find((e) => e.id === id) ?? ({ nombre, escudo: null } as Equipo);
    const jugadores = await this.jugadores.porEquipo(id);
    return {
      id,
      nombre: equipo.nombre,
      escudo: equipo.escudo,
      jugadores: jugadores
        .map((j) => ({ id: j.id, nombre: j.nombre, numero: j.numero }))
        .sort((a, b) => a.numero - b.numero),
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
