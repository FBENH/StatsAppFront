import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { url } from './api';
import { PartidoDeLiga } from './ligas';
import { Jugada } from './registro';

export interface AvisosDePartido {
  jugadas?: (jugadas: Jugada[]) => void;
  jugadaBorrada?: (id: string) => void;
  partido?: (partido: PartidoDeLiga) => void;
  /** Se volvió a conectar después de un corte: conviene pedir todo de nuevo por si se perdió algo. */
  reconectado?: () => void;
}

/** Registra algo para hacer al dejar de seguir, por ejemplo el `onCleanup` de un `effect`. */
type AlTerminar = (fn: () => void) => void;

/**
 * Conexión de SignalR con la API (/hubs/partidos) para seguir una liga o un partido en vivo.
 * Cada componente pide la suya con `seguir...` desde un `effect`, y se cierra con la limpieza del effect:
 * al cambiar de liga o de partido, o al destruirse el componente.
 */
@Injectable({ providedIn: 'root' })
export class EnVivo {
  seguirLiga(slug: string, avisos: Pick<AvisosDePartido, 'partido' | 'reconectado'>, alTerminar: AlTerminar) {
    return this.conectar((c) => c.invoke('SeguirLiga', slug), avisos, alTerminar);
  }

  seguirPartido(id: number, avisos: AvisosDePartido, alTerminar: AlTerminar) {
    return this.conectar((c) => c.invoke('SeguirPartido', id), avisos, alTerminar);
  }

  private conectar(suscribir: (c: HubConnection) => Promise<void>, avisos: AvisosDePartido, alTerminar: AlTerminar) {
    const conexion = new HubConnectionBuilder()
      .withUrl(url('/hubs/partidos'), {
        // El hub es público y la API permite cualquier origen, que no se puede combinar con cookies.
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Critical) // Los cortes se manejan acá y se reintenta solo.
      .build();
    if (avisos.jugadas) conexion.on('jugadas', (_: number, jugadas: Jugada[]) => avisos.jugadas!(jugadas));
    if (avisos.jugadaBorrada) conexion.on('jugadaBorrada', (_: number, id: string) => avisos.jugadaBorrada!(id));
    if (avisos.partido) conexion.on('partido', (p: PartidoDeLiga) => avisos.partido!(p));
    // Al reconectarse es una conexión nueva: hay que volver a suscribirse.
    conexion.onreconnected(async () => {
      await suscribir(conexion);
      avisos.reconectado?.();
    });
    let cerrada = false;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    // Si la primera conexión falla (por ejemplo, sin red), se reintenta cada 5 segundos.
    const iniciar = async () => {
      try {
        await conexion.start();
        await suscribir(conexion);
      } catch {
        if (!cerrada) reintento = setTimeout(() => iniciar().then(() => avisos.reconectado?.()), 5000);
      }
    };
    alTerminar(() => {
      cerrada = true;
      clearTimeout(reintento);
      if (conexion.state !== HubConnectionState.Disconnected) conexion.stop();
    });
    return iniciar();
  }
}
