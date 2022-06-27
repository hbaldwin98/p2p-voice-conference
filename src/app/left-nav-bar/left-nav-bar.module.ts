import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeftNavBarComponent } from './left-nav-bar.component';
import { SharedModule } from "../shared/shared.module";
import { ChannelModule } from "../channel/channel.module";


@NgModule({
  declarations: [ LeftNavBarComponent ], exports: [ LeftNavBarComponent ], imports: [ CommonModule, SharedModule, ChannelModule ]
})
export class LeftNavBarModule {
}
