import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";
import { ChannelScreenShareComponent } from "../channel-screen-share/channel-screen-share.component";
import { Peer } from "../../shared/models/peer";
import { ChannelService } from "../channel.service";
import { IUserStore } from "../../shared/models/userStore";
import { Socket } from "ngx-socket-io";
import { WebRTCService } from "../../shared/services/webrtc.service";

@Component({
  selector: 'app-channel-context-menu',
  templateUrl: './channel-context-menu.component.html',
  styleUrls: ['./channel-context-menu.component.sass']
})
export class ChannelContextMenuComponent implements OnInit {
  modalRef?: BsModalRef;
  @Input() peer?: Peer;
  @Input() user?: boolean;
  userStore!: IUserStore;

  get selfGlobalMute() { return this.channel.userStore.globalMute; }
  get selfScreenSharing() { return this.channel.userStore.isSharingScreen; }
  get selfIsTalking() { return this.channel.userStore.localStream.getAudioTracks()[0]?.enabled }
  get selfMicActive() { return this.channel.userStore.micActive; }

  constructor(private modal: BsModalService, private channel: ChannelService, private socket: Socket, private webRTC: WebRTCService) { }

  ngOnInit(): void {
    if (this.user)
      this.userStore = this.channel.userStore
  }

  openScreenShare(id: string, stream: MediaStream) {
    const initialState: ModalOptions = {
      initialState: {
        id,
        stream
      }
    }
    this.modalRef = this.modal.show(ChannelScreenShareComponent, initialState);
  }

  toggleLocalMuteStatus(peer: Peer) {
    peer.localMuted = !peer.localMuted;
    peer.remoteStream.getAudioTracks()[0].enabled = !peer.localMuted;
  };

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
