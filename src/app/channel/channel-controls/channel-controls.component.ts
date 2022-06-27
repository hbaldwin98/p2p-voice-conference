import { Component, OnInit } from '@angular/core';
import { ChannelService } from "../channel.service";
import { Socket } from "ngx-socket-io";
import { WebRTCService } from "../../shared/services/webrtc.service";

@Component({
  selector: 'app-channel-controls',
  templateUrl: './channel-controls.component.html',
  styleUrls: ['./channel-controls.component.sass']
})
export class ChannelControlsComponent implements OnInit {

  get selfGlobalMute() { return this.channel.userStore.globalMute; }
  get selfScreenSharing() { return this.channel.userStore.isSharingScreen; }
  get selfIsTalking() { return this.channel.userStore.localStream.getAudioTracks()[0]?.enabled }
  get selfMicActive() { return this.channel.userStore.micActive; }


  constructor(public channel: ChannelService, private socket: Socket, private webRTC: WebRTCService) { }

  ngOnInit(): void {
  }

  toggleMicActive() {
    this.channel.userStore.micActive = !this.channel.userStore.micActive;
    this.socket.emit('user-toggled-mic', !this.channel.userStore.micActive);
  }

  toggleGlobalMute() {
    this.channel.userStore.globalMute = !this.channel.userStore.globalMute;
    this.socket.emit('user-toggled-mic', this.selfMicActive ? this.selfGlobalMute : !this.selfMicActive);

    //for each peer, disable their audio track
    for (const peer in this.channel.peers) {
      const p = this.channel.peers[peer];
      p.remoteStream.getAudioTracks()[0].enabled = !this.channel.userStore.globalMute;
    }
  }

  toggleScreenSharing() {
    this.webRTC.initializeScreenShare();
  }


}
