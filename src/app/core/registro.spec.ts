import { calcular, Jugada } from './registro';

// Mismos casos que el test de la API (ApiTests.EnVivo.cs), para que las dos cuentas coincidan.
const partido = { localId: 1, visitanteId: 2, duracionCuartoMin: 10 };
let n = 0;
const j = (datos: Partial<Jugada> & Pick<Jugada, 'tipo' | 'equipoId'>): Jugada => ({
  id: String(++n),
  numero: n,
  cuarto: 1,
  relojMs: null,
  ...datos,
});

describe('calcular', () => {
  beforeEach(() => (n = 0));

  it('suma las jugadas al jugador y a su equipo', () => {
    const p = calcular(partido, [
      j({ tipo: 'Tiro', equipoId: 1, jugadorId: 10, valor: 3, acierto: true }),
      j({ tipo: 'Tiro', equipoId: 2, jugadorId: 20, valor: 2, acierto: false }),
      j({ tipo: 'Rebote', equipoId: 1, jugadorId: 10, ofensivo: false }),
      j({ tipo: 'Rebote', equipoId: 2, ofensivo: true }),
      j({ tipo: 'Libre', equipoId: 1, jugadorId: 11, acierto: true }),
    ]);
    expect(p.equipos[1]).toMatchObject({ puntos: 4, aciertos3Puntos: 1, rebotesDefensivos: 1, aciertos1Punto: 1 });
    expect(p.equipos[2]).toMatchObject({ puntos: 0, intentos2Puntos: 1, rebotesOfensivos: 1 });
    expect(p.jugadores[10]).toMatchObject({ puntos: 3, rebotes: 1, equipoId: 1 });
    expect(p.jugadores[20]).toMatchObject({ intentos2Puntos: 1, rebotes: 0 });
  });

  it('cuenta los minutos con el reloj del partido, a través de los cuartos', () => {
    const jugadas = [
      j({ tipo: 'Cambio', equipoId: 1, jugadorId: 10, relojMs: 600_000 }),
      j({ tipo: 'Cambio', equipoId: 1, jugadorId: 11, saleId: 10, cuarto: 2, relojMs: 480_000 }),
    ];
    const p = calcular(partido, jugadas, { cuarto: 2, relojMs: 300_000 });
    expect(p.jugadores[10].msJugados).toBe(12 * 60_000);
    expect(p.jugadores[11].msJugados).toBe(3 * 60_000);
    expect(p.enCancha[1]).toEqual([11]);
  });

  it('sin reloj no cuenta minutos pero sí quién está en cancha', () => {
    const p = calcular(partido, [
      j({ tipo: 'Cambio', equipoId: 2, jugadorId: 20 }),
      j({ tipo: 'Cambio', equipoId: 2, jugadorId: 21 }),
      j({ tipo: 'Cambio', equipoId: 2, saleId: 20 }),
    ]);
    expect(p.enCancha[2]).toEqual([21]);
    expect(p.jugadores[20].msJugados).toBe(0);
  });

  it('las prórrogas duran 5 minutos', () => {
    const p = calcular(partido, [j({ tipo: 'Cambio', equipoId: 1, jugadorId: 10, cuarto: 4, relojMs: 60_000 })], {
      cuarto: 5,
      relojMs: 0,
    });
    expect(p.jugadores[10].msJugados).toBe(6 * 60_000);
  });
});
