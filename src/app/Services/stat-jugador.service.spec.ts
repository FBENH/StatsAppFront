import { TestBed } from '@angular/core/testing';

import { StatJugadorService } from './stat-jugador.service';

describe('StatJugadorService', () => {
  let service: StatJugadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatJugadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
