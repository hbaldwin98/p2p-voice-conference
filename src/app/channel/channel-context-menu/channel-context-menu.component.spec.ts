import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelContextMenuComponent } from './channel-context-menu.component';

describe('ChannelContextMenuComponent', () => {
  let component: ChannelContextMenuComponent;
  let fixture: ComponentFixture<ChannelContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChannelContextMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
