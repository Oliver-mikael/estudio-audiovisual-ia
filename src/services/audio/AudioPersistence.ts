import { MediaAsset } from '../../types';
import { saveMediaAssetBlob, getMediaAssetBlob } from '../storage/db';

export class AudioPersistence {
  /**
   * Persists an audio recording or audio asset into IndexedDB
   */
  public static async saveAudioAsset(asset: MediaAsset): Promise<void> {
    if (asset.type !== 'audio') {
      throw new Error(`Asset type must be 'audio', received '${asset.type}'`);
    }
    await saveMediaAssetBlob(asset);
  }

  /**
   * Retrieves an audio asset from IndexedDB
   */
  public static async getAudioAsset(id: string): Promise<MediaAsset | null> {
    const asset = await getMediaAssetBlob(id);
    if (!asset || asset.type !== 'audio') {
      return null;
    }
    return asset;
  }

  /**
   * Converts a recorded Audio Blob into an ArrayBuffer suitable for Web Audio decoding
   */
  public static async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return blob.arrayBuffer();
  }

  /**
   * Converts an ArrayBuffer to a Blob
   */
  public static arrayBufferToBlob(buffer: ArrayBuffer, mimeType: string = 'audio/webm'): Blob {
    return new Blob([buffer], { type: mimeType });
  }
}
