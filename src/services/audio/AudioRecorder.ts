// Real Voice Recorder Service via navigator.mediaDevices and MediaRecorder (Phase 7D)
import { MediaAsset } from '../../types';
import { VoiceRecordingSession } from '../../types/audio';

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: any = null;

  private onUpdateCallback?: (session: VoiceRecordingSession) => void;

  public setOnUpdate(cb: (session: VoiceRecordingSession) => void): void {
    this.onUpdateCallback = cb;
  }

  /**
   * Request microphone permission and initialize MediaRecorder.
   */
  public async startRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      return;
    }

    try {
      this.recordedChunks = [];
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Detect best supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }

      this.mediaRecorder = new MediaRecorder(
        this.audioStream,
        mimeType ? { mimeType } : undefined
      );

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms chunks
      this.startTime = Date.now();

      this.timerInterval = setInterval(() => {
        const durationMs = Date.now() - this.startTime;
        this.emitUpdate({
          isRecording: true,
          isPaused: false,
          durationMs,
          mimeType: this.mediaRecorder?.mimeType || 'audio/webm',
        });
      }, 200);

      this.emitUpdate({
        isRecording: true,
        isPaused: false,
        durationMs: 0,
        mimeType: this.mediaRecorder.mimeType || 'audio/webm',
      });
    } catch (err: any) {
      console.error('Error al acceder al micrófono:', err);
      const errMsg =
        err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado por el usuario.'
          : err.message || 'Error inicializando grabador de audio.';
      this.emitUpdate({
        isRecording: false,
        isPaused: false,
        durationMs: 0,
        mimeType: '',
        errorMessage: errMsg,
      });
      throw new Error(errMsg);
    }
  }

  /**
   * Stops recording and produces final audio Blob and MediaAsset.
   */
  public async stopRecording(clipName?: string): Promise<{ blob: Blob; asset: MediaAsset }> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      throw new Error('No hay una grabación de audio activa');
    }

    clearInterval(this.timerInterval);
    const finalDurationMs = Date.now() - this.startTime;

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          const url = URL.createObjectURL(blob);

          // Clean up stream tracks
          if (this.audioStream) {
            this.audioStream.getTracks().forEach((track) => track.stop());
            this.audioStream = null;
          }

          const asset: MediaAsset = {
            id: `asset-rec-${Date.now()}`,
            name: clipName || `Locución Grabada ${new Date().toLocaleTimeString()}`,
            type: 'audio',
            url,
            fileBlob: blob,
            mimeType,
            sizeBytes: blob.size,
            license: 'Grabación de voz original del usuario (Propietario)',
            provenance: 'Micrófono local en cliente',
            createdAt: Date.now(),
          };

          this.emitUpdate({
            isRecording: false,
            isPaused: false,
            durationMs: finalDurationMs,
            audioBlob: blob,
            audioUrl: url,
            mimeType,
          });

          resolve({ blob, asset });
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder!.onerror = (e) => {
        reject(e);
      };

      this.mediaRecorder!.stop();
    });
  }

  public isRecordingActive(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  private emitUpdate(session: VoiceRecordingSession): void {
    if (this.onUpdateCallback) {
      this.onUpdateCallback(session);
    }
  }
}

export const audioRecorder = new AudioRecorder();
