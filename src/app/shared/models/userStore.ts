export interface IUserStore {
  socketId: string,
  localStream: MediaStream,
  micActive: boolean,
  analyser: AnalyserNode
  volume: number,
  shouldVolumeTimeout: boolean,
  volumeRelease: number,
  noiseGateValue: number
}

