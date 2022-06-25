import { Injectable } from '@angular/core';
import { ChannelService } from "../../channel/channel.service";
import { Socket } from "ngx-socket-io";
import { WebRTCAO } from "../models/WebRTCAO";
import { Peer } from "../models/peer";

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  defaultConstraints = {
    audio: {
      autoGainControl: false,
      channelCount: 2,
      echoCancellation: false,
      latency: 0,
      noiseSuppression: false,
      sampleRate: 48000,
      sampleSize: 16,
      volume: 1.0
    }, video: false,
  };

  configuration = {
    iceServers: [ {
      urls: 'stun:stun.l.google.com:13902',
    }, {
      urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject",
    }, {
      urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject",
    }, {
      urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject",
    } ]
  };

  constructor(private channel: ChannelService, public socket: Socket) {}

  async initializeSocketEvents() {
    this.socket.on('connected', (data: any) => {
      console.log('your socket id is', data);
      this.channel.userStore.socketId = data;
      this.initializeLocalStream().then(() => {
        this.socket.emit('ready-to-connect');
      });
    });

    this.socket.on('ready-to-connect', (data: any) => {
      data.forEach((peer: string) => {
        if (!this.channel.peers[peer]) {
          console.log('initializing peer connection with', peer);
          this.initializePeerConnection(peer);
        }
      });
    });

    this.socket.on('user-disconnected', (userId: any) => {
      console.log('user disconnected', userId);
      this.channel.peers[userId].rtcPeerConnection.close();
      delete this.channel.peers[userId];
      console.log(this.channel.peers);
    });

    this.socket.on('webRTC-signaling', async (data: WebRTCAO) => {
      switch (data.type) {
        case 'offer':
          await this.handleWebRTCOffer(data);
          break
        case 'answer':
          await this.handleWebRTCAnswer(data);
          break
        case 'ice-candidate':
          await this.handleWebRTCCandidate(data);
          break
        default:
          break
      }
    });

    this.socket.on('user-toggled-mic', (data: any) => {
      this.channel.peers[data.userId].userMuted = data.mic;
    });
  }

  async initializeLocalStream() {
    return navigator.mediaDevices
      .getUserMedia(this.defaultConstraints)
      .then((stream) => {
        console.log('initializing local stream');
        // const FILTER_PARAMS = [ 'type', 'frequency', 'gain', 'detune', 'Q' ];
        // const COMPRESSOR_PARAMS = [ 'threshold', 'knee', 'ratio', 'attack', 'release' ];
        // const DEFAULT_OPTIONS = {
        //   threshold: -50,
        //   knee: 40,
        //   ratio: 12,
        //   reduction: -20,
        //   attack: 0,
        //   release: 0.25,
        //   Q: 8.30,
        //   frequency: 355,
        //   gain: 3.0,
        //   type: 'bandpass',
        // };
        // let audioCtx = new window.AudioContext();
        // // let compressorPramas = this.selectParams(DEFAULT_OPTIONS, COMPRESSOR_PARAMS);
        // // let filterPramas = this.selectParams(DEFAULT_OPTIONS, FILTER_PARAMS);
        // // let compressor = new DynamicsCompressorNode(audioCtx, compressorPramas);
        // // let filter = new BiquadFilterNode(audioCtx, filterPramas);
        // let gain = new GainNode(audioCtx, { gain: 3 });
        // let source = audioCtx.createMediaStreamSource(stream);
        // let dest = audioCtx.createMediaStreamDestination();
        // source.connect(gain);
        // gain.connect(dest);
        // source.connect(filter);
        // source.connect(compressor);
        // filter.connect(dest);
        // compressor.connect(dest);

        this.channel.userStore.localStream = stream;

      })
      .catch((err) => {
        console.log('An error occured attempting to get the camera stream: ' + err,);
      });
  }

  selectParams(object: any, filterArr: any) {
    return Object.keys(object).reduce((opt: any, p) => {
      if (filterArr.includes(p)) {
        opt[p] = object[p];
      }
      return opt;
    }, {});
  }

  async createPeerConnection(socketId: string) {
    let rtcPeerConnection = new RTCPeerConnection(this.configuration);

    // receiving tracks
    const remoteStream = new MediaStream();
    this.channel.peers[socketId] = new Peer(socketId, remoteStream, rtcPeerConnection);
    let peer = this.channel.peers[socketId];

    // add our stream to peer connection
    const localStream = this.channel.userStore.localStream;
    if (localStream) {
      localStream.getTracks().forEach((track: any) => {
        console.log(localStream);
        peer.rtcPeerConnection.addTrack(track, localStream);
      });
    }

    peer.rtcPeerConnection.onicecandidate = (e: any) => {
      if (e.candidate) {
        // send our ice candidate to peers
        this.sendWebRTCData({
          candidate: e.candidate,
          type: 'ice-candidate',
          socketId: peer.socketId,
          sender: this.channel.userStore.socketId,
        });
      }
    }

    peer.rtcPeerConnection.oniceconnectionstatechange = (e: any) => {
      if (rtcPeerConnection.connectionState === 'connected') {
        console.log('successfully connected to peer');
      }
    };

    peer.rtcPeerConnection.ontrack = (e: any) => {
      remoteStream.addTrack(e.track);
    };
  }

  // we exchange SDP information with the offer
  async sendWebRTCOffer(peerData: string) {
    let peer = this.channel.peers[peerData];
    if (peer) {
      console.log("sending webRTC offer", peer);
      const offer = await peer.rtcPeerConnection.createOffer().then((sdp: any) => {
        let arr = sdp.sdp.split('\r');
        let ind = arr.findIndex((line: any) => line === '\na=fmtp:111 minptime=10;useinbandfec=1');
        if (ind) {
          arr[ind] = '\na=fmtp:111 minptime=10;useinbandfec=1; stereo=1; maxaveragebitrate=510000; cbr=1';
        }
        sdp.sdp = arr.join('\r');
        return sdp;
      });

      await peer.rtcPeerConnection.setLocalDescription(offer);

      this.sendWebRTCData({
        type: 'offer', offer: offer, socketId: peerData, sender: this.channel.userStore.socketId,
      });
    }
  };

  async handleWebRTCOffer(peerData: WebRTCAO) {
    await this.createPeerConnection(peerData.sender);

    let peer = this.channel.peers[peerData.sender];
    if (peer) {
      // get the SDP offer information from caller and set that as the remote description
      if (peerData.offer) {
        console.log('handling incoming webRTC offer', peerData);
        await peer.rtcPeerConnection.setRemoteDescription(peerData.offer);
      }
      // create an answer to the offer
      const answer = await peer.rtcPeerConnection.createAnswer().then((sdp: any) => {
        let arr = sdp.sdp.split('\r');
        let ind = arr.findIndex((line: any) => line === '\na=fmtp:111 minptime=10;useinbandfec=1');
        if (ind) {
          arr[ind] = '\na=fmtp:111 minptime=10;useinbandfec=1; stereo=1; maxaveragebitrate=510000; cbr=1';
        }
        sdp.sdp = arr.join('\r');
        return sdp;
      });

      await peer.rtcPeerConnection.setLocalDescription(answer);
      // send the answer to the caller
      this.sendWebRTCData({
        type: 'answer', answer: answer, socketId: peerData.sender, sender: this.channel.userStore.socketId,
      });
    }
  };

  async handleWebRTCAnswer(peerData: WebRTCAO) {
    let peer = this.channel.peers[peerData.sender];
    if (peer) {
      // get the SDP answer information from caller and set that as the remote description
      console.log("handling webRTC answer", peerData);
      if (peerData.answer) await peer.rtcPeerConnection.setRemoteDescription(peerData.answer);
    }
  };

  async handleWebRTCCandidate(peerData: WebRTCAO) {
    let peer = this.channel.peers[peerData.sender];
    if (peer) {
      console.log('handling incoming webRTC candidates');
      try {
        await peer.rtcPeerConnection.addIceCandidate(peerData.candidate);
      } catch (err) {
        console.log(`Error received while attempting to add received ice candidate`, err);
        console.log(peerData);
      }
    }
  };

  sendWebRTCData(data: WebRTCAO) {
    this.socket.emit('webRTC-signaling', data);
  }

  async initializePeerConnection(peer: string) {
    await this.createPeerConnection(peer);
    await this.sendWebRTCOffer(peer);
  }
}
