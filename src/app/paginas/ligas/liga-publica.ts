import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnVivo } from '../../core/en-vivo';
import { LigasPublicas, PartidoDeLiga, porJornada } from '../../core/ligas';
import { nombreCorto } from '../../core/relato';

type Pestania = 'posiciones' | 'partidos' | 'lideres';

/** Página pública de una liga. Es lo mismo que puede mostrar un sitio externo con la API de /publico. */
@Component({
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './liga-publica.html',
  styleUrl: './liga-publica.css',
})
export default class LigaPublica {
  private readonly api = inject(LigasPublicas);

  readonly slug = input.required<string>();
  protected readonly temporadaId = signal<number | undefined>(undefined);
  protected readonly pestania = signal<Pestania>('posiciones');

  private readonly params = computed(() => ({ slug: this.slug(), temporada: this.temporadaId() }));
  protected readonly liga = resource({
    params: this.params,
    loader: ({ params }) => this.api.liga(params.slug, params.temporada),
  });
  protected readonly partidos = resource({
    params: this.params,
    loader: ({ params }) => this.api.partidos(params.slug, params.temporada),
  });
  protected readonly posiciones = resource({
    params: this.params,
    loader: ({ params }) => this.api.posiciones(params.slug, params.temporada),
  });
  protected readonly lideres = resource({
    params: this.params,
    loader: ({ params }) => this.api.lideres(params.slug, params.temporada),
  });
  protected readonly mvp = resource({
    params: this.params,
    loader: ({ params }) => this.api.mvp(params.slug, params.temporada),
  });

  protected readonly enVivo = computed(() => (this.partidos.value() ?? []).filter((p) => p.estado === 'EnCurso'));
  protected readonly jornadas = computed(() => porJornada(this.partidos.value() ?? []));
  protected readonly nombre = nombreCorto;

  constructor() {
    const vivo = inject(EnVivo);
    // SignalR avisa cada cambio de un partido de la liga (tanteador o estado).
    effect((alLimpiar) => {
      vivo.seguirLiga(
        this.slug(),
        { partido: (p) => this.actualizar(p), reconectado: () => this.recargar() },
        alLimpiar,
      );
    });
  }

  private actualizar(p: PartidoDeLiga) {
    const anterior = this.partidos.value()?.find((x) => x.id === p.id);
    if (!anterior) {
      this.partidos.reload();
      return;
    }
    this.partidos.update((lista) => lista?.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
    // Cuando un partido termina o vuelve a empezar cambian la tabla, los líderes y los MVP.
    if (anterior.estado !== p.estado) this.recargar();
  }

  private recargar() {
    this.partidos.reload();
    this.posiciones.reload();
    this.lideres.reload();
    this.mvp.reload();
  }
}
