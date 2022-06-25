import { Component, OnInit } from '@angular/core';
import {Socket} from "ngx-socket-io";
import {WebRTCService} from "../shared/services/webrtc.service";
import {ChannelService} from "./channel.service";

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.sass']
})
export class ChannelComponent implements OnInit {
  constructor(private webRTC: WebRTCService, public channel: ChannelService, private socket: Socket) { }

  ngOnInit(): void {
    if (this.channel.userStore.socketId === '') {
      this.startConnection();
    }
  }

  getMicStatus(): boolean {
    return this.channel.userStore.micMuted;
  }

  micStatus() {
    this.channel.userStore.micMuted = !this.channel.userStore.micMuted;
    this.channel.userStore.localStream.getAudioTracks()[0].enabled = this.channel.userStore.micMuted;
  }

  async startConnection() {
    this.webRTC.initializeSocketEvents().then(() => {
      this.webRTC.initializeLocalStream();
    });

  }
}
