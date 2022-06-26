﻿export interface IUserStore {
  displayName: string,
  socketId: string,
  localStream: MediaStream,
  screenSharingStream: MediaStream,
  micActive: boolean,
  globalMute: boolean,
  analyser: AnalyserNode
  volume: number,
  shouldVolumeTimeout: boolean,
  volumeRelease: number,
  noiseGateValue: number,
  isSharingScreen: boolean
}

