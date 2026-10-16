import { Component, computed, inject, input, OnInit, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorApi, mensajeDeError } from '../../core/api';
import { EquipoEnVivo, PartidoEnVivo } from '../../core/partido-en-vivo';
import { Equipos, Jugadores, PartidoEnCurso, Partidos } from '../../core/servicios';
import { valor } from '../../core/recurso';

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
        @if (programadoId()) {
          <p class="liga">
            Partido de liga: <strong>{{ nombreEquipo(datos.local.id) }}</strong> vs <strong>{{ nombreEquipo(datos.visitante.id) }}</strong>
          </p>
        }
        <div class="campos-dobles" [hidden]="programadoId()">
          @for (lado of lados; track lado.clave) {
            <fieldset class="lado">
              <legend>{{ lado.titulo }}</legend>
              <div class="modo" role="radiogroup" [attr.aria-label]="'Equipo ' + lado.titulo">
                <button type="button" class="boton chico" [class.activo]="!datos[lado.clave].nuevo"
                  (click)="datos[lado.clave].nuevo = false" [attr.aria-pressed]="!datos[lado.clave].nuevo">Ya cargado</button>
                <button type="button" class="boton chico" [class.activo]="datos[lado.clave].nuevo"
                  (click)="datos[lado.clave].nuevo = true" [attr.aria-pressed]="datos[lado.clave].nuevo">Nuevo</button>
              </div>
              @if (datos[lado.clave].nuevo) {
                <label class="campo"><span>Nombre</span><input [(ngModel)]="datos[lado.clave].nombre" maxlength="30" /></label>
                @if (parecido(datos[lado.clave].nombre); as existente) {
                  <p class="sugerencia">
                    Ya tenés <strong>{{ existente.nombre }}</strong>.
                    <button type="button" class="boton chico" (click)="usarExistente(lado.clave, existente.id)">Usar ese</button>
                  </p>
                }
                <label class="campo">
                  <span>Números de camiseta, separados por coma</span>
                  <input [(ngModel)]="datos[lado.clave].numeros" inputmode="numeric" placeholder="4, 5, 7, 8, 10, 11, 12" />
                </label>
                <p class="suave nota">Los jugadores quedan como "#7"; los nombres se pueden poner después.</p>
              } @else {
                <label class="campo">
                  <span>Equipo</span>
                  <select [(ngModel)]="datos[lado.clave].id">
                    <option [ngValue]="null">Elegí un equipo</option>
                    @for (e of equipos.hasValue() ? equipos.value() : []; track e.id) { <option [ngValue]="e.id">{{ e.nombre }}</option> }
                  </select>
                </label>
              }
            </fieldset>
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


        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="boton primario" type="button" (click)="empezar()" [disabled]="ocupado()">Empezar partido</button>
      </div>
    </section>
  `,
  styles: `
    .aviso { border-color: var(--acento); }
    .formulario { max-width: 640px; }
    .lado { border: 1px solid var(--borde); border-radius: var(--radio); display: grid; gap: 0.5rem; }
    .modo { display: flex; gap: 0.35rem; }
    .boton.activo { background: var(--acento); border-color: var(--acento); color: var(--acento-texto); }
    .sugerencia { margin: 0; font-size: 0.9rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .nota { margin: 0; font-size: 0.8rem; }
    .liga { margin: 0; }
    .minutos { max-width: 10rem; }
    .en-curso { margin-bottom: 1rem; display: grid; gap: 0.5rem; }
    .en-curso h2, .en-curso p { margin: 0; }
    .en-curso .fila { justify-content: space-between; }
  `,
})
export default class NuevoPartido implements OnInit {
  // Llegan por la URL cuando se empieza a anotar un partido del fixture de una liga.
  readonly programado = input<string>();
  readonly local = input<string>();
  readonly visitante = input<string>();
  readonly fechaProgramada = input<string>(undefined, { alias: 'fecha' });
  protected readonly programadoId = computed(() => (this.programado() ? +this.programado()! : undefined));

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
    (valor(this.enCurso) ?? []).filter((p) => p.id !== this.vivo.estado()?.partidoId),
  );
  protected duracionCuartoMin = 10;
  protected datos: Record<Lado, DatosEquipo> = { local: datosVacios(), visitante: datosVacios() };
  protected fecha = new Date().toISOString().slice(0, 10);
  protected lugar = '';
  protected readonly error = signal<string | null>(null);
  protected readonly ocupado = signal(false);

  ngOnInit() {
    if (!this.programadoId()) return;
    this.datos = { local: { ...datosVacios(), id: +this.local()! }, visitante: { ...datosVacios(), id: +this.visitante()! } };
    if (this.fechaProgramada()) this.fecha = this.fechaProgramada()!;
  }

  protected nombreEquipo(id: number | null) {
    return valor(this.equipos)?.find((e) => e.id === id)?.nombre ?? '…';
  }

  /** Equipo ya cargado con el mismo nombre (sin importar mayúsculas ni tildes). */
  protected parecido(nombre: string) {
    const buscado = normalizar(nombre);
    return buscado ? (valor(this.equipos) ?? []).find((e) => normalizar(e.nombre) === buscado) : undefined;
  }

  protected usarExistente(lado: Lado, id: number) {
    this.datos[lado] = { ...datosVacios(), id };
  }

  protected empezar() {
    return this.ejecutar(async () => {
      const duracion = Math.round(this.duracionCuartoMin);
      if (!(duracion >= 1 && duracion <= 20)) throw new ErrorApi('Los cuartos tienen que durar entre 1 y 20 minutos.');
      for (const lado of this.lados) this.validar(lado.clave, lado.titulo);
      const { local, visitante } = this.datos;
      if (!local.nuevo && !visitante.nuevo && local.id === visitante.id) {
        throw new ErrorApi('El local y el visitante tienen que ser distintos.');
      }
      // Los equipos nuevos se crean recién al empezar, así un error en el formulario no deja equipos sueltos.
      const ids = { local: await this.idDe('local'), visitante: await this.idDe('visitante') };
      const [l, v] = await Promise.all([this.equipoEnVivo(ids.local), this.equipoEnVivo(ids.visitante)]);
      const sinJugadores = [l, v].find((e) => e.jugadores.length === 0);
      if (sinJugadores) throw new ErrorApi(`${sinJugadores.nombre} no tiene jugadores.`);
      await this.vivo.iniciar({
        fecha: this.fecha || null,
        lugar: this.lugar.trim() || null,
        duracionCuartoMin: duracion,
        local: l,
        visitante: v,
        programadoId: this.programadoId(),
      });
      this.router.navigate(['/partidos/en-vivo']);
    });
  }

  private validar(lado: Lado, titulo: string) {
    const d = this.datos[lado];
    if (!d.nuevo) {
      if (d.id === null) throw new ErrorApi(`Elegí el equipo ${titulo.toLowerCase()}.`);
      return;
    }
    if (!d.nombre.trim()) throw new ErrorApi(`Poné el nombre del equipo ${titulo.toLowerCase()}.`);
    const numeros = leerNumeros(d.numeros);
    if (numeros === null) throw new ErrorApi(`${d.nombre}: los números tienen que ser enteros entre 0 y 99.`);
    if (numeros.length === 0) throw new ErrorApi(`${d.nombre}: poné al menos un número de camiseta.`);
  }

  private async idDe(lado: Lado) {
    const d = this.datos[lado];
    if (!d.nuevo) return d.id!;
    const id = await this.equiposServicio.crearRapido(d.nombre.trim(), leerNumeros(d.numeros)!);
    // Si después falla algo, al reintentar se usa el equipo ya creado.
    this.datos[lado] = { ...datosVacios(), id };
    this.equipos.reload();
    return id;
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
    const [jugadores, equipo] = await Promise.all([
      this.jugadores.porEquipo(id),
      valor(this.equipos)?.find((e) => e.id === id) ?? (nombre ? { nombre, escudo: null } : this.equiposServicio.obtener(id)),
    ]);
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

type Lado = 'local' | 'visitante';
interface DatosEquipo {
  nuevo: boolean;
  id: number | null;
  nombre: string;
  numeros: string;
}

const datosVacios = (): DatosEquipo => ({ nuevo: false, id: null, nombre: '', numeros: '' });

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** "4, 5 7;10" -> [4, 5, 7, 10]. Null si hay algo que no es un número de camiseta. */
function leerNumeros(texto: string) {
  const numeros = [...new Set(texto.split(/[\s,;]+/).filter(Boolean).map(Number))];
  return numeros.every((n) => Number.isInteger(n) && n >= 0 && n <= 99) ? numeros : null;
}
