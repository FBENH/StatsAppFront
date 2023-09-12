import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPuntajeComponent } from './editar-puntaje.component';

describe('EditarPuntajeComponent', () => {
  let component: EditarPuntajeComponent;
  let fixture: ComponentFixture<EditarPuntajeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarPuntajeComponent]
    });
    fixture = TestBed.createComponent(EditarPuntajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
