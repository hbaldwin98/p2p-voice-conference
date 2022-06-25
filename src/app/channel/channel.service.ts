import { Injectable } from '@angular/core';
import { IUserStore } from '../shared/models/userStore';
import { Peer } from "../shared/models/peer";

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  peers: { [key: string]: Peer } = {};
  userStore: IUserStore = {
    socketId: '',
    localStream: new MediaStream,
    micActive: true,
    analyser: new AnalyserNode(new AudioContext()),
    volume: 0,
    shouldVolumeTimeout: true,
    volumeRelease: 100,
    noiseGateValue: 25
  }

  constructor() {
  }
}
