import { createClient } from 'redis';
import { StorageProvider } from './StorageProvider';

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

    // Sharding methods for levels
    async saveLevels(levels: Map<number, Buffer>): Promise<void> {
        if (!this.client.isOpen) await this.client.connect();
        const pipeline = this.client.multi();
        for (const [level, buffer] of levels) {
            pipeline.set(`${this.key}:level:${level}`, buffer.toString('base64'));
        }
        await pipeline.exec();
    }

    async loadLevels(): Promise<Map<number, Buffer>> {
        if (!this.client.isOpen) await this.client.connect();
        const levels = new Map<number, Buffer>();

        // Get all level keys
        const keys = await this.client.keys(`${this.key}:level:*`);
        if (keys.length === 0) {
            throw new Error('No data found in Redis');
        }

        const pipeline = this.client.multi();
        keys.forEach(key => pipeline.get(key));
        const results = await pipeline.exec();

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const data = results[i] as unknown as string | null;
            if (data !== null) {
                const level = parseInt(key.split(':').pop()!);
                levels.set(level, Buffer.from(data, 'base64'));
            }
        }

        return levels;
    }

    async clearAll(): Promise<void> {
        if (!this.client.isOpen) await this.client.connect();
        const keys = await this.client.keys(`${this.key}:*`);
        if (keys.length > 0) {
            await this.client.del(keys);
        }
    }
}
