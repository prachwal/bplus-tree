
export interface StorageProvider {
  save(data: Buffer): Promise<void>;
  load(): Promise<Buffer>;
}
