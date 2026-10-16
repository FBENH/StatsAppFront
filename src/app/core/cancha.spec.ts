import { valorDeTiro, zona } from './cancha';
import { describir } from './relato';
import { Jugada } from './registro';

describe('cancha', () => {
  it('distingue dobles y triples por la ubicación', () => {
    expect(valorDeTiro(0.5, 0.21)).toBe(2); // bajo el aro
    expect(valorDeTiro(0.5, 0.7)).toBe(2); // tiro libre
    expect(valorDeTiro(0.5, 0.9)).toBe(3); // de frente, detrás de la línea
    expect(valorDeTiro(0.03, 0.14)).toBe(3); // esquina
    expect(valorDeTiro(0.1, 0.14)).toBe(2); // pegado a la esquina pero adentro
  });

  it('describe la zona del tiro', () => {
    expect(zona(0.5, 0.17)).toBe('bajo el aro');
    expect(zona(0.03, 0.14)).toBe('desde la esquina izquierda');
    expect(zona(0.97, 0.14)).toBe('desde la esquina derecha');
    expect(zona(0.5, 0.9)).toBe('de frente');
    expect(zona(0.5, 0.49)).toBe('en la pintura');
  });

  it('arma el relato de una jugada', () => {
    const quien = (id: number) => (id === 7 ? '#7 Ruiz' : `#${id}`);
    const equipo = (id: number) => (id === 1 ? 'Leones' : 'Tigres');
    const base = { id: 'a', numero: 1, cuarto: 1, relojMs: null, equipoId: 1 };
    const triple: Jugada = { ...base, tipo: 'Tiro', jugadorId: 7, valor: 3, acierto: true, x: 0.03, y: 0.14 };
    expect(describir(triple, quien, equipo)).toBe('Triple de #7 Ruiz desde la esquina izquierda');
    expect(describir({ ...base, tipo: 'Rebote', ofensivo: true }, quien, equipo)).toBe('Rebote ofensivo de Leones (equipo)');
    expect(describir({ ...base, tipo: 'Cambio', jugadorId: 7, saleId: 4 }, quien, equipo)).toBe('Cambio: entra #7 Ruiz por #4');
  });
});
