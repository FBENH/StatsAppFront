import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleJugadorComponent } from './detalle-jugador.component';

describe('DetalleJugadorComponent', () => {
  let component: DetalleJugadorComponent;
  let fixture: ComponentFixture<DetalleJugadorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetalleJugadorComponent]
    });
    fixture = TestBed.createComponent(DetalleJugadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
