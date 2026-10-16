import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BotonEliminar } from '../../compartido/boton-eliminar';
import { mensajeDeError } from '../../core/api';
import { Ligas, PartidoDeLiga, porJornada } from '../../core/ligas';
import { Equipos, Partidos } from '../../core/servicios';

type Borrador = Record<number, { juega: boolean; divisionId: number | null }>;

@Component({
  imports: [FormsModule, RouterLink, DatePipe, BotonEliminar],
  templateUrl: './liga.html',
  styleUrl: './liga.css',
})
export default class Liga {
  private readonly ligas = inject(Ligas);
  private readonly equiposServicio = inject(Equipos);
  private readonly partidosServicio = inject(Partidos);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly temporadaId = signal<number | undefined>(undefined);
  protected readonly liga = resource({
    params: () => ({ id: +this.id(), temporada: this.temporadaId() }),
    loader: ({ params }) => this.ligas.obtener(params.id, params.temporada),
  });
  protected readonly misEquipos = resource({ loader: () => this.equiposServicio.listar() });

  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly ocupado = signal(false);

  protected readonly temporada = computed(() => this.liga.value()?.temporada);
  protected readonly jornadas = computed(() => porJornada(this.temporada()?.partidos ?? []));
  protected readonly inscriptos = computed(() => this.temporada()?.equipos ?? []);
  protected readonly nombreDivision = computed(() => {
    const nombres = new Map((this.temporada()?.divisiones ?? []).map((d) => [d.id, d.nombre]));
    return (id: number | null) => (id === null ? '' : (nombres.get(id) ?? ''));
  });

  // Formularios
  protected readonly borrador = signal<Borrador>({});
  protected edicion = { nombre: '', slug: '', descripcion: '' };
  protected division = '';
  protected fixture = { desde: new Date().toISOString().slice(0, 10), dias: 7, idaYVuelta: false };
  protected readonly editando = signal<number | null>(null);
  protected cambios = { localId: 0, visitanteId: 0, fecha: '', lugar: '', jornada: null as number | null };
  protected segundosSimulacion = 3;
  protected nuevo = { localId: null as number | null, visitanteId: null as number | null, fecha: '', jornada: null as number | null };

  constructor() {
    // Cada vez que llega la liga se reinician los formularios con lo guardado.
    effect(() => {
      const liga = this.liga.value();
      if (!liga) return;
      this.edicion = { nombre: liga.nombre, slug: liga.slug, descripcion: liga.descripcion ?? '' };
      const borrador: Borrador = {};
      for (const e of liga.temporada.equipos) borrador[e.id] = { juega: true, divisionId: e.divisionId };
      this.borrador.set(borrador);
    });
  }

  protected paginaPublica() {
    return `/liga/${this.liga.value()?.slug}`;
  }

  /** Código para pegar en otro sitio y mostrar los resultados en vivo. */
  protected codigoWidget() {
    const direccion = `${location.origin}/widget/${this.liga.value()?.slug}`;
    return `<iframe src="${direccion}" title="Resultados en vivo" style="width:100%;max-width:420px;height:320px;border:0"></iframe>`;
  }

  protected inscripcion(equipoId: number) {
    return this.borrador()[equipoId] ?? { juega: false, divisionId: null };
  }

  protected cambiarInscripcion(equipoId: number, cambios: Partial<{ juega: boolean; divisionId: number | null }>) {
    this.borrador.update((b) => ({ ...b, [equipoId]: { ...this.inscripcion(equipoId), ...cambios } }));
  }

  protected cantidadInscriptos() {
    return Object.values(this.borrador()).filter((i) => i.juega).length;
  }

  protected cambiarTemporada(id: number) {
    this.temporadaId.set(id);
  }

  protected guardarLiga() {
    return this.ejecutar(async () => {
      await this.ligas.modificar({
        id: +this.id(),
        nombre: this.edicion.nombre,
        slug: this.edicion.slug || null,
        descripcion: this.edicion.descripcion || null,
      });
      return 'Se guardaron los datos de la liga.';
    });
  }

  protected nuevaTemporada() {
    const nombre = prompt('Nombre de la nueva temporada (por ejemplo, "Clausura 2026")');
    if (!nombre?.trim()) return;
    return this.ejecutar(async () => {
      const id = await this.ligas.crearTemporada(+this.id(), nombre.trim());
      this.temporadaId.set(id);
      return 'Se creó la temporada. Inscribí los equipos y armá el fixture.';
    }, false);
  }

