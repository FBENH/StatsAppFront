import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnotarComponent } from './anotar.component';

describe('AnotarComponent', () => {
  let component: AnotarComponent;
  let fixture: ComponentFixture<AnotarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AnotarComponent]
    });
    fixture = TestBed.createComponent(AnotarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
