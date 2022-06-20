import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelComponent } from './channel.component';
import { ChannelControlsComponent } from './channel-controls/channel-controls.component';



@NgModule({
    declarations: [
        ChannelComponent,
        ChannelControlsComponent
    ],
    exports: [
        ChannelComponent
    ],
    imports: [
        CommonModule
    ]
})
export class ChannelModule { }
