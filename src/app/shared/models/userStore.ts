export interface IUserStore {
  socketId: string,
  localStream: MediaStream,
  micMuted: boolean,
  analyser: AnalyserNode
}

