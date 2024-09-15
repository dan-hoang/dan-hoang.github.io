import {AudioQueue} from "./audio-queue.js";

class Av {
  constructor({audioContext, nes, videoContext}) {
    this._audioContext = audioContext;
    this._samplesPerSecond = this._audioContext.sampleRate;
    this._framesPerSecond = 60;
    this._samplesPerFrame = Math.floor(this._samplesPerSecond / this._framesPerSecond);
    this._audioBuffer = this._constructAudioBuffer();
    this._audioBufferIndex = 0;
    this._audioQueue = new AudioQueue(this._audioContext);
    this._nes = nes;
    this._videoContext = videoContext;
    this._lastUpdateTime = performance.now();
  }

  play() {
    requestAnimationFrame(() => this.play());

    const now = performance.now();
    const deltaTime = now - this._lastUpdateTime;
    const secondsPerFrame = 1000 / this._framesPerSecond;

    if (deltaTime > secondsPerFrame) {
      this._lastUpdateTime = now - (deltaTime % secondsPerFrame);
      this._nes.frame();

      const audioOutput = this._nes.getAudioOutput();
      const videoOutput = this._nes.getVideoOutput();

      this._audioContext.resume();
      this._playAudio(audioOutput);
      this._playVideo(videoOutput);
    }
  }

  _constructAudioBuffer() {
    const numberOfChannels = 1;
    const numberOfFrames = 10;
    const numberOfSamples = numberOfFrames * this._samplesPerFrame;

    return this._audioContext.createBuffer(numberOfChannels, numberOfSamples, this._samplesPerSecond);
  }

  _playAudio(audioOutput) {
    const data = this._audioBuffer.getChannelData(0);
    const windowSize = audioOutput.length / this._samplesPerFrame;

    for (let i = 0; i < this._samplesPerFrame; i++) {
      // Downsample.
      
      data[this._audioBufferIndex] = audioOutput[Math.round(i * windowSize)];
      this._audioBufferIndex = (this._audioBufferIndex + 1) % data.length;

      if (this._audioBufferIndex === 0) {
        this._audioQueue.queue(this._audioBuffer);
        this._audioBuffer = this._constructAudioBuffer();
      }
    }
  }

  _playVideo(videoOutput) {
    this._videoContext.putImageData(new ImageData(videoOutput, 256, 240), 0, 0);
  }
}

export {Av};