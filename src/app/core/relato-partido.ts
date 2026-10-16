import { zona } from './cancha';
import { formatearReloj } from './estadisticas';
import { Jugada } from './registro';

export interface LineaRelato {
  id: string;
  /** "2C 5:40" */
  momento: string;
  texto: string;
  equipoId: number | null;
  /** Puntos que sumó la jugada. */
  puntos: number;
  local: number;
  visitante: number;
  /** Cambio de líder, parcial largo o fin de cuarto: se resalta. */
  destacado: boolean;
}

export interface DatosRelato {
  localId: number;
  visitanteId: number;
  quien: (jugadorId: number) => string;
  equipo: (equipoId: number) => string;
}

/** A partir de este parcial sin respuesta se menciona en el relato. */
const PARCIAL_MINIMO = 8;

const nombreCuarto = (c: number) => (c <= 4 ? `${c}.º cuarto` : `prórroga ${c - 4}`);

// Para no repetir siempre el mismo verbo; depende del id, así la misma jugada se relata siempre igual.
function variante(id: string, opciones: string[]) {
  let suma = 0;
  for (const c of id) suma += c.charCodeAt(0);
  return opciones[suma % opciones.length];
}

/**
 * Relato jugada a jugada, en orden. Junta la asistencia con su tiro, el robo con la pérdida y el tapón con el tiro,
 * y agrega cómo queda el marcador, los cambios de líder y los parciales.
 * Es texto armado con frases según el tipo de jugada: no usa IA.
 */
