import { Component, OnInit } from '@angular/core';
import {Socket} from "ngx-socket-io";

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.sass']
})
export class ChannelComponent implements OnInit {
  socketId: string = "";
  peers: string[] = [];

  constructor(public socket: Socket) { }

  ngOnInit(): void {
    this.initializeSocketEvents();
  }

  initializeSocketEvents() {
    this.socket.on('connected', (socket: any) => {
      console.log('your socket id is', socket);
      this.socketId = socket;
    });
  }
}
