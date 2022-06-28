import { Injectable } from '@angular/core';
import { IUserStore } from '../shared/models/userStore';
import { Peer } from "../shared/models/peer";

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  peers: { [key: string]: Peer } = {};
  userStore: IUserStore = {
    displayName: '',
    socketId: '',
    localStream: new MediaStream,
    screenSharingStream: new MediaStream,
    micActive: true,
    deafened: false,
    analyser: new AnalyserNode(new AudioContext()),
    volume: 0,
    shouldVolumeTimeout: true,
    volumeRelease: 100,
    noiseGateValue: 25,
    isSharingScreen: false
  }

  constructor() {
    let noiseGateValue = localStorage.getItem('noiseGateValue');
    if (noiseGateValue)
      this.userStore.noiseGateValue = Number(noiseGateValue);
  }
}
