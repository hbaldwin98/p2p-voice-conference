import { Component, OnInit } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";
import { Socket } from "ngx-socket-io";

@Component({
  selector: 'app-channel-screen-share',
  templateUrl: './channel-screen-share.component.html',
  styleUrls: ['./channel-screen-share.component.sass']
})
export class ChannelScreenShareComponent implements OnInit {
  stream?: MediaStream;
  id?: string;
  constructor(public modalRef: BsModalRef, private socket: Socket) { }

  ngOnInit(): void {
    console.log('viewing screen for ', this.id);
    this.socket.on('user-screen-sharing', (data: any) => {
      if (!data.screenSharing) {
        if (data.userId === this.id) {
          this.modalRef.hide();
        }
      }
    });
  }

}
