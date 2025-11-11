import { writeFile, readFile } from 'fs/promises';
import { StorageProvider } from './StorageProvider';

// Przykład implementacji StorageProvider dla plików
export class FileStorageProvider implements StorageProvider {
    constructor(private filePath: string) { }

    async save(data: Buffer): Promise<void> {
        await writeFile(this.filePath, data);
    }

    async load(): Promise<Buffer> {
        return await readFile(this.filePath);
    }
}
