import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelComponent } from './channel.component';
import { ChannelControlsComponent } from './channel-controls/channel-controls.component';
import { SharedModule } from "../shared/shared.module";


@NgModule({
  declarations: [ ChannelComponent, ChannelControlsComponent ],
  exports: [ ChannelComponent ],
  imports: [ CommonModule, SharedModule ]
})
export class ChannelModule {
}
