import { zona } from './cancha';
import { Jugada } from './registro';

/** Cómo se llama a un jugador en el relato: "#7 Ruiz", o "#7" si no tiene nombre cargado. */
export const nombreCorto = (j: { numero: number; nombre: string }) =>
  sinNombre(j.nombre) ? `#${j.numero}` : `#${j.numero} ${j.nombre}`;

export const sinNombre = (nombre: string) => !nombre || nombre === 'N/D' || /^#\d+$/.test(nombre);

/**
 * Una línea que describe la jugada, para el aviso de "deshacer" y el registro.
 * `quien` devuelve el nombre del jugador, y `equipo` el del equipo.
 */
export function describir(j: Jugada, quien: (id: number) => string, equipo: (id: number) => string): string {
  const jugador = j.jugadorId != null ? quien(j.jugadorId) : `${equipo(j.equipoId)} (equipo)`;
  const lugar = j.x != null && j.y != null ? ` ${zona(j.x, j.y)}` : '';
  switch (j.tipo) {
    case 'Tiro':
      if (j.valor === 3) return j.acierto ? `Triple de ${jugador}${lugar}` : `${jugador} falla un triple${lugar}`;
      return j.acierto ? `Doble de ${jugador}${lugar}` : `${jugador} falla de 2${lugar}`;
    case 'Libre':
      return j.acierto ? `Libre convertido por ${jugador}` : `${jugador} falla un libre`;
    case 'Rebote':
      return `Rebote ${j.ofensivo ? 'ofensivo' : 'defensivo'} de ${jugador}`;
    case 'Asistencia':
      return `Asistencia de ${jugador}`;
    case 'Robo':
      return `Robo de ${jugador}`;
    case 'Tapon':
      return `Tapón de ${jugador}`;
    case 'Perdida':
      return `Pérdida de ${jugador}`;
    case 'Falta':
      return `Falta de ${jugador}`;
    case 'TiempoMuerto':
      return `Tiempo muerto de ${equipo(j.equipoId)}`;
    case 'Cambio': {
      const entra = j.jugadorId != null ? quien(j.jugadorId) : null;
      const sale = j.saleId != null ? quien(j.saleId) : null;
      if (entra && sale) return `Cambio: entra ${entra} por ${sale}`;
      return entra ? `Entra ${entra}` : `Sale ${sale}`;
    }
  }
}
