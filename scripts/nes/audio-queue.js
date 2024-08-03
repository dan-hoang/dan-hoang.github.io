class AudioQueue {
  constructor(audioContext) {
    this._audioContext = audioContext;
    this._nextPlayTime = 0;
  }

  queue(audioBuffer) {
    const audioBufferSourceNode = this._audioContext.createBufferSource();

    audioBufferSourceNode.buffer = audioBuffer;
    audioBufferSourceNode.connect(this._audioContext.destination);

    if (this._nextPlayTime < this._audioContext.currentTime) {
      const delay = 0.05;

      this._nextPlayTime = this._audioContext.currentTime + delay;
    }
    
    audioBufferSourceNode.start(this._nextPlayTime);
    this._nextPlayTime = this._nextPlayTime + audioBuffer.duration;
  }
}

export {AudioQueue};