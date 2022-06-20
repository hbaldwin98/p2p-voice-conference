import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelControlsComponent } from './channel-controls.component';

describe('ChannelControlsComponent', () => {
  let component: ChannelControlsComponent;
  let fixture: ComponentFixture<ChannelControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChannelControlsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
