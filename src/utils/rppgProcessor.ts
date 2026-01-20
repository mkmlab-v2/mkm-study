export interface RPPGResult {
  heartRate: number;
  confidence: number;
  signalQuality: 'good' | 'fair' | 'poor';
  drowsiness?: number; // 졸음 수치 (0-100)
  hrv?: number; // 심박 변이도
}

export class RPPGProcessor {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isProcessing: boolean = false;
  private rgbValues: number[][] = [];
  private maxBufferSize: number = 256;
  // private faceDetectionInterval: number = 10; // 사용하지 않음
  private frameCount: number = 0;
  private lastHeartRate: number = 72;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.canvasElement = document.createElement('canvas');
    this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true })!;
  }

  start(onResult: (result: RPPGResult) => void) {
    this.isProcessing = true;
    this.processFrame(onResult);
  }

  stop() {
    this.isProcessing = false;
    this.rgbValues = [];
    this.frameCount = 0;
  }

  private processFrame(onResult: (result: RPPGResult) => void) {
    if (!this.isProcessing) return;

    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;

      this.ctx.drawImage(this.videoElement, 0, 0);

      const faceRegion = this.detectFaceRegion();

      if (faceRegion) {
        const avgColor = this.extractAverageColor(faceRegion);
        this.rgbValues.push(avgColor);

        if (this.rgbValues.length > this.maxBufferSize) {
          this.rgbValues.shift();
        }

        if (this.rgbValues.length >= 128) {
          const heartRate = this.calculateHeartRate();
          const confidence = this.calculateConfidence();
          const signalQuality = this.assessSignalQuality(confidence);

          this.lastHeartRate = heartRate;

          onResult({
            heartRate,
            confidence,
            signalQuality
          });
        }
      }

      this.frameCount++;
    }

    setTimeout(() => this.processFrame(onResult), 33);
  }

  private detectFaceRegion(): { x: number; y: number; width: number; height: number } | null {
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    const faceWidth = Math.floor(width * 0.3);
    const faceHeight = Math.floor(height * 0.3);
    const faceX = Math.floor((width - faceWidth) / 2);
    const faceY = Math.floor(height * 0.25);

    return {
      x: faceX,
      y: faceY,
      width: faceWidth,
      height: faceHeight
    };
  }

  private extractAverageColor(region: { x: number; y: number; width: number; height: number }): number[] {
    const imageData = this.ctx.getImageData(region.x, region.y, region.width, region.height);
    const data = imageData.data;

    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    return [r / count, g / count, b / count];
  }

  private calculateHeartRate(): number {
    if (this.rgbValues.length < 128) return this.lastHeartRate;

    const greenChannel = this.rgbValues.map(rgb => rgb[1]);

    const detrended = this.detrend(greenChannel);

    const normalized = this.normalize(detrended);

    const fft = this.simpleFFT(normalized);

    const fps = 30;
    const freqResolution = fps / fft.length;

    const minBPM = 45;
    const maxBPM = 180;
    const minIdx = Math.floor(minBPM / 60 / freqResolution);
    const maxIdx = Math.floor(maxBPM / 60 / freqResolution);

    let maxPower = 0;
    let maxIdx_found = minIdx;

    for (let i = minIdx; i < maxIdx && i < fft.length; i++) {
      if (fft[i] > maxPower) {
        maxPower = fft[i];
        maxIdx_found = i;
      }
    }

    const heartRate = maxIdx_found * freqResolution * 60;

    const smoothedHR = this.lastHeartRate * 0.7 + heartRate * 0.3;

    return Math.max(45, Math.min(180, Math.round(smoothedHR)));
  }

  private detrend(signal: number[]): number[] {
    const n = signal.length;
    const mean = signal.reduce((a, b) => a + b, 0) / n;
    return signal.map(val => val - mean);
  }

  private normalize(signal: number[]): number[] {
    const max = Math.max(...signal.map(Math.abs));
    if (max === 0) return signal;
    return signal.map(val => val / max);
  }

  private simpleFFT(signal: number[]): number[] {
    const n = signal.length;
    const spectrum: number[] = new Array(Math.floor(n / 2)).fill(0);

    for (let k = 0; k < spectrum.length; k++) {
      let real = 0;
      let imag = 0;

      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * k * i) / n;
        real += signal[i] * Math.cos(angle);
        imag -= signal[i] * Math.sin(angle);
      }

      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }

    return spectrum;
  }

  private calculateConfidence(): number {
    if (this.rgbValues.length < 64) return 0;

    const recentValues = this.rgbValues.slice(-64);
    const greenChannel = recentValues.map(rgb => rgb[1]);

    const mean = greenChannel.reduce((a, b) => a + b, 0) / greenChannel.length;
    const variance = greenChannel.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / greenChannel.length;
    const stdDev = Math.sqrt(variance);

    const snr = mean / (stdDev + 0.001);

    const confidence = Math.min(100, (snr / 5) * 100);

    return Math.round(confidence);
  }

  private assessSignalQuality(confidence: number): 'good' | 'fair' | 'poor' {
    if (confidence >= 70) return 'good';
    if (confidence >= 40) return 'fair';
    return 'poor';
  }
}
