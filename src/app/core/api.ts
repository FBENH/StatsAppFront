import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Respuesta } from './modelos';

export const url = (ruta: string) => environment.apiUrl + ruta;

/** Error con el mensaje que manda la API, para mostrarlo tal cual. */
export class ErrorApi extends Error {}

// Envoltorio fino sobre HttpClient: devuelve data o lanza ErrorApi si exito es 0.
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  get<T>(ruta: string, params?: Record<string, string | number>) {
    return this.desenvolver(firstValueFrom(this.http.get<Respuesta<T>>(url(ruta), { params })));
  }

  post<T>(ruta: string, cuerpo: unknown) {
    return this.desenvolver(firstValueFrom(this.http.post<Respuesta<T>>(url(ruta), cuerpo)));
  }

  put<T>(ruta: string, cuerpo: unknown) {
    return this.desenvolver(firstValueFrom(this.http.put<Respuesta<T>>(url(ruta), cuerpo)));
  }

  delete(ruta: string, params: Record<string, string | number>) {
    return this.desenvolver(firstValueFrom(this.http.delete<Respuesta<unknown>>(url(ruta), { params })));
  }

  private async desenvolver<T>(pedido: Promise<Respuesta<T>>): Promise<T> {
    let respuesta: Respuesta<T>;
    try {
      respuesta = await pedido;
    } catch (e: unknown) {
      const mensaje = (e as { error?: { mensaje?: string } }).error?.mensaje;
      throw new ErrorApi(mensaje ?? 'No se pudo conectar con el servidor.');
    }
    if (respuesta.exito !== 1) throw new ErrorApi(respuesta.mensaje ?? 'No se encontró lo que buscabas.');
    return respuesta.data;
  }
}

export function mensajeDeError(e: unknown) {
  return e instanceof ErrorApi ? e.message : 'Ocurrió un error inesperado.';
}
