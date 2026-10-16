import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { ANCHO, ARO, ESQUINA_X, ESQUINA_Y, LARGO, RADIO_TRIPLE } from '../core/cancha';

export interface PuntoTiro {
  x: number;
  y: number;
  acierto: boolean;
  /** Texto para lectores de pantalla y tooltip. */
  titulo?: string;
  /** Lo resalta (por ejemplo, el último tiro). */
  nuevo?: boolean;
}

/** Media cancha. Muestra tiros y, si es interactiva, avisa dónde se tocó (en coordenadas de 0 a 1). */
@Component({
  selector: 'app-cancha',
  template: `
    <svg #svg [attr.viewBox]="'0 0 ' + ancho + ' ' + largo" [class.interactiva]="interactiva()"
      (click)="tocar($event)" role="img" [attr.aria-label]="etiqueta()">
      <rect class="piso" x="0" y="0" [attr.width]="ancho" [attr.height]="largo" />
      <g class="lineas">
        <rect x="50.5" y="0" width="49" height="58" />
        <circle cx="75" cy="58" r="18" />
        <path [attr.d]="triple" />
        <path d="M 62.5 15.75 A 12.5 12.5 0 0 0 87.5 15.75" />
        <line x1="66" y1="12" x2="84" y2="12" />
        <circle [attr.cx]="aro.x" [attr.cy]="aro.y" r="2.3" />
      </g>
      @if (marca(); as m) {
        <circle class="marca" [attr.cx]="m.x * ancho" [attr.cy]="m.y * largo" r="4.5" />
      }
      @for (t of tiros(); track $index) {
        <circle class="tiro" [class.acierto]="t.acierto" [class.nuevo]="t.nuevo"
          [attr.cx]="t.x * ancho" [attr.cy]="t.y * largo" r="2.6">
          @if (t.titulo) { <title>{{ t.titulo }}</title> }
        </circle>
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { display: block; width: 100%; height: auto; border-radius: var(--radio); }
    .interactiva { cursor: crosshair; touch-action: manipulation; }
    .piso { fill: var(--cancha, #e9d9bf); }
    .lineas { fill: none; stroke: var(--cancha-lineas, #fff); stroke-width: 0.9; }
    .tiro { fill: none; stroke: var(--peligro); stroke-width: 1.1; }
    .tiro.acierto { fill: var(--exito); stroke: var(--exito); }
    .tiro.nuevo { animation: aparecer 0.6s ease-out; }
    .marca { fill: var(--acento); stroke: #fff; stroke-width: 1; animation: latido 1s ease-in-out infinite; }
    @keyframes aparecer { from { r: 9; opacity: 0; } to { opacity: 1; } }
    @keyframes latido { 50% { r: 6; } }
    @media (prefers-reduced-motion: reduce) { .tiro.nuevo, .marca { animation: none; } }
  `,
})
export class Cancha {
  readonly tiros = input<PuntoTiro[]>([]);
  readonly interactiva = input(false);
  /** Lugar elegido y todavía sin confirmar. */
  readonly marca = input<{ x: number; y: number } | null>(null);
  readonly etiqueta = input('Cancha');
  readonly toque = output<{ x: number; y: number }>();

  protected readonly ancho = ANCHO;
  protected readonly largo = LARGO;
  protected readonly aro = ARO;
  protected readonly triple =
    `M ${ESQUINA_X} 0 L ${ESQUINA_X} ${ESQUINA_Y} ` +
    `A ${RADIO_TRIPLE} ${RADIO_TRIPLE} 0 0 0 ${ANCHO - ESQUINA_X} ${ESQUINA_Y} L ${ANCHO - ESQUINA_X} 0`;
  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  protected tocar(evento: MouseEvent) {
    if (!this.interactiva()) return;
    const caja = this.svg().nativeElement.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width;
    const y = (evento.clientY - caja.top) / caja.height;
    this.toque.emit({ x: redondear(x), y: redondear(y) });
  }
}

const redondear = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
