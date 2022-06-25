import { Injectable } from '@angular/core';
import { IUserStore } from '../shared/models/userStore';
import { Peer } from "../shared/models/peer";

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  peers: { [key: string]: Peer } = {};
  userStore: IUserStore = {
    socketId: '', localStream: new MediaStream, micMuted: true
  }

  constructor() {
  }

}
