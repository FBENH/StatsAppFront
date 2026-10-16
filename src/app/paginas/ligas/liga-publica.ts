import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, resource, signal } from '@angular/core';
import { LigasPublicas, porJornada } from '../../core/ligas';
import { nombreCorto } from '../../core/relato';

type Pestania = 'posiciones' | 'partidos' | 'lideres';

/** Página pública de una liga. Es lo mismo que puede mostrar un sitio externo con la API de /publico. */
@Component({
  imports: [DatePipe, DecimalPipe],
  templateUrl: './liga-publica.html',
  styleUrl: './liga-publica.css',
})
export default class LigaPublica {
  private readonly api = inject(LigasPublicas);

  readonly slug = input.required<string>();
  protected readonly temporadaId = signal<number | undefined>(undefined);
  protected readonly pestania = signal<Pestania>('posiciones');
  /** Cambia cada tanto para volver a pedir los datos mientras hay partidos en vivo. */
  private readonly vuelta = signal(0);

  private readonly params = computed(() => ({ slug: this.slug(), temporada: this.temporadaId(), vuelta: this.vuelta() }));
  protected readonly liga = resource({
    params: () => ({ slug: this.slug(), temporada: this.temporadaId() }),
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
    params: () => ({ slug: this.slug(), temporada: this.temporadaId() }),
    loader: ({ params }) => this.api.lideres(params.slug, params.temporada),
  });
  protected readonly mvp = resource({
    params: () => ({ slug: this.slug(), temporada: this.temporadaId() }),
    loader: ({ params }) => this.api.mvp(params.slug, params.temporada),
  });

  protected readonly enVivo = computed(() => (this.partidos.value() ?? []).filter((p) => p.estado === 'EnCurso'));
  protected readonly jornadas = computed(() => porJornada(this.partidos.value() ?? []));
  protected readonly nombre = nombreCorto;

  constructor() {
    // Hasta que llegue la etapa con SignalR, los partidos en vivo se actualizan cada 15 segundos.
    const intervalo = setInterval(() => {
      if (this.enVivo().length > 0) this.vuelta.update((v) => v + 1);
    }, 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }
}
