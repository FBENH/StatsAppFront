import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoPartidoComponent } from './nuevo-partido.component';

describe('NuevoPartidoComponent', () => {
  let component: NuevoPartidoComponent;
  let fixture: ComponentFixture<NuevoPartidoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NuevoPartidoComponent]
    });
    fixture = TestBed.createComponent(NuevoPartidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
