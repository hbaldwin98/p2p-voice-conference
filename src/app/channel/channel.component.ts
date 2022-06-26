import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Socket } from "ngx-socket-io";
import { WebRTCService } from "../shared/services/webrtc.service";
import { ChannelService } from "./channel.service";
import { Peer } from "../shared/models/peer";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";
import { ChannelScreenShareComponent } from "./channel-screen-share/channel-screen-share.component";

@Component({
  selector: 'app-channel', templateUrl: './channel.component.html', styleUrls: [ './channel.component.sass' ]
})
export class ChannelComponent implements OnInit {
  @ViewChild('audioMeter', { static: false }) audioMeter!: ElementRef;
  modalRef?: BsModalRef;

  get selfIsTalking() { return this.channel.userStore.localStream.getAudioTracks()[0]?.enabled }
  get selfMicActive() { return this.channel.userStore.micActive; }

  constructor(private webRTC: WebRTCService, public channel: ChannelService, private socket: Socket, private modal: BsModalService) { }

  ngOnInit(): void {
    if (this.channel.userStore.socketId === '') {
      this.startConnection();
    }
    this.updateVolume();
  }

  startConnection() {
    this.webRTC.initializeSocketEvents().then(() => {
      this.webRTC.initializeLocalStream().then(() => {
        this.channel.userStore.localStream.getAudioTracks()[0].enabled = false;
      });
    });
  }

  getPeerTalking(peer: Peer) {
    return peer.isTalking;
  }

  getLocalMuteStatus(peer: Peer): boolean {
    return peer.localMuted;
  }

  toggleMicActive() {
    this.channel.userStore.micActive = !this.channel.userStore.micActive;
    this.socket.emit('user-toggled-mic', !this.channel.userStore.micActive);
  }

  toggleLocalMuteStatus(peer: Peer) {
    peer.localMuted = !peer.localMuted;
    peer.remoteStream.getAudioTracks()[0].enabled = !peer.localMuted;
  };

  adjustVolume(e: any, peer: Peer) {
    peer.volume = e.target.value;
  }

  adjustNoiseGate(e: any) {
    this.channel.userStore.noiseGateValue = e.target.value;
  }

  changeName(e: any) {
    this.socket.emit('user-change-name', e.target.value);
  }

  updateVolume() {
    setInterval(() => {
      this.audioMeter.nativeElement.innerHTML = this.channel.userStore.volume;
    }, 200);
  }

  toggleScreenSharing() {
    this.webRTC.initializeScreenShare();
  }

  openScreenShare(peer: Peer) {
    const initialState: ModalOptions = {
      initialState: {
        peer: peer
      }
    }
    this.modalRef = this.modal.show(ChannelScreenShareComponent, initialState);
  }
}
