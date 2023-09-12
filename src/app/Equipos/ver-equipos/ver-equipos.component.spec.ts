import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerEquiposComponent } from './ver-equipos.component';

describe('VerEquiposComponent', () => {
  let component: VerEquiposComponent;
  let fixture: ComponentFixture<VerEquiposComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VerEquiposComponent]
    });
    fixture = TestBed.createComponent(VerEquiposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
