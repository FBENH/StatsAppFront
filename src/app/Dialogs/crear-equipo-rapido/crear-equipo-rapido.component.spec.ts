import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEquipoRapidoComponent } from './crear-equipo-rapido.component';

describe('CrearEquipoRapidoComponent', () => {
  let component: CrearEquipoRapidoComponent;
  let fixture: ComponentFixture<CrearEquipoRapidoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrearEquipoRapidoComponent]
    });
    fixture = TestBed.createComponent(CrearEquipoRapidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
