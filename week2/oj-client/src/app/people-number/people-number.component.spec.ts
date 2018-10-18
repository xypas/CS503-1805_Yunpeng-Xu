import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleNumberComponent } from './people-number.component';

describe('PeopleNumberComponent', () => {
  let component: PeopleNumberComponent;
  let fixture: ComponentFixture<PeopleNumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeopleNumberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeopleNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
