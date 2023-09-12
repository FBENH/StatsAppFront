import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VivoComponent } from './vivo.component';

describe('VivoComponent', () => {
  let component: VivoComponent;
  let fixture: ComponentFixture<VivoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VivoComponent]
    });
    fixture = TestBed.createComponent(VivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
