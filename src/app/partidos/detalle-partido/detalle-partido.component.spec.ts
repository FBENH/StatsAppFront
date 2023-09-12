import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallePartidoComponent } from './detalle-partido.component';

describe('DetallePartidoComponent', () => {
  let component: DetallePartidoComponent;
  let fixture: ComponentFixture<DetallePartidoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetallePartidoComponent]
    });
    fixture = TestBed.createComponent(DetallePartidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
