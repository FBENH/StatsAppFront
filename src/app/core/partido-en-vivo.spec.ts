import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EquipoEnVivo, PartidoEnVivo } from './partido-en-vivo';

const equipo = (id: number, jugadores: number[]): EquipoEnVivo => ({
  id,
  nombre: `Equipo ${id}`,
  escudo: null,
  jugadores: jugadores.map((j) => ({ id: j, nombre: `J${j}`, numero: j })),
  enCancha: [],
});

describe('PartidoEnVivo', () => {
  let vivo: PartidoEnVivo;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    vivo = TestBed.inject(PartidoEnVivo);
    vivo.iniciar({ fecha: '2026-10-16', lugar: null, local: equipo(1, [11, 12]), visitante: equipo(2, [21, 22]) });
  });

  it('una jugada suma al jugador y a su equipo', () => {
    vivo.registrar(11, '2');
    vivo.registrar(21, '3');
    vivo.registrar(12, '1');
    const e = vivo.estado()!;
    expect(e.jugadores[11].puntos).toBe(2);
    expect(vivo.puntosLocal()).toBe(3);
    expect(vivo.puntosVisitante()).toBe(3);
  });

  it('deshace varios pasos', () => {
    vivo.registrar(11, '2');
    vivo.registrar(11, '3');
    vivo.registrar(21, 'fal');
    vivo.deshacer();
    vivo.deshacer();
    expect(vivo.puntosLocal()).toBe(2);
    expect(vivo.estado()!.jugadores[21].faltas).toBe(0);
    vivo.deshacer();
    expect(vivo.puntosLocal()).toBe(0);
    expect(vivo.puedeDeshacer()).toBe(false);
  });

  it('el reloj usa la hora real y se detiene en cero', () => {
    vivo.arrancar(1_000);
    expect(vivo.restante(61_000)).toBe(540_000);
    vivo.parar(61_000);
    expect(vivo.restante(999_999)).toBe(540_000);
    vivo.arrancar(100_000);
    vivo.revisar(100_000 + 600_000);
    expect(vivo.corriendo()).toBe(false);
    expect(vivo.restante()).toBe(0);
  });

  it('una hora anterior al arranque no suma tiempo al reloj', () => {
    vivo.arrancar(5_000);
    expect(vivo.restante(4_000)).toBe(600_000);
  });

  it('cuenta los minutos de cada jugador según los cambios', () => {
    vivo.cambiar(1, [11], 0);
    vivo.arrancar(0);
    vivo.cambiar(1, [12], 60_000); // 11 jugó 1 minuto
    vivo.parar(90_000); // 12 jugó 30 segundos
    const e = vivo.estado()!;
    expect(e.jugadores[11].msJugados).toBe(60_000);
    expect(e.jugadores[12].msJugados).toBe(30_000);
  });

  it('deshacer un cambio no devuelve el tiempo jugado', () => {
    vivo.cambiar(1, [11], 0);
    vivo.arrancar(0);
    vivo.cambiar(1, [12], 60_000);
    vivo.deshacer();
    const e = vivo.estado()!;
    expect(e.local.enCancha).toEqual([11]);
    expect(e.jugadores[11].msJugados).toBe(60_000);
  });

  it('no deja más de cinco en cancha', () => {
    vivo.cambiar(1, [1, 2, 3, 4, 5, 6], 0);
    expect(vivo.estado()!.local.enCancha).toHaveLength(5);
  });

  it('arma el pedido con ganador y minutos en milisegundos', () => {
    vivo.cambiar(2, [21], 0);
    vivo.arrancar(0);
    vivo.registrar(21, '2');
    const pedido = vivo.pedido(45_000);
    expect(pedido.partido).toMatchObject({ equipoLocal: 1, equipoVisitante: 2, ganador: 2, fecha: '2026-10-16' });
    expect(pedido.statJ.find((s) => s.jugadorId === 21)).toMatchObject({ puntos: 2, equipoId: 2, minutos: 45_000 });
    expect(pedido.statP).toHaveLength(2);
  });

  it('un empate no tiene ganador', () => {
    expect(vivo.pedido(0).partido.ganador).toBeNull();
  });

  it('sobrevive a una recarga', () => {
    vivo.registrar(11, '3');
    TestBed.tick();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    expect(TestBed.inject(PartidoEnVivo).puntosLocal()).toBe(3);
  });

  it('al finalizar envía el partido y lo borra del dispositivo', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultado = vivo.finalizar();
    const req = http.expectOne((r) => r.url.endsWith('/Partido/Crear'));
    expect(req.request.method).toBe('POST');
    req.flush({ exito: 1, mensaje: null, data: 7 });
    expect(await resultado).toBe(7);
    expect(vivo.estado()).toBeNull();
  });
});
