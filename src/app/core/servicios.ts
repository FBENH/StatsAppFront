import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api, ErrorApi, url } from './api';
import { Jugada } from './registro';
import { Equipo, Jugador, JugadorListado, PartidoDetalle, PartidoResumen, Respuesta } from './modelos';

export interface EquipoForm {
  id?: number;
  nombre: string;
  ciudad: string | null;
  entrenador: string | null;
  escudo: string | null;
}

export interface JugadorForm {
  id?: number;
  nombre: string;
  numero: number;
  posicion: string | null;
  equipoId: number | null;
  altura: number | null;
  peso: number | null;
  foto: string | null;
}

@Injectable({ providedIn: 'root' })
export class Equipos {
  private readonly api = inject(Api);

  listar = () => this.api.get<Equipo[]>('/Equipo/Listar');
  obtener = (id: number) => this.api.get<Equipo>('/Equipo/ListarPorId', { idEquipo: id });
  crear = (equipo: EquipoForm) => this.api.post<null>('/Equipo/Crear', equipo);
  modificar = (equipo: EquipoForm) => this.api.put<null>('/Equipo/Modificar', equipo);
  eliminar = (id: number) => this.api.delete('/Equipo/Eliminar', { id });
  /** Crea un equipo con jugadores sin nombre, solo con número. Devuelve el id. */
  crearRapido = (nombre: string, numeros: number[]) =>
    this.api.post<number>('/Equipo/CrearEquipoRapido', {
      nombre,
      jugadores: numeros.map((numero) => ({ nombre: 'N/D', numero })),
    });
}

@Injectable({ providedIn: 'root' })
export class Jugadores {
  private readonly api = inject(Api);

  listar = () => this.api.get<JugadorListado[]>('/Jugadores/Listar');
  porEquipo = (equipoId: number) => this.api.get<JugadorListado[]>('/Jugadores/ListarPorEquipo', { equipoId });
  obtener = (id: number) => this.api.get<Jugador>('/Jugadores/ListarPorId', { id });
  crear = (jugador: JugadorForm) => this.api.post<null>('/Jugadores/Crear', jugador);
  modificar = (jugador: JugadorForm) => this.api.put<null>('/Jugadores/Modificar', jugador);
  eliminar = (id: number) => this.api.delete('/Jugadores/Eliminar', { id });
}

@Injectable({ providedIn: 'root' })
export class Partidos {
  private readonly api = inject(Api);

  listar = () => this.api.get<PartidoResumen[]>('/Partido/ListarTodos');
  obtener = (id: number) => this.api.get<PartidoDetalle>('/Partido/ConStats', { id });
  eliminar = (id: number) => this.api.delete('/Partido/Eliminar', { id });
  enCurso = () => this.api.get<PartidoEnCurso[]>('/Partido/EnCurso');
  jugadas = (partidoId: number) => this.api.get<Jugada[]>('/Partido/Jugadas', { partidoId });
}

export interface PartidoEnCurso {
  id: number;
  local: string;
  visitante: string;
  equipoLocalId: number;
  equipoVisitanteId: number;
  fecha: string | null;
  lugar: string | null;
  duracionCuartoMin: number;
  jugadas: number;
}

@Injectable({ providedIn: 'root' })
export class Imagenes {
  private readonly http = inject(HttpClient);

  /** Sube una imagen y devuelve su URL pública. */
  async subir(archivo: File): Promise<string> {
    const datos = new FormData();
    datos.append('image', archivo);
    try {
      const r = await firstValueFrom(
        this.http.post<Respuesta<{ blob: { uri: string } }>>(url('/Imagen/Upload'), datos),
      );
      return r.data.blob.uri;
    } catch (e: unknown) {
      throw new ErrorApi((e as { error?: { mensaje?: string } }).error?.mensaje ?? 'No se pudo subir la imagen.');
    }
  }
}
