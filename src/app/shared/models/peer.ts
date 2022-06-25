export interface IPeer {
  socketId: string;
  remoteStream: any;
  rtcPeerConnection: RTCPeerConnection;
  volume: number;
  localMuted: boolean;
  userMuted: boolean;
}

export class Peer implements IPeer {
  socketId: string;
  remoteStream: any;
  rtcPeerConnection: RTCPeerConnection;
  volume: number;
  localMuted = false;
  userMuted = false

  constructor(socketId: string, remoteStream: any, rtcPeerConnection: RTCPeerConnection, volume: number = 0.5) {
    this.socketId = socketId;
    this.remoteStream = remoteStream;
    this.rtcPeerConnection = rtcPeerConnection;
    this.volume = volume;
  }
}
