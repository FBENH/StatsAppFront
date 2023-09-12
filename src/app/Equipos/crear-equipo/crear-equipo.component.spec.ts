import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEquipoComponent } from './crear-equipo.component';

describe('CrearEquipoComponent', () => {
  let component: CrearEquipoComponent;
  let fixture: ComponentFixture<CrearEquipoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrearEquipoComponent]
    });
    fixture = TestBed.createComponent(CrearEquipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