export function relatar(jugadas: Jugada[], datos: DatosRelato): LineaRelato[] {
  const { quien, equipo } = datos;
  const relacionadas = new Map<string, Jugada[]>();
  for (const j of jugadas) {
    if (j.relacionadaId) relacionadas.set(j.relacionadaId, [...(relacionadas.get(j.relacionadaId) ?? []), j]);
  }
  const absorbidas = new Set<string>();
  const lineas: LineaRelato[] = [];
  const marcador = { [datos.localId]: 0, [datos.visitanteId]: 0 };
  let lider: number | null = null;
  let parcial = { equipoId: null as number | null, puntos: 0 };
  let cuarto = jugadas[0]?.cuarto ?? 1;

  const agregar = (j: Jugada, texto: string, puntos = 0, destacado = false) =>
    lineas.push({
      id: j.id,
      momento: (j.cuarto <= 4 ? `${j.cuarto}C` : `P${j.cuarto - 4}`) + (j.relojMs == null ? '' : ` ${formatearReloj(j.relojMs)}`),
      texto,
      equipoId: j.equipoId,
      puntos,
      local: marcador[datos.localId],
      visitante: marcador[datos.visitanteId],
      destacado,
    });

  for (const j of jugadas) {
    if (j.cuarto !== cuarto) {
      const l = marcador[datos.localId];
      const v = marcador[datos.visitanteId];
      lineas.push({
        id: `fin-${cuarto}`, momento: '', equipoId: null, puntos: 0, local: l, visitante: v, destacado: true,
        texto: `Termina el ${nombreCuarto(cuarto)}: ${equipo(datos.localId)} ${l}, ${equipo(datos.visitanteId)} ${v}.`,
      });
      cuarto = j.cuarto;
    }
    if (absorbidas.has(j.id) || j.tipo === 'Cambio') continue;
    const jugador = j.jugadorId != null ? quien(j.jugadorId) : equipo(j.equipoId);
    const otras = relacionadas.get(j.id) ?? [];
    otras.forEach((o) => absorbidas.add(o.id));
    const asistencia = otras.find((o) => o.tipo === 'Asistencia');
    const tapon = otras.find((o) => o.tipo === 'Tapon');
    const robo = otras.find((o) => o.tipo === 'Robo');
    const lugar = j.x != null && j.y != null ? ` ${zona(j.x, j.y)}` : '';

    let texto: string;
    let puntos = 0;
    switch (j.tipo) {
      case 'Tiro':
        if (j.acierto) {
          puntos = j.valor ?? 2;
          texto = puntos === 3
            ? `${jugador} ${variante(j.id, ['clava un triple', 'mete un triple', 'anota de tres'])}${lugar}`
            : `${jugador} ${variante(j.id, ['anota', 'convierte', 'suma dos'])}${lugar}`;
          if (asistencia?.jugadorId != null) texto += `, asistencia de ${quien(asistencia.jugadorId)}`;
        } else if (tapon?.jugadorId != null) {
          texto = `Tapón de ${quien(tapon.jugadorId)} a ${jugador}`;
        } else {
          texto = `${jugador} falla ${j.valor === 3 ? 'un triple' : 'de dos'}${lugar}`;
        }
        break;
      case 'Libre':
        puntos = j.acierto ? 1 : 0;
        texto = j.acierto ? `${jugador} convierte el libre` : `${jugador} falla el libre`;
        break;
      case 'Rebote':
        texto = `Rebote ${j.ofensivo ? 'ofensivo' : 'defensivo'} de ${jugador}`;
        break;
      case 'Perdida':
        // El robo se anota antes que la pérdida y apunta a ella al revés: la pérdida es la relacionada.
        texto = `Pérdida de ${jugador}`;
        break;
      case 'Robo': {
        const perdida = otras.find((o) => o.tipo === 'Perdida') ?? jugadas.find((o) => o.relacionadaId === j.id);
        texto = perdida?.jugadorId != null ? `${jugador} le roba la pelota a ${quien(perdida.jugadorId)}` : `Robo de ${jugador}`;
        break;
      }
      case 'Asistencia':
        texto = `Asistencia de ${jugador}`;
        break;
      case 'Tapon':
        texto = `Tapón de ${jugador}`;
        break;
      case 'Falta':
        texto = `Falta de ${jugador}`;
        break;
      case 'TiempoMuerto':
        texto = `Tiempo muerto de ${equipo(j.equipoId)}`;
        break;
      default:
        texto = jugador;
    }
    if (robo) continue; // pérdida que ya se contó en el robo
    let destacado = false;
    if (puntos > 0) {
      marcador[j.equipoId] += puntos;
      const l = marcador[datos.localId];
      const v = marcador[datos.visitanteId];
      const nuevoLider = l === v ? null : l > v ? datos.localId : datos.visitanteId;
      parcial = parcial.equipoId === j.equipoId ? { equipoId: j.equipoId, puntos: parcial.puntos + puntos } : { equipoId: j.equipoId, puntos };
      if (nuevoLider === null) texto += `. Empate en ${l}`;
      else if (nuevoLider !== lider && lider !== null) {
        texto += `. ${equipo(nuevoLider)} pasa al frente ${Math.max(l, v)}-${Math.min(l, v)}`;
        destacado = true;
      } else texto += `. ${equipo(nuevoLider)} ${nuevoLider === lider ? 'arriba' : 'adelante'} ${Math.max(l, v)}-${Math.min(l, v)}`;
      // Se menciona al llegar al mínimo y después cada 4 puntos más.
      if (parcial.puntos >= PARCIAL_MINIMO && (parcial.puntos - puntos < PARCIAL_MINIMO || parcial.puntos % 4 < puntos)) {
        texto += `, parcial ${parcial.puntos}-0 de ${equipo(j.equipoId)}`;
        destacado = true;
      }
      lider = nuevoLider;
    }
    agregar(j, texto + '.', puntos, destacado);
  }
  return lineas;
}

/** Parcial sin respuesta que está corriendo ahora, si llega al mínimo. */
export function parcialActual(lineas: LineaRelato[]): { equipoId: number; puntos: number } | null {
  let equipoId: number | null = null;
  let puntos = 0;
  for (let i = lineas.length - 1; i >= 0; i--) {
    const l = lineas[i];
    if (l.puntos === 0 || l.equipoId === null) continue;
    if (equipoId === null) equipoId = l.equipoId;
    if (l.equipoId !== equipoId) break;
    puntos += l.puntos;
  }
  return equipoId !== null && puntos >= PARCIAL_MINIMO ? { equipoId, puntos } : null;
}
