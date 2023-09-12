import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CambiosComponent } from './cambios.component';

describe('CambiosComponent', () => {
  let component: CambiosComponent;
  let fixture: ComponentFixture<CambiosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CambiosComponent]
    });
    fixture = TestBed.createComponent(CambiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
