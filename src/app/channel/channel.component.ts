import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {Socket} from "ngx-socket-io";
import {WebRTCService} from "../shared/services/webrtc.service";
import {ChannelService} from "./channel.service";

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.sass']
})
export class ChannelComponent implements OnInit {
  @ViewChild('audioMeter', {static: false}) audioMeter!: ElementRef;
  constructor(private webRTC: WebRTCService, public channel: ChannelService, private socket: Socket) { }

  ngOnInit(): void {
    if (this.channel.userStore.socketId === '') {
      this.startConnection();
    }
    this.updateVolume();
  }

  getMicStatus(): boolean {
    return this.channel.userStore.micMuted;
  }

  toggleMicStatus() {
    this.channel.userStore.micMuted = !this.channel.userStore.micMuted;
    this.channel.userStore.localStream.getAudioTracks()[0].enabled = this.channel.userStore.micMuted;
    this.socket.emit('user-toggled-mic', !this.channel.userStore.micMuted);
    console.log(this.channel.userStore.localStream.getAudioTracks());
  }

  toggleLocalMuteStatus(userId: string) {
    this.channel.peers[userId].localMuted = !this.channel.peers[userId].localMuted;
    this.channel.peers[userId].remoteStream.getAudioTracks()[0].enabled = !this.channel.peers[userId].localMuted;
  };

  getLocalMuteStatus(userId: string): boolean {
    return this.channel.peers[userId].localMuted;
  }

  adjustVolume(e: any, userId: string) {
    this.channel.peers[userId].volume = e.target.value / 100;
  }

  startConnection() {
    this.webRTC.initializeSocketEvents().then(() => {
      this.webRTC.initializeLocalStream().then(() => {
        this.channel.userStore.localStream.getAudioTracks()[0].enabled = false;
      });
    });
  }

  updateVolume() {
    setInterval(() => {
      this.audioMeter.nativeElement.innerHTML = this.channel.userStore.volume;
    }, 200);
  }
}
