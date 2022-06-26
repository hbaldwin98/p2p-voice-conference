import { Component, OnInit } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";
import { Peer } from "../../shared/models/peer";

@Component({
  selector: 'app-channel-screen-share',
  templateUrl: './channel-screen-share.component.html',
  styleUrls: ['./channel-screen-share.component.sass']
})
export class ChannelScreenShareComponent implements OnInit {
  peer!: Peer
  remoteStream!: MediaStream;
  constructor(public modalRef: BsModalRef) { }

  ngOnInit(): void {
    this.remoteStream = this.peer.remoteStream;
  }

}
