import { aplicar, contadoresEnCero, formatearMinutos, formatearReloj, porcentaje, promediar, sumar } from './estadisticas';

describe('estadisticas', () => {
  it('un acierto de tres suma intento, acierto y puntos', () => {
    const c = contadoresEnCero();
    aplicar(c, '3');
    aplicar(c, '3m');
    expect(c).toMatchObject({ puntos: 3, intentos3Puntos: 2, aciertos3Puntos: 1 });
  });

  it('los rebotes ofensivos y defensivos suman al total', () => {
    const c = contadoresEnCero();
    aplicar(c, 'ofe');
    aplicar(c, 'def');
    aplicar(c, 'def');
    expect(c).toMatchObject({ rebotes: 3, rebotesOfensivos: 1, rebotesDefensivos: 2 });
  });

  it('porcentaje es null sin intentos y redondea a un decimal', () => {
    expect(porcentaje(0, 0)).toBeNull();
    expect(porcentaje(1, 3)).toBe(33.3);
  });

  it('suma y promedia planillas', () => {
    const a = { ...contadoresEnCero(), puntos: 10, robos: 1 };
    const b = { ...contadoresEnCero(), puntos: 15, robos: 2 };
    expect(sumar([a, b])).toMatchObject({ puntos: 25, robos: 3 });
    expect(promediar([a, b])).toMatchObject({ puntos: 12.5, robos: 1.5 });
    expect(promediar([])).toBeNull();
  });

  it('formatea minutos y reloj', () => {
    expect(formatearMinutos('01:02:05')).toBe('62:05');
    expect(formatearMinutos(null)).toBe('');
    expect(formatearReloj(600_000)).toBe('10:00');
    expect(formatearReloj(59_001)).toBe('1:00');
    expect(formatearReloj(-5)).toBe('0:00');
  });
});
