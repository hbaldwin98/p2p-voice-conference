// ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { environment } from "../../environments/environment";

// SOCKETIO
import { SocketIoConfig, SocketIoModule } from "ngx-socket-io";

//BOOTSTRAP
import { ModalModule } from "ngx-bootstrap/modal";


const config: SocketIoConfig = { url: environment.socketServer, options: {} };

@NgModule({
  declarations: [],
  imports: [ CommonModule, FormsModule, SocketIoModule.forRoot(config), ModalModule.forRoot() ],
  exports: [ SocketIoModule, FormsModule, ModalModule ]
})
export class SharedModule {
}