  protected agregarDivision() {
    const temporada = this.temporada();
    if (!temporada || !this.division.trim()) return;
    return this.ejecutar(async () => {
      await this.ligas.crearDivision(temporada.id, this.division.trim());
      this.division = '';
      return null;
    });
  }

  protected quitarDivision(id: number) {
    return this.ejecutar(async () => {
      await this.ligas.eliminarDivision(id);
      return 'Se borró la división; sus equipos quedaron sin división.';
    });
  }

  protected guardarEquipos() {
    const temporada = this.temporada();
    if (!temporada) return;
    const equipos = Object.entries(this.borrador())
      .filter(([, i]) => i.juega)
      .map(([equipoId, i]) => ({ equipoId: +equipoId, divisionId: i.divisionId }));
    return this.ejecutar(async () => {
      await this.ligas.inscribir(temporada.id, equipos);
      return 'Se guardaron los equipos de la temporada.';
    });
  }

  protected generarFixture() {
    const temporada = this.temporada();
    if (!temporada) return;
    const { desde, dias, idaYVuelta } = this.fixture;
    return this.ejecutar(async () => {
      const cantidad = await this.ligas.generarFixture(temporada.id, desde || null, dias, idaYVuelta);
      return `Se generaron ${cantidad} partidos.`;
    });
  }

  protected agregarPartido() {
    const temporada = this.temporada();
    const { localId, visitanteId, fecha, jornada } = this.nuevo;
    if (!temporada || localId === null || visitanteId === null) return;
    return this.ejecutar(async () => {
      await this.ligas.agregarPartidos(temporada.id, [{ localId, visitanteId, fecha: fecha || null, lugar: null, jornada }]);
      this.nuevo = { localId: null, visitanteId: null, fecha: '', jornada: null };
      return 'Se agregó el partido.';
    });
  }

  protected borrarPartido(p: PartidoDeLiga) {
    if (!confirm(`¿Borrar ${p.local.nombre} vs ${p.visitante.nombre} del fixture?`)) return;
    return this.ejecutar(async () => {
      await this.partidosServicio.eliminar(p.id);
      return null;
    });
  }

  protected editarPartido(p: PartidoDeLiga) {
    this.cambios = {
      localId: p.local.id,
      visitanteId: p.visitante.id,
      fecha: p.fecha?.slice(0, 10) ?? '',
      lugar: p.lugar ?? '',
      jornada: p.jornada,
    };
    this.editando.set(p.id);
  }

  protected guardarPartido() {
    const id = this.editando();
    if (id === null) return;
    const { localId, visitanteId, fecha, lugar, jornada } = this.cambios;
    return this.ejecutar(async () => {
      await this.ligas.modificarPartido({ id, localId, visitanteId, fecha: fecha || null, lugar: lugar.trim() || null, jornada });
      this.editando.set(null);
      return 'Se guardó el partido.';
    });
  }

  /** Juega el partido con datos inventados, para ver la página pública en vivo sin anotar. */
  protected simular(p: PartidoDeLiga) {
    return this.ejecutar(async () => {
      const jugadas = await this.ligas.simular(p.id, this.segundosSimulacion);
      const minutos = Math.round((jugadas * this.segundosSimulacion) / 60);
      const duracion = minutos < 1 ? 'en menos de un minuto' : `en unos ${minutos} minutos`;
      return `Empezó la simulación de ${p.local.nombre} vs ${p.visitante.nombre}: ${jugadas} jugadas, termina ${duracion}.`;
    });
  }

  /** Lleva a la pantalla de nuevo partido con los equipos del fixture ya elegidos. */
  protected anotar(p: PartidoDeLiga) {
    this.router.navigate(['/partidos/nuevo'], {
      queryParams: { programado: p.id, local: p.local.id, visitante: p.visitante.id, fecha: p.fecha?.slice(0, 10) },
    });
  }

  protected async eliminarLiga() {
    await this.ejecutar(async () => {
      await this.ligas.eliminar(+this.id());
      this.router.navigate(['/ligas']);
      return null;
    }, false);
  }

  private async ejecutar(accion: () => Promise<string | null>, recargar = true) {
    this.ocupado.set(true);
    this.error.set(null);
    this.aviso.set(null);
    try {
      this.aviso.set(await accion());
      if (recargar) this.liga.reload();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(false);
    }
  }
}
