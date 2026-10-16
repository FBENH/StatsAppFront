import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EquipoEnVivo, PartidoEnVivo } from './partido-en-vivo';

const equipo = (id: number, jugadores: number[]): EquipoEnVivo => ({
  id,
  nombre: `Equipo ${id}`,
  escudo: null,
  jugadores: jugadores.map((j) => ({ id: j, nombre: `J${j}`, numero: j })),
});

const ok = (data: unknown = null) => ({ exito: 1, mensaje: null, data });
// Deja que corran las promesas pendientes (el envío es asíncrono).
const esperar = () => new Promise((r) => setTimeout(r));

describe('PartidoEnVivo', () => {
  let vivo: PartidoEnVivo;
  let http: HttpTestingController;

  const configurar = () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    vivo = TestBed.inject(PartidoEnVivo);
    http = TestBed.inject(HttpTestingController);
  };
  const envios = () => http.match((r) => r.url.includes('/Partido/Jugadas'));
  const responderEnvios = async () => {
    await esperar();
    let pedidos: TestRequest[];
    while ((pedidos = envios()).length > 0) {
      for (const p of pedidos) p.flush(ok(0));
      await esperar();
    }
  };

  beforeEach(async () => {
    localStorage.clear();
    configurar();
    const inicio = vivo.iniciar({ fecha: '2026-10-16', lugar: null, local: equipo(1, [11, 12]), visitante: equipo(2, [21, 22]) });
    http.expectOne((r) => r.url.endsWith('/Partido/Iniciar')).flush(ok(50));
    await inicio;
  });

  afterEach(() => vi.useRealTimers());

  it('crea el partido en la API y manda cada jugada', async () => {
    vivo.registrar(11, '2');
    await esperar();
    const envio = http.expectOne((r) => r.url.endsWith('/Partido/Jugadas?partidoId=50'));
    expect(envio.request.body).toEqual([
      expect.objectContaining({ tipo: 'Tiro', valor: 2, acierto: true, jugadorId: 11, equipoId: 1, numero: 1, cuarto: 1 }),
    ]);
    envio.flush(ok(1));
    await esperar();
    expect(vivo.pendientes()).toBe(0);
    expect(vivo.puntosLocal()).toBe(2);
  });

  it('sin conexión guarda las jugadas y las manda juntas cuando vuelve', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vivo.registrar(11, '3');
    await vi.advanceTimersByTimeAsync(0);
    envios()[0].error(new ProgressEvent('error'), { status: 0 });
    await vi.advanceTimersByTimeAsync(0);
    expect(vivo.conexion()).toBe('sin-conexion');

    vivo.registrar(21, 'fal');
    await vi.advanceTimersByTimeAsync(0);
    expect(envios()).toHaveLength(0);
    expect(vivo.pendientes()).toBe(2);
    expect(vivo.puntosLocal()).toBe(3);

    await vi.advanceTimersByTimeAsync(5000);
    const reintento = envios();
    expect(reintento).toHaveLength(1);
    expect(reintento[0].request.body).toHaveLength(2);
    reintento[0].flush(ok(2));
    await vi.advanceTimersByTimeAsync(0);
    expect(vivo.pendientes()).toBe(0);
    expect(vivo.conexion()).toBe('ok');
  });

  it('deshacer una jugada no enviada solo la saca de la cola; una enviada se borra en la API', async () => {
    vivo.registrar(11, '2');
    await responderEnvios();
    vivo.registrar(12, '3');
    vivo.deshacer(); // la de 3 todavía está en la cola junto con su envío en curso
    vivo.deshacer(); // la de 2 ya estaba guardada
    await esperar();
    for (const p of envios().filter((r) => r.request.method === 'POST')) p.flush(ok(1));
    await esperar();
    const borrado = envios().find((r) => r.request.method === 'DELETE')!;
    expect(borrado.request.params.get('partidoId')).toBe('50');
    borrado.flush(ok());
    await esperar();
    expect(vivo.estado()!.jugadas).toHaveLength(0);
    expect(vivo.pendientes()).toBe(0);
  });

  it('un cambio de varios jugadores se deshace entero', async () => {
    vivo.cambiar(1, [11, 12], 0);
    vivo.cambiar(2, [21], 0);
    expect(vivo.enCancha()).toEqual({ 1: [11, 12], 2: [21] });
    vivo.deshacer();
    expect(vivo.enCancha()).toEqual({ 1: [11, 12], 2: [] });
    vivo.deshacer();
    expect(vivo.enCancha()).toEqual({ 1: [], 2: [] });
    await responderEnvios();
  });

  it('una jugada que la API rechaza sale de la cola y se avisa', async () => {
    vivo.registrar(11, 'rob');
    await esperar();
    envios()[0].flush({ exito: 0, mensaje: 'Faltan datos' }, { status: 400, statusText: 'Bad Request' });
    await esperar();
    expect(vivo.pendientes()).toBe(0);
    expect(vivo.rechazo()).toBe('Faltan datos');
  });

  it('el reloj usa la hora real, se detiene en cero y marca las jugadas', async () => {
    vivo.arrancar(1_000);
    expect(vivo.restante(61_000)).toBe(540_000);
    vivo.registrar(11, 'asi', undefined, 61_000);
    expect(vivo.estado()!.jugadas[0].relojMs).toBe(540_000);
    vivo.parar(61_000);
    expect(vivo.restante(999_999)).toBe(540_000);
    vivo.arrancar(100_000);
    vivo.revisar(100_000 + 600_000);
    expect(vivo.corriendo()).toBe(false);
    expect(vivo.restante()).toBe(0);
    await responderEnvios();
  });

  it('una hora anterior al arranque no suma tiempo al reloj', () => {
    vivo.arrancar(5_000);
    expect(vivo.restante(4_000)).toBe(600_000);
  });

  it('cuenta los minutos en cancha y pasa de cuarto', async () => {
    vivo.cambiar(1, [11], 0);
    vivo.arrancar(0);
    vivo.cambiar(1, [12], 60_000);
    vivo.parar(90_000);
    expect(vivo.planilla(90_000)!.jugadores[11].msJugados).toBe(60_000);
    expect(vivo.planilla(90_000)!.jugadores[12].msJugados).toBe(30_000);
    vivo.siguienteCuarto();
    expect(vivo.estado()!.cuarto).toBe(2);
    expect(vivo.restante()).toBe(600_000);
    // Al pasar de cuarto se cuenta el resto del primero: entró al minuto 1, así que lleva 9.
    expect(vivo.planilla()!.jugadores[12].msJugados).toBe(9 * 60_000);
    await responderEnvios();
  });

  it('sobrevive a una recarga y manda lo que quedó pendiente', async () => {
    vivo.registrar(11, '3');
    TestBed.tick();
    await esperar();
    TestBed.resetTestingModule();
    configurar();
    expect(vivo.puntosLocal()).toBe(3);
    await esperar();
    expect(envios()).toHaveLength(1);
    await responderEnvios();
  });

  it('retoma un partido con sus jugadas y el reloj de la última', () => {
    vivo.retomar({
      partidoId: 7,
      fecha: null,
      lugar: null,
      duracionCuartoMin: 10,
      local: equipo(1, [11]),
      visitante: equipo(2, [21]),
      jugadas: [
        { id: 'a', numero: 1, cuarto: 3, relojMs: 200_000, tipo: 'Cambio', equipoId: 1, jugadorId: 11 },
        { id: 'b', numero: 2, cuarto: 3, relojMs: 150_000, tipo: 'Tiro', equipoId: 1, jugadorId: 11, valor: 2, acierto: true },
      ],
    });
    expect(vivo.estado()!.cuarto).toBe(3);
    expect(vivo.restante()).toBe(150_000);
    expect(vivo.puntosLocal()).toBe(2);
    expect(vivo.enCancha()[1]).toEqual([11]);
  });

  it('al finalizar manda lo pendiente, termina el partido y lo borra del dispositivo', async () => {
    vivo.registrar(21, '2');
    const resultado = vivo.finalizar(0);
    await responderEnvios();
    const fin = http.expectOne((r) => r.url.includes('/Partido/Finalizar?id=50'));
    expect(fin.request.body).toEqual({ cuarto: 1, relojMs: 600_000 });
    fin.flush(ok(50));
    expect(await resultado).toBe(50);
    expect(vivo.estado()).toBeNull();
  });
});
