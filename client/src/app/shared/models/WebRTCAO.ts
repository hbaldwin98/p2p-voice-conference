import {Peer} from "./peer";

export interface WebRTCAO {
  type: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidate;
  socketId: string;
  sender: string;
}
