import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, retry, timer } from 'rxjs';

// La API usa una base gratis de Azure que se pausa cuando nadie la usa y tarda hasta un minuto en despertar.
// Mientras tanto los pedidos tardan (la API reintenta) o vuelven con 503: acá se reintentan y se avisa en pantalla.

/** Pasado este tiempo sin respuesta se muestra el aviso. */
export const ESPERA_AVISO_MS = 3000;
/** Reintentos ante un 503 (con la espera de Retry-After, unos dos minutos en total). */
export const REINTENTOS = 12;
const ESPERA_POR_DEFECTO_MS = 5000;

/** Para pedidos que no tienen que mostrar el aviso (el que despierta la base al abrir la app). */
export const SIN_AVISO = new HttpContextToken(() => false);

@Injectable({ providedIn: 'root' })
export class BaseDormida {
  private readonly esperando = signal(0);
  /** Hay algún pedido demorado o reintentando porque la base está despertando. */
  readonly despertando = computed(() => this.esperando() > 0);

  empezo() {
    this.esperando.update((n) => n + 1);
  }

  termino() {
    this.esperando.update((n) => Math.max(0, n - 1));
  }
}

/** Repetir es seguro: una lectura, o el ingreso (si la base no respondió, no se guardó nada). */
export function esReintentable(metodo: string, url: string) {
  return metodo === 'GET' || url.endsWith('/Usuario/LogIn');
}

/** Cuánto esperar antes de reintentar, según el Retry-After de la API. */
export function esperaDe(error: HttpErrorResponse) {
  const segundos = Number(error.headers?.get('Retry-After'));
  return segundos > 0 ? Math.min(segundos, 30) * 1000 : ESPERA_POR_DEFECTO_MS;
}

export const baseDormidaInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(BaseDormida);
  const conAviso = !req.context.get(SIN_AVISO);
  let avisando = false;
  const avisar = () => {
    if (conAviso && !avisando) {
      avisando = true;
      base.empezo();
    }
  };
  const demora = setTimeout(avisar, ESPERA_AVISO_MS);

  const pedido = esReintentable(req.method, req.url)
    ? next(req).pipe(
        retry({
          count: REINTENTOS,
          delay: (error) => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 503) throw error;
            avisar();
            return timer(esperaDe(error));
          },
        }),
      )
    : next(req);

  return pedido.pipe(
    finalize(() => {
      clearTimeout(demora);
      if (avisando) base.termino();
    }),
  );
};
