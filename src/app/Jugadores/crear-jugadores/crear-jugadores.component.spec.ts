import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearJugadoresComponent } from './crear-jugadores.component';

describe('CrearJugadoresComponent', () => {
  let component: CrearJugadoresComponent;
  let fixture: ComponentFixture<CrearJugadoresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrearJugadoresComponent]
    });
    fixture = TestBed.createComponent(CrearJugadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
