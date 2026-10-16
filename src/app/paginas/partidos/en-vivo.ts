import { Component, computed, DestroyRef, effect, inject, signal, viewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api';
import { Accion, ACCIONES, formatearReloj } from '../../core/estadisticas';
import { EquipoEnVivo, MAX_EN_CANCHA, PartidoEnVivo } from '../../core/partido-en-vivo';
import { FilaPlanilla, Planilla } from '../../compartido/planilla';

@Component({
  imports: [RouterLink, Planilla],
  template: `
    @if (vivo.estado(); as e) {
      <section class="contenedor">
        <div class="tarjeta marcador">
          <div class="lado">
            <span class="nombre">{{ e.local.nombre }}</span>
            <span class="puntos">{{ vivo.puntosLocal() }}</span>
          </div>
          <div class="reloj">
            <span class="tiempo" [class.parado]="!vivo.corriendo()">{{ reloj() }}</span>
            <div class="fila">
              @if (vivo.corriendo()) {
                <button class="boton chico" type="button" (click)="vivo.parar()">Pausa</button>
              } @else {
                <button class="boton chico primario" type="button" (click)="vivo.arrancar()">Seguir</button>
              }
              <button class="boton chico" type="button" (click)="editarReloj()">Editar</button>
              <button class="boton chico" type="button" (click)="vivo.fijarReloj()" title="Volver a 10:00">Nuevo cuarto</button>
            </div>
          </div>
          <div class="lado">
            <span class="nombre">{{ e.visitante.nombre }}</span>
            <span class="puntos">{{ vivo.puntosVisitante() }}</span>
          </div>
        </div>

        <div class="fila acciones-generales">
          <button class="boton" type="button" (click)="abrirCambios()">Cambios</button>
          <button class="boton" type="button" (click)="vivo.deshacer()" [disabled]="!vivo.puedeDeshacer()">Deshacer</button>
          <button class="boton" type="button" (click)="corregir()">Corregir puntos</button>
          <span class="separador"></span>
          <button class="boton primario" type="button" (click)="finalizar()" [disabled]="guardando()">Terminar partido</button>
          <button class="boton peligro" type="button" (click)="descartar()">Descartar</button>
        </div>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

        <div class="dos-columnas">
          @for (equipo of [e.local, e.visitante]; track equipo.id) {
            <div class="tarjeta">
              <h2>{{ equipo.nombre }}</h2>
              @if (equipo.enCancha.length === 0) {
                <p class="suave">No hay nadie en cancha. Usá "Cambios" para elegir quién juega.</p>
              }
              <div class="en-cancha">
                @for (j of enCancha(equipo); track j.id) {
                  <button type="button" class="jugador" [class.elegido]="elegido() === j.id" (click)="elegir(j.id)"
                    [attr.aria-pressed]="elegido() === j.id">
                    <span class="numero">{{ j.numero }}</span>
                    <span class="nombre-jugador">{{ j.nombre }}</span>
                    <span class="suave detalle">{{ e.jugadores[j.id].puntos }} pts · {{ e.jugadores[j.id].faltas }} f</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <div class="tarjeta jugadas">
          <p class="suave">
            @if (elegido() === null) { Elegí un jugador y después la jugada. }
            @else { Jugada para <strong>{{ nombreElegido() }}</strong>: }
          </p>
          <div class="botonera">
            @for (a of acciones; track a.accion) {
              <button type="button" class="boton" [class]="a.tipo" [disabled]="elegido() === null" (click)="anotar(a.accion)">
                {{ a.texto }}
              </button>
            }
          </div>
        </div>

        @for (p of planillas(); track p.equipo) {
          <h2>{{ p.equipo }}</h2>
          <app-planilla [filas]="p.filas" [total]="p.total" [conMinutos]="true" />
        }
      </section>

      <dialog #dialogoCambios (close)="cambiosAbiertos.set(false)">
        @if (cambiosAbiertos()) {
          <h2>Jugadores en cancha</h2>
          <p class="suave">Hasta {{ maximo }} por equipo. Los minutos se cuentan desde este momento.</p>
          <div class="dos-columnas">
            @for (equipo of [e.local, e.visitante]; track equipo.id) {
              <fieldset>
                <legend>{{ equipo.nombre }} ({{ borrador()[equipo.id].length }}/{{ maximo }})</legend>
                @for (j of equipo.jugadores; track j.id) {
                  <label class="opcion">
                    <input type="checkbox" [checked]="borrador()[equipo.id].includes(j.id)"
                      [disabled]="!borrador()[equipo.id].includes(j.id) && borrador()[equipo.id].length >= maximo"
                      (change)="alternar(equipo.id, j.id)" />
                    #{{ j.numero }} {{ j.nombre }}
                  </label>
                }
              </fieldset>
            }
          </div>
          <div class="fila">
            <button class="boton primario" type="button" (click)="confirmarCambios()">Listo</button>
            <button class="boton" type="button" (click)="dialogoCambios.close()">Cancelar</button>
          </div>
        }
      </dialog>
    } @else {
      <section class="contenedor">
        <p>No hay ningún partido en curso.</p>
        <a class="boton primario" routerLink="/partidos/nuevo">Empezar un partido</a>
      </section>
    }
  `,
  styles: `
    h2 { margin: 1.25rem 0 0.5rem; }
    .tarjeta h2 { margin-top: 0; }
    .marcador { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; text-align: center; }
    .lado { display: grid; gap: 0.25rem; }
    .nombre { font-weight: 600; }
    .puntos { font-size: 3rem; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
    .reloj { display: grid; gap: 0.5rem; justify-items: center; }
    .tiempo { font-size: 2.5rem; font-variant-numeric: tabular-nums; font-weight: 700; }
    .tiempo.parado { color: var(--texto-suave); }
    .dos-columnas { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 1rem; }
    .acciones-generales { margin: 1rem 0; flex-wrap: wrap; }
    .separador { flex: 1; }
    .en-cancha { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem; }
    .jugador {
      display: grid; gap: 0.15rem; padding: 0.6rem; text-align: left; cursor: pointer;
      border: 2px solid var(--borde); border-radius: var(--radio); background: var(--superficie); color: inherit; font: inherit;
    }
    .jugador.elegido { border-color: var(--acento); background: var(--superficie-2); }
    .numero { font-size: 1.4rem; font-weight: 700; }
    .nombre-jugador { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .botonera { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.5rem; }
    .botonera .boton { padding: 0.8rem 0.5rem; }
    .acierto:not(:disabled) { border-color: var(--exito); }
    .fallo:not(:disabled) { border-color: var(--peligro); }
    fieldset { border: 1px solid var(--borde); border-radius: var(--radio); display: grid; gap: 0.25rem; }
    .opcion { display: flex; gap: 0.5rem; align-items: center; }
    dialog { width: min(720px, 95vw); }
    .jugadas { position: sticky; bottom: 0.5rem; z-index: 1; margin-bottom: 1rem; }
    .jugadas p { margin-top: 0; }
    @media (max-width: 600px) {
      .puntos { font-size: 2.2rem; }
      .tiempo { font-size: 1.8rem; }
      .en-cancha { grid-template-columns: repeat(5, 1fr); gap: 0.35rem; }
      .jugador { padding: 0.4rem 0.25rem; text-align: center; }
      .nombre-jugador { font-size: 0.75rem; }
      .detalle { display: none; }
      .botonera { grid-template-columns: repeat(4, 1fr); gap: 0.35rem; }
      .botonera .boton { padding: 0.5rem 0.2rem; font-size: 0.85rem; }
    }
  `,
})
export default class EnVivo {
  protected readonly vivo = inject(PartidoEnVivo);
  private readonly router = inject(Router);

  protected readonly acciones = ACCIONES;
  protected readonly maximo = MAX_EN_CANCHA;
  protected readonly dialogoCambios = viewChild<ElementRef<HTMLDialogElement>>('dialogoCambios');
  protected readonly elegido = signal<number | null>(null);
  protected readonly cambiosAbiertos = signal(false);
  protected readonly borrador = signal<Record<number, number[]>>({});
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);

  // Se actualiza varias veces por segundo mientras el reloj corre.
  private readonly ahora = signal(Date.now());
  protected readonly reloj = computed(() => {
    this.vivo.estado();
    return formatearReloj(this.vivo.restante(this.ahora()));
  });

  protected readonly nombreElegido = computed(() => {
    const e = this.vivo.estado();
    const j = [...(e?.local.jugadores ?? []), ...(e?.visitante.jugadores ?? [])].find((x) => x.id === this.elegido());
    return j ? `#${j.numero} ${j.nombre}` : '';
  });

  protected readonly planillas = computed(() => {
    const e = this.vivo.estado();
    if (!e) return [];
    return [e.local, e.visitante].map((equipo) => ({
      equipo: equipo.nombre,
      total: e.equipos[equipo.id],
      filas: equipo.jugadores.map(
        (j): FilaPlanilla => ({
          ...e.jugadores[j.id],
          titulo: `#${j.numero} ${j.nombre}${equipo.enCancha.includes(j.id) ? ' •' : ''}`,
          minutos: aHoras(e.jugadores[j.id].msJugados),
        }),
      ),
    }));
  });

  constructor() {
    const intervalo = setInterval(() => {
      this.ahora.set(Date.now());
      this.vivo.revisar();
    }, 250);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));

    // Si al entrar no hay nadie en cancha, se abre el diálogo de cambios.
    effect(() => {
      const e = this.vivo.estado();
      const dialogo = this.dialogoCambios();
      if (e && dialogo && !this.cambiosAbiertos() && e.local.enCancha.length + e.visitante.enCancha.length === 0) {
        this.abrirCambios();
      }
    });
  }

  protected enCancha(equipo: EquipoEnVivo) {
    return equipo.jugadores.filter((j) => equipo.enCancha.includes(j.id));
  }

  protected elegir(id: number) {
    this.elegido.update((actual) => (actual === id ? null : id));
  }

  protected anotar(accion: Accion) {
    const id = this.elegido();
    if (id === null) return;
    this.vivo.registrar(id, accion);
    this.elegido.set(null);
  }

  protected abrirCambios() {
    const e = this.vivo.estado();
    if (!e) return;
    this.borrador.set({ [e.local.id]: [...e.local.enCancha], [e.visitante.id]: [...e.visitante.enCancha] });
    this.cambiosAbiertos.set(true);
    this.dialogoCambios()?.nativeElement.showModal();
  }

  protected alternar(equipoId: number, jugadorId: number) {
    this.borrador.update((b) => {
      const lista = b[equipoId];
      return {
        ...b,
        [equipoId]: lista.includes(jugadorId) ? lista.filter((x) => x !== jugadorId) : [...lista, jugadorId],
      };
    });
  }

  protected confirmarCambios() {
    const e = this.vivo.estado();
    if (!e) return;
    const b = this.borrador();
    for (const equipo of [e.local, e.visitante]) {
      if (!mismos(equipo.enCancha, b[equipo.id])) this.vivo.cambiar(equipo.id, b[equipo.id]);
    }
    const elegido = this.elegido();
    if (elegido !== null && !Object.values(b).flat().includes(elegido)) this.elegido.set(null);
    this.dialogoCambios()?.nativeElement.close();
  }

  protected editarReloj() {
    const texto = prompt('Tiempo restante (m:ss)', formatearReloj(this.vivo.restante()));
    if (texto === null) return;
    const partes = texto.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!partes) return this.error.set('El tiempo tiene que tener la forma m:ss, por ejemplo 7:30.');
    this.error.set(null);
    this.vivo.fijarReloj((Number(partes[1]) * 60 + Number(partes[2] ?? 0)) * 1000);
  }

  protected corregir() {
    const e = this.vivo.estado();
    if (!e) return;
    for (const equipo of [e.local, e.visitante]) {
      const texto = prompt(`Puntos de ${equipo.nombre}`, String(e.equipos[equipo.id].puntos));
      if (texto === null) return;
      const puntos = Number(texto);
      if (!Number.isInteger(puntos) || puntos < 0) return this.error.set('Los puntos tienen que ser un entero positivo.');
      if (puntos !== e.equipos[equipo.id].puntos) this.vivo.corregirPuntos(equipo.id, puntos);
    }
    this.error.set(null);
  }

  protected async finalizar() {
    if (!confirm('¿Terminar el partido y guardarlo?')) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      const id = await this.vivo.finalizar();
      this.router.navigate(['/partidos', id]);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected descartar() {
    if (!confirm('¿Descartar el partido? Se pierde todo lo anotado.')) return;
    this.vivo.descartar();
    this.router.navigate(['/partidos']);
  }
}

function mismos(a: number[], b: number[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

// Milisegundos -> "hh:mm:ss", el mismo formato que devuelve la API.
function aHoras(ms: number) {
  const s = Math.floor(ms / 1000);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor(s / 60) % 60)}:${dos(s % 60)}`;
}
