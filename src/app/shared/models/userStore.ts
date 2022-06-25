export interface IUserStore {
  socketId: string,
  localStream: MediaStream,
  micMuted: boolean,
  analyser: AnalyserNode
  volume: number,
  shouldVolumeTimeout: boolean,
  volumeRelease: number,
  noiseGateValue: number
}

