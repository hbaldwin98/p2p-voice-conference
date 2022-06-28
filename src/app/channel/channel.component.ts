import { Component, OnInit, ViewChild } from '@angular/core';
import { Socket } from "ngx-socket-io";
import { WebRTCService } from "../shared/services/webrtc.service";
import { ChannelService } from "./channel.service";
import { Peer } from "../shared/models/peer";
import { MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: 'app-channel', templateUrl: './channel.component.html', styleUrls: [ './channel.component.sass' ]
})
export class ChannelComponent implements OnInit {
  // @ViewChild('audioMeter', { static: false }) audioMeter!: ElementRef;
  @ViewChild(MatMenuTrigger, {static: true}) matMenuTrigger?: MatMenuTrigger;
  // we create an object that contains coordinates
  menuTopLeftPosition =  {x: '0', y: '0'}

  get selfDeafened() { return this.channel.userStore.deafened; }
  get selfScreenSharing() { return this.channel.userStore.isSharingScreen; }
  get selfIsTalking() { return this.channel.userStore.localStream.getAudioTracks()[0]?.enabled }
  get selfMicActive() { return this.channel.userStore.micActive; }

  constructor(private webRTC: WebRTCService, public channel: ChannelService, private socket: Socket) { }

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

  getLocalMuteStatus(peer: Peer): boolean {
    return peer.localMuted;
  }

  toggleLocalMuteStatus(peer: Peer) {
    peer.localMuted = !peer.localMuted;
    peer.remoteStream.getAudioTracks()[0].enabled = !peer.localMuted;
  };

  adjustVolume(e: any, peer: Peer) {
    peer.volume = e.target.value;
  }

  changeName(e: any) {
    this.socket.emit('user-change-name', e.target.value);
  }

  updateVolume() {
    setInterval(() => {
      // this.audioMeter.nativeElement.innerHTML = this.channel.userStore.volume;
    }, 200);
  }

  onPeerRightClick(event: MouseEvent, peer: Peer,) {
    // we record the mouse position in our object
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';
    // we open the menu
    // we pass to the menu the information about our object
    if (this.matMenuTrigger) {
      this.matMenuTrigger.menuData = {peer}
      // we open the menu
      this.matMenuTrigger.openMenu();
    }
  }

  onUserRightClick(event: MouseEvent) {
    // we record the mouse position in our object
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';
    // we open the menu
    // we pass to the menu the information about our object
    if (this.matMenuTrigger) {
      this.matMenuTrigger.menuData = {user: true}
      // we open the menu
      this.matMenuTrigger.openMenu();
    }
  }
}
