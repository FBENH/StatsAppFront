import { HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { tap } from 'rxjs';
import { Api } from './api';
import { Sesion } from './modelos';

const CLAVE = 'statsapp.sesion';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly sesion = signal<Sesion | null>(leerSesion());

  readonly usuario = computed(() => this.sesion()?.userName ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly logueado = computed(() => this.sesion() !== null);

  async ingresar(usuario: string, password: string) {
    const sesion = await this.api.post<Sesion>('/Usuario/LogIn', { usuario, password });
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
    this.sesion.set(sesion);
  }

  registrar(usuario: string, pass: string) {
    return this.api.post<null>('/Usuario/Registro', { usuario, pass });
  }

  salir() {
    localStorage.removeItem(CLAVE);
    this.sesion.set(null);
    this.router.navigate(['/ingresar']);
  }
}

// Lee la sesión guardada y la descarta si el token ya venció.
function leerSesion(): Sesion | null {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
    if (!sesion) return null;
    const { exp } = JSON.parse(atob(sesion.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return exp * 1000 > Date.now() ? sesion : null;
  } catch {
    return null;
  }
}

export const authGuard: CanActivateFn = () =>
  inject(Auth).logueado() || inject(Router).createUrlTree(['/ingresar']);

// Agrega el token a cada pedido y cierra la sesión si la API responde 401.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.token();
  const pedido = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(pedido).pipe(
    tap({
      error: (e: { status?: number }) => {
        if (e.status === 401 && token) auth.salir();
      },
    }),
  );
};
