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

  // creating all the socket events that the client will
  // listen to and handle
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

  // initializes the local stream
  // this must be called BEFORE a WEB RTC offer/answer is sent
  initializeLocalStream() {
    return navigator.mediaDevices
      .getUserMedia(this.defaultConstraints)
      .then((stream) => {
        console.log('initializing local stream');
        //create audio context
        const audioContext = new AudioContext();
        //create media stream source
        const source = audioContext.createMediaStreamSource(stream);
        // create destination
        const destination = audioContext.createMediaStreamDestination();
        //create analyzer node
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = -100;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = 0.85;
        let javascriptNode = audioContext.createScriptProcessor(2048, 2, 2);

        javascriptNode.onaudioprocess = () => {
          // get the average, bincount is fftsize / 2
          var array =  new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          var average = this.getAverageVolume(array)
          if (average < 4) {
            this.channel.userStore.localStream.getAudioTracks()[0].enabled = false;
          } else if (this.channel.userStore.micMuted) {
            this.channel.userStore.localStream.getAudioTracks()[0].enabled = true;
          }
        }

        this.channel.userStore.analyser = analyser;
        source.connect(javascriptNode);
        source.connect(analyser);
        javascriptNode.connect(destination);
        analyser.connect(destination);
        this.channel.userStore.localStream = destination.stream;
      })
      .catch((err) => {
        console.log('An error occured attempting to get the camera stream: ' + err,);
      });
  }

  getAverageVolume(array: any) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
      values += array[i];
    }

    average = values / length;
    return average;
  }


  // creates a peer connection with a given peer
  createPeerConnection(socketId: string) {
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

  // after receiving an offer, we exchange SDP information with the answer
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

  // once we receive an answer, we set the answer as the remote description
  async handleWebRTCAnswer(peerData: WebRTCAO) {
    let peer = this.channel.peers[peerData.sender];
    if (peer) {
      // get the SDP answer information from caller and set that as the remote description
      console.log("handling webRTC answer", peerData);
      if (peerData.answer) await peer.rtcPeerConnection.setRemoteDescription(peerData.answer);
    }
  };

  // once we receive an ice candidate, we add it to the peer connection
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

  // send WebRTC data to the peer
  sendWebRTCData(data: WebRTCAO) {
    this.socket.emit('webRTC-signaling', data);
  }

  // initializes the peer connection and begins the signaling process
  async initializePeerConnection(peer: string) {
    await this.createPeerConnection(peer);
    await this.sendWebRTCOffer(peer);
  }
}
