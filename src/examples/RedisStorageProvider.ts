import { createClient } from 'redis';
import { StorageProvider } from '../lib/StorageProvider';

// Przykład implementacji StorageProvider dla Redis
export class RedisStorageProvider implements StorageProvider {
    private client;

    constructor(private key: string = 'bplus-tree-data') {
        this.client = createClient();
        this.client.on('error', (err) => console.error('Redis Client Error', err));
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await this.client.disconnect();
    }

    async save(buffer: Buffer): Promise<void> {
        if (!this.client.isOpen) await this.client.connect();
        await this.client.set(this.key, buffer.toString('base64'));
    }

    async load(): Promise<Buffer> {
        if (!this.client.isOpen) await this.client.connect();
        const data = await this.client.get(this.key);
        if (data === null) {
            throw new Error('No data found in Redis');
        }
        return Buffer.from(data, 'base64');
    }

    async close(): Promise<void> {
        if (this.client.isOpen) await this.client.disconnect();
    }
}
