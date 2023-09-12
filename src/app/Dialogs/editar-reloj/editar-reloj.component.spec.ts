import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarRelojComponent } from './editar-reloj.component';

describe('EditarRelojComponent', () => {
  let component: EditarRelojComponent;
  let fixture: ComponentFixture<EditarRelojComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarRelojComponent]
    });
    fixture = TestBed.createComponent(EditarRelojComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
