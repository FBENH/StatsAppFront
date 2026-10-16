import { Jugada } from './registro';
import { parcialActual, relatar } from './relato-partido';

const L = 1;
const V = 2;
const datos = {
  localId: L,
  visitanteId: V,
  quien: (id: number) => ({ 7: 'Ruiz', 4: 'Pérez', 9: 'Gómez' })[id] ?? `#${id}`,
  equipo: (id: number) => (id === L ? 'Leones' : 'Tigres'),
};
let n = 0;
const jugada = (tipo: Jugada['tipo'], equipoId: number, extra: Partial<Jugada> = {}): Jugada => ({
  id: `j${++n}`, numero: n, cuarto: 1, relojMs: 300_000, tipo, equipoId, ...extra,
});

describe('relato del partido', () => {
  it('junta la asistencia con su tiro y dice cómo queda el marcador', () => {
    const tiro = jugada('Tiro', L, { jugadorId: 7, acierto: true, valor: 3, x: 0.97, y: 0.14 });
    const lineas = relatar([tiro, jugada('Asistencia', L, { jugadorId: 4, relacionadaId: tiro.id })], datos);

    expect(lineas).toHaveLength(1);
    expect(lineas[0].texto).toMatch(/^Ruiz (clava un triple|mete un triple|anota de tres) desde la esquina derecha, asistencia de Pérez\. Leones adelante 3-0\.$/);
    expect(lineas[0].local).toBe(3);
  });

  it('cuenta el robo una sola vez y marca el cambio de líder', () => {
    const robo = jugada('Robo', V, { jugadorId: 9 });
    const lineas = relatar(
      [
        jugada('Tiro', L, { jugadorId: 7, acierto: true, valor: 2 }),
        robo,
        jugada('Perdida', L, { jugadorId: 4, relacionadaId: robo.id }),
        jugada('Tiro', V, { jugadorId: 9, acierto: true, valor: 3 }),
      ],
      datos,
    );

    expect(lineas.map((l) => l.texto)).toContainEqual('Gómez le roba la pelota a Pérez.');
    expect(lineas).toHaveLength(3);
    expect(lineas[2].texto).toContain('Tigres pasa al frente 3-2');
    expect(lineas[2].destacado).toBe(true);
  });

  it('avisa los parciales largos y el fin de cada cuarto', () => {
    const tiros = [1, 2, 3, 4].map(() => jugada('Tiro', V, { jugadorId: 9, acierto: true, valor: 2 }));
    const lineas = relatar([...tiros, jugada('Falta', L, { jugadorId: 7, cuarto: 2 })], datos);

    expect(lineas[3].texto).toContain('parcial 8-0 de Tigres');
    expect(parcialActual(lineas)).toEqual({ equipoId: V, puntos: 8 });
    expect(lineas[4].texto).toBe('Termina el 1.º cuarto: Leones 0, Tigres 8.');
  });
});
