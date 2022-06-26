import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelComponent } from './channel.component';
import { ChannelControlsComponent } from './channel-controls/channel-controls.component';
import { SharedModule } from "../shared/shared.module";
import { ChannelScreenShareComponent } from './channel-screen-share/channel-screen-share.component';


@NgModule({
  declarations: [ ChannelComponent, ChannelControlsComponent, ChannelScreenShareComponent ],
  exports: [ ChannelComponent ],
  imports: [ CommonModule, SharedModule ]
})
export class ChannelModule {
}
