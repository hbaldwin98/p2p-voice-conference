import { Injectable } from '@angular/core';
import { ChannelService } from "../../channel/channel.service";
import { Socket } from "ngx-socket-io";
import { WebRTCAO } from "../models/WebRTCAO";
import { Peer } from "../models/peer";

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  audioConstraints = {
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

  screenSharingConstraints = {
    video:{
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      frameRate: {ideal: 60}
    },
  }

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
      this.channel.peers[data.userId].isMuted = data.mic;
    });

    this.socket.on('user-talking', (data: any) => {
      if (this.channel.peers[data.userId]) this.channel.peers[data.userId].isTalking = data.userTalking;
    });

    this.socket.on('user-change-name', (data: any) => {
      console.log(data);
      if (this.channel.peers[data.userId]) this.channel.peers[data.userId].displayName = data.name;
    });

    this.socket.on('user-screen-sharing', (data: any) => {
      if (this.channel.peers[data.userId]) this.channel.peers[data.userId].isSharingScreen = data.screenSharing;
    });
  }

  // initializes the local stream
  // this must be called BEFORE a WEB RTC offer/answer is sent
  initializeLocalStream() {
    return navigator.mediaDevices
      .getUserMedia(this.audioConstraints)
      .then(this.onMicrophoneGranted.bind(this))
      .catch((err) => {
        console.log('An error occured attempting to get the camera stream: ' + err,);
      });
  }

  async initializeScreenShare() {
    if (this.channel.userStore.isSharingScreen) {
      const videoTracks = this.channel.userStore.screenSharingStream.getVideoTracks();
      videoTracks.forEach(videoTrack => {
        videoTrack.stop();
        console.log("removing track", videoTrack);
      });

      for (const peerId in this.channel.peers) {
        console.log('renogiation offer with peer: ', peerId);
        await this.initializePeerConnection(peerId);
      }

      this.channel.userStore.isSharingScreen = false;
      this.socket.emit('user-screen-sharing', false);
      return;
    }

    return navigator.mediaDevices
      .getDisplayMedia(this.screenSharingConstraints)
      .then(this.onScreenShareGranted.bind(this))
  }

  async onScreenShareGranted(stream: MediaStream) {
    this.channel.userStore.screenSharingStream = stream;

    for (const peerId in this.channel.peers) {
      console.log('renogiation offer with peer: ', peerId);
      await this.initializePeerConnection(peerId);
    }

    this.channel.userStore.isSharingScreen = true;
    this.socket.emit('user-screen-sharing', true);
  }

  onMicrophoneGranted(stream: MediaStream) {
    console.log('initializing local stream');
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const destination = audioContext.createMediaStreamDestination();
    const analyser = audioContext.createAnalyser();
    const javascriptNode = audioContext.createScriptProcessor(2048, 2, 2);
    this.channel.userStore.analyser = analyser;

    analyser.minDecibels = -100;
    analyser.maxDecibels = 0;
    analyser.smoothingTimeConstant = 0.85;


    javascriptNode.onaudioprocess = async () => {
      let db = await this.getVolumeInDb()
      let shouldTimeout = this.channel.userStore.shouldVolumeTimeout;
      let noiseGate = this.channel.userStore.noiseGateValue;
      let timeout;

      if (!this.channel.userStore.globalMute && this.channel.userStore.micActive) {
        if (db < noiseGate) {
          if (shouldTimeout && db < noiseGate - 3) {
            this.channel.userStore.shouldVolumeTimeout = false;
            timeout = setTimeout(() => {
              this.socket.emit('user-talking', false);
              this.channel.userStore.localStream.getAudioTracks()[0].enabled = false;
            }, this.channel.userStore.volumeRelease);
          }
        }

        if (db >= noiseGate && !shouldTimeout) {
          if (timeout) clearTimeout(timeout);
          this.socket.emit('user-talking', true);
          this.channel.userStore.localStream.getAudioTracks()[0].enabled = true;
          this.channel.userStore.shouldVolumeTimeout = true;
        }
      } else {
        this.socket.emit('user-talking', false);
        this.channel.userStore.localStream.getAudioTracks()[0].enabled = false;
        this.channel.userStore.shouldVolumeTimeout = false;
      }
      this.channel.userStore.volume = db;
    }

    source.connect(javascriptNode);
    source.connect(analyser);
    javascriptNode.connect(destination);
    analyser.connect(destination);
    this.channel.userStore.localStream = destination.stream;
  }

  async getVolumeInDb() {
    //https://github.com/apm1467/html5-mic-visualizer/blob/master/js/index.js
    let analyser = this.channel.userStore.analyser;
    let bufferLength = analyser.frequencyBinCount
    let frequencyArray = new Uint8Array(bufferLength)
    this.channel.userStore.analyser.getByteFrequencyData(frequencyArray);

    let total = 0
    for (let i = 0; i < 255; i++) {
      let x = frequencyArray[i];
      total += x * x;
    }
    let rms = Math.sqrt(total / bufferLength);
    let db = 20 * (Math.log(rms) / Math.log(10));
    db = Math.max(db, 0); // sanity check
    return Math.round(db * 100) / 100;
  }

  // creates a peer connection with a given peer
  createPeerConnection(socketId: string) {
    let rtcPeerConnection = new RTCPeerConnection(this.configuration);

    // receiving tracks
    const remoteStream = new MediaStream();
    if (this.channel.peers[socketId]) {
      this.channel.peers[socketId].rtcPeerConnection = rtcPeerConnection;
      this.channel.peers[socketId].remoteStream = remoteStream;
    } else {
      this.channel.peers[socketId] = new Peer(socketId, remoteStream, rtcPeerConnection);
    }

    let peer = this.channel.peers[socketId];

    // add our stream to peer connection
    const localStream = this.channel.userStore.localStream;
    const screenSharingStream = this.channel.userStore.screenSharingStream;

    if (localStream) {
      localStream.getTracks().forEach((track: any) => {
        console.log('adding local track: ', track);
        peer.rtcPeerConnection.addTrack(track, localStream);
      });
    }

    if (screenSharingStream) {
      screenSharingStream.getTracks().forEach((track: any) => {
        console.log('adding screen track', track);
        peer.rtcPeerConnection.addTrack(track, screenSharingStream);
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
        let arr = sdp.sdp.split('\r\n');
        arr.forEach((str: string, i: number) => {
          if (/^a=fmtp:\d*/.test(str)) {
            arr[i] = str + ';x-google-max-bitrate=10000;x-google-min-bitrate=0;x-google-start-bitrate=6000;minptime=10;useinbandfec=1; stereo=1; maxaveragebitrate=510000; cbr=1';
          } else if (/^a=mid:(1|video)/.test(str)) {
            arr[i] += '\r\nb=AS:10000';
          }
        });

        sdp.sdp = arr.join('\r\n');
        return sdp;
      });

      await peer.rtcPeerConnection.setLocalDescription(offer);

      this.sendWebRTCData({
        type: 'offer', offer: offer, socketId: peerData, sender: this.channel.userStore.socketId,
      });
    }
  }

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
        let arr = sdp.sdp.split('\r\n');
        arr.forEach((str: string, i: number) => {
          if (/^a=fmtp:\d*/.test(str)) {
            arr[i] = str + ';x-google-max-bitrate=10000;x-google-min-bitrate=0;x-google-start-bitrate=6000;minptime=10;useinbandfec=1; stereo=1; maxaveragebitrate=510000; cbr=1';
          } else if (/^a=mid:(1|video)/.test(str)) {
            arr[i] += '\r\nb=AS:10000';
          }
        });

        sdp.sdp = arr.join('\r\n');
        return sdp;
      });

      await peer.rtcPeerConnection.setLocalDescription(answer);

      // ensure our peer audio tracks status are correct
      // e.g. if the local peer has muted their stream, retain the mute.
      if (this.channel.userStore.globalMute) {
        for (const peerId in this.channel.peers) {
          console.log('muting peer', peerId);
          this.channel.peers[peerId].remoteStream.getAudioTracks()[0].enabled = false;
          const user = this.channel.userStore;
          this.socket.emit('user-toggled-mic', user.micActive ? user.globalMute : user.micActive);
        }
      } else {
        for (const peerId in this.channel.peers) {
          this.channel.peers[peerId].remoteStream.getAudioTracks()[0].enabled = !this.channel.peers[peerId].localMuted;
        }
      }

      // send the answer to the caller
      this.sendWebRTCData({
        type: 'answer', answer: answer, socketId: peerData.sender, sender: this.channel.userStore.socketId,
      });
    }
  }

  // once we receive an answer, we set the answer as the remote description
  async handleWebRTCAnswer(peerData: WebRTCAO) {
    let peer = this.channel.peers[peerData.sender];
    if (peer) {
      // get the SDP answer information from caller and set that as the remote description
      console.log("handling webRTC answer", peerData);
      if (peerData.answer) await peer.rtcPeerConnection.setRemoteDescription(peerData.answer);
    }
    // ensure our peer audio tracks status are correct
    // e.g. if the local peer has muted their stream, retain the mute.
    if (this.channel.userStore.globalMute) {
      for (const peerId in this.channel.peers) {
        console.log('muting peer', peerId);
        this.channel.peers[peerId].remoteStream.getAudioTracks()[0].enabled = false;
        const user = this.channel.userStore;
        this.socket.emit('user-toggled-mic', user.micActive ? user.globalMute : user.micActive);
      }
    } else {
      for (const peerId in this.channel.peers) {
        this.channel.peers[peerId].remoteStream.getAudioTracks()[0].enabled = !this.channel.peers[peerId].localMuted;
      }
    }
  }

  // once we receive an ice candidate, we add it to the peer connection
  async handleWebRTCCandidate(peerData: WebRTCAO) {
    let peer = this.channel.peers[peerData.sender];
    if (peer) {
      console.log('handling incoming webRTC candidates');
      try {
        await peer.rtcPeerConnection.addIceCandidate(peerData.candidate);
      } catch (err) {
        console.log(`Error received while attempting to add received ice candidate`, err);
      }
    }
  }

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
