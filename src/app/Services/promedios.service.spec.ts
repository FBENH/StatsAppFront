import { TestBed } from '@angular/core/testing';

import { PromediosService } from './promedios.service';

describe('PromediosService', () => {
  let service: PromediosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PromediosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
