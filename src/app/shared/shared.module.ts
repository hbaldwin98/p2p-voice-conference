// ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { environment } from "../../environments/environment";

// SOCKETIO
import { SocketIoConfig, SocketIoModule } from "ngx-socket-io";

//BOOTSTRAP
import { ModalModule } from "ngx-bootstrap/modal";
import { TooltipModule } from "ngx-bootstrap/tooltip";

//MATERIAL
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatBadgeModule } from "@angular/material/badge";
import { MatDividerModule } from "@angular/material/divider";

const config: SocketIoConfig = { url: environment.socketServer, options: {} };

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    SocketIoModule.forRoot(config),
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    MatMenuModule,
    MatIconModule,
    MatBadgeModule,
    MatDividerModule ],
  exports: [
    SocketIoModule,
    FormsModule,
    ModalModule,
    MatMenuModule,
    MatIconModule,
    MatBadgeModule,
    TooltipModule,
    MatDividerModule ]
})
export class SharedModule {
}
