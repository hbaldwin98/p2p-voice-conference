export interface IPeer {
  socketId: string;
  displayName: string;
  remoteStream: any;
  rtcPeerConnection: RTCPeerConnection;
  volume: number;
  localMuted: boolean;
  userMuted: boolean;
  userTalking: boolean;
}

export class Peer implements IPeer {
  socketId: string;
  displayName = '';
  remoteStream: any;
  rtcPeerConnection: RTCPeerConnection;
  volume: number;
  localMuted = false;
  userMuted = false
  userTalking = false;

  constructor(socketId: string, remoteStream: any, rtcPeerConnection: RTCPeerConnection, volume: number = 0.5) {
    this.socketId = socketId;
    this.remoteStream = remoteStream;
    this.rtcPeerConnection = rtcPeerConnection;
    this.volume = volume;
  }
}
