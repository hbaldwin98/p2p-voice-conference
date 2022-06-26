export interface IPeer {
  socketId: string;
  displayName: string;
  remoteStream: any;
  rtcPeerConnection: RTCPeerConnection;
  volume: number;
  localMuted: boolean;
  isMuted: boolean;
  isTalking: boolean;
  isSharingScreen: boolean;
}

export class Peer implements IPeer {
  socketId: string;
  displayName = '';
  remoteStream: MediaStream;
  rtcPeerConnection: RTCPeerConnection;
  volume: number;
  localMuted = false;
  isMuted = false
  isTalking = false;
  isSharingScreen = false;

  constructor(socketId: string, remoteStream: any, rtcPeerConnection: RTCPeerConnection, volume: number = 0.5) {
    this.socketId = socketId;
    this.remoteStream = remoteStream;
    this.rtcPeerConnection = rtcPeerConnection;
    this.volume = volume;
  }
}
