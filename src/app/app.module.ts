import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {ChannelModule} from "./channel/channel.module";
import {SharedModule} from "./shared/shared.module";
import { LeftNavBarModule } from "./left-nav-bar/left-nav-bar.module";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ChannelModule,
    SharedModule,
    LeftNavBarModule,
    BrowserAnimationsModule
  ],
  exports: [SharedModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
