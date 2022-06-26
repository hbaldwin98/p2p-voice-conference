import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelScreenShareComponent } from './channel-screen-share.component';

describe('ChannelScreenShareComponent', () => {
  let component: ChannelScreenShareComponent;
  let fixture: ComponentFixture<ChannelScreenShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChannelScreenShareComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelScreenShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
