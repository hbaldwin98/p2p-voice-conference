import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketIoConfig, SocketIoModule } from "ngx-socket-io";
import { environment } from "../../environments/environment";
import { FormsModule } from "@angular/forms";

const config: SocketIoConfig = { url: environment.socketServer, options: {} };

@NgModule({
  declarations: [],
  imports: [ CommonModule, SocketIoModule.forRoot(config), FormsModule ],
  exports: [ SocketIoModule, FormsModule ]
})
export class SharedModule {
}
