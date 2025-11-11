# Plan Providerów Storage dla B+ Tree

## Wprowadzenie

Biblioteka B+ Tree wspiera pluggable storage providers poprzez prosty interfejs `StorageProvider` z metodami `save(Buffer)` i `load(): Promise<Buffer>`. Obecnie zaimplementowane są podstawowe providery (File, Redis), ale istnieje wiele możliwości rozszerzenia.

## Obecnie Zaimplementowane ✅

### FileStorageProvider

- **Lokalizacja**: `src/examples/FileStorageProvider.ts`
- **Opis**: Zapisuje dane do plików lokalnych
- **Format**: MessagePack (skompresowany)
- **Zalety**: Prosty, nie wymaga zewnętrznych usług
- **Wady**: Brak współbieżności, lokalny storage

### RedisStorageProvider

- **Lokalizacja**: `src/examples/RedisStorageProvider.ts`
- **Opis**: Zapisuje dane do Redis z shardingiem poziomów
- **Format**: MessagePack zakodowany w base64
- **Zalety**: Szybki, współbieżny dostęp, skalowalny
- **Wady**: Wymaga Redis server

## Planowane Providery 🚧

### Bazy Danych

#### MongoDB Provider

```typescript
export class MongoDBStorageProvider implements StorageProvider {
    constructor(private collection: string, private uri: string) {}

    async save(data: Buffer): Promise<void> {
        // Zapisz jako Binary w MongoDB
        const doc = { _id: 'bplus-tree-data', data: new Binary(data) };
        await this.collection.replaceOne({ _id: 'bplus-tree-data' }, doc, { upsert: true });
    }

    async load(): Promise<Buffer> {
        const doc = await this.collection.findOne({ _id: 'bplus-tree-data' });
        return doc?.data?.buffer || Buffer.alloc(0);
    }
}
```

- **Zalety**: Dokumentowa baza danych, dobra skalowalność
- **Biblioteka**: `mongodb`
- **Przypadki użycia**: Aplikacje z MongoDB

#### PostgreSQL/MySQL Provider

```typescript
export class SQLStorageProvider implements StorageProvider {
    constructor(private table: string, private connectionString: string) {}

    async save(data: Buffer): Promise<void> {
        // Zapisz jako BYTEA/BLOB
        await this.client.query(
            'INSERT INTO $1 (id, data) VALUES ($2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
            [this.table, 'bplus-tree-data', data]
        );
    }
}
```

- **Zalety**: Relacyjne bazy danych, transakcje ACID
- **Biblioteki**: `pg` (PostgreSQL), `mysql2` (MySQL)
- **Przypadki użycia**: Enterprise aplikacje

#### SQLite Provider

```typescript
export class SQLiteStorageProvider implements StorageProvider {
    constructor(private dbPath: string, private table: string = 'bplus_tree') {}

    async save(data: Buffer): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO ${this.table} (key, data) VALUES (?, ?)`,
            ['tree-data', data]
        );
    }
}
```

- **Zalety**: Lokalna baza danych, plikowa
- **Biblioteka**: `better-sqlite3` lub `sqlite3`
- **Przypadki użycia**: Desktop aplikacje, embedded systemy

### Chmura/Storage

#### AWS S3 Provider

```typescript
export class S3StorageProvider implements StorageProvider {
    constructor(private bucket: string, private key: string) {}

    async save(data: Buffer): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: this.key,
            Body: data,
            ContentType: 'application/octet-stream'
        });
        await this.s3Client.send(command);
    }
}
```

- **Zalety**: Skalowalny storage w chmurze
- **Biblioteka**: `@aws-sdk/client-s3`
- **Przypadki użycia**: Aplikacje w AWS

#### Google Cloud Storage Provider

```typescript
export class GCSStorageProvider implements StorageProvider {
    constructor(private bucket: string, private fileName: string) {}

    async save(data: Buffer): Promise<void> {
        const file = this.bucket.file(this.fileName);
        await file.save(data, { contentType: 'application/octet-stream' });
    }
}
```

- **Biblioteka**: `@google-cloud/storage`
- **Przypadki użycia**: Aplikacje w GCP

#### Azure Blob Storage Provider

```typescript
export class AzureBlobStorageProvider implements StorageProvider {
    constructor(private container: string, private blobName: string) {}

    async save(data: Buffer): Promise<void> {
        const blockBlobClient = this.containerClient.getBlockBlobClient(this.blobName);
        await blockBlobClient.upload(data, data.length);
    }
}
```

- **Biblioteka**: `@azure/storage-blob`
- **Przypadki użycia**: Aplikacje w Azure

### Lokalne/Inne

#### Memory Provider (dla testów)

```typescript
export class MemoryStorageProvider implements StorageProvider {
    private data: Buffer | null = null;

    async save(data: Buffer): Promise<void> {
        this.data = data;
    }

    async load(): Promise<Buffer> {
        if (!this.data) throw new Error('No data stored');
        return this.data;
    }
}
```

- **Zalety**: Szybki, dla testów
- **Przypadki użycia**: Testy jednostkowe, development

#### Compressed File Provider

```typescript
export class CompressedFileStorageProvider implements StorageProvider {
    constructor(private filePath: string, private compression: 'gzip' | 'brotli' = 'gzip') {}

    async save(data: Buffer): Promise<void> {
        const compressed = await this.compress(data);
        await writeFile(this.filePath, compressed);
    }

    async load(): Promise<Buffer> {
        const compressed = await readFile(this.filePath);
        return await this.decompress(compressed);
    }
}
```

- **Zalety**: Mniejszy rozmiar plików
- **Biblioteki**: `zlib` (built-in), `brotli` (opcjonalnie)

### Zaawansowane

#### Multi-Provider (fallback)

```typescript
export class MultiStorageProvider implements StorageProvider {
    constructor(private providers: StorageProvider[]) {}

    async save(data: Buffer): Promise<void> {
        // Zapisz do wszystkich providerów
        await Promise.all(this.providers.map(p => p.save(data)));
    }

    async load(): Promise<Buffer> {
        // Spróbuj załadować z pierwszego dostępnego
        for (const provider of this.providers) {
            try {
                return await provider.load();
            } catch (error) {
                console.warn(`Provider failed: ${error}`);
            }
        }
        throw new Error('All providers failed');
    }
}
```

- **Zalety**: Redundancja, reliability
- **Przypadki użycia**: Krytyczne aplikacje

#### Encrypted Provider

```typescript
export class EncryptedStorageProvider implements StorageProvider {
    constructor(private innerProvider: StorageProvider, private key: string) {}

    async save(data: Buffer): Promise<void> {
        const encrypted = await this.encrypt(data, this.key);
        await this.innerProvider.save(encrypted);
    }

    async load(): Promise<Buffer> {
        const encrypted = await this.innerProvider.load();
        return await this.decrypt(encrypted, this.key);
    }
}
```

- **Zalety**: Bezpieczeństwo danych
- **Biblioteki**: `crypto` (built-in), `aes-256-gcm`

#### LevelDB/RocksDB Provider

```typescript
export class LevelDBStorageProvider implements StorageProvider {
    constructor(private dbPath: string) {}

    async save(data: Buffer): Promise<void> {
        await this.db.put('bplus-tree-data', data);
    }

    async load(): Promise<Buffer> {
        return await this.db.get('bplus-tree-data');
    }
}
```

- **Zalety**: Embedded key-value store
- **Biblioteki**: `level` (LevelDB), `rocksdb`
- **Przypadki użycia**: Wysokowydajne lokalne storage

#### DynamoDB Provider

```typescript
export class DynamoDBStorageProvider implements StorageProvider {
    constructor(private table: string, private keyName: string = 'id') {}

    async save(data: Buffer): Promise<void> {
        await this.dynamoDb.putItem({
            TableName: this.table,
            Item: {
                [this.keyName]: { S: 'bplus-tree-data' },
                data: { B: data }
            }
        });
    }
}
```

- **Zalety**: Serverless NoSQL w AWS
- **Biblioteka**: `@aws-sdk/client-dynamodb`

## Specjalizowane

### IPFS Provider

```typescript
export class IPFSStorageProvider implements StorageProvider {
    constructor(private ipfsClient: any) {}

    async save(data: Buffer): Promise<void> {
        const result = await this.ipfsClient.add(data);
        this.cid = result.cid.toString();
    }

    async load(): Promise<Buffer> {
        const chunks = [];
        for await (const chunk of this.ipfsClient.cat(this.cid)) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
}
```

- **Zalety**: Decentralized storage
- **Biblioteka**: `ipfs-http-client`

### Redis Cluster Provider

```typescript
export class RedisClusterStorageProvider implements StorageProvider {
    constructor(private nodes: string[]) {}

    async save(data: Buffer): Promise<void> {
        // Sharding across Redis cluster
        const shards = this.shardData(data);
        await Promise.all(shards.map((shard, i) => this.saveShard(i, shard)));
    }
}
```

- **Zalety**: Wysoka dostępność, skalowalność

## Roadmap Implementacji

### Priorytet Wysoki 🔴

1. **MongoDB Provider** - Popularna dokumentowa baza
2. **PostgreSQL Provider** - Enterprise SQL baza
3. **AWS S3 Provider** - Chmurowy storage
4. **Memory Provider** - Dla testów

### Priorytet Średni 🟡

1. **SQLite Provider** - Lokalna baza danych
2. **Compressed File Provider** - Kompresja plików
3. **Multi-Provider** - Redundancja
4. **Encrypted Provider** - Bezpieczeństwo

### Priorytet Niski 🟢

1. **Google Cloud Storage** - Alternatywna chmura
2. **Azure Blob Storage** - Microsoft cloud
3. **LevelDB/RocksDB** - Embedded stores
4. **DynamoDB** - AWS NoSQL
5. **IPFS** - Decentralized storage

## Wymagania Implementacyjne

### Interface StorageProvider

```typescript
export interface StorageProvider {
  save(data: Buffer): Promise<void>;
  load(): Promise<Buffer>;
}
```

### Wymagania dla Providerów

- **Thread Safety**: Metody mogą być wywoływane współbieżnie
- **Error Handling**: Rzucać opisowe błędy
- **Resource Management**: Cleanup połączeń w razie potrzeby
- **Serialization**: Obsługa Buffer (MessagePack)

### Testowanie

- Unit testy dla każdego providera
- Integration testy z rzeczywistymi usługami
- Performance benchmarks
- Error scenarios

## Przykład Użycia Custom Providera

```typescript
import { BPlusTree, StorageProvider } from '@prachwal_org/bplus-tree';

// Implementacja custom providera
class MyCloudProvider implements StorageProvider {
    async save(data: Buffer): Promise<void> {
        // Twoja logika zapisu
        await this.uploadToCloud(data);
    }

    async load(): Promise<Buffer> {
        // Twoja logika ładowania
        return await this.downloadFromCloud();
    }
}

// Użycie
const tree = new BPlusTree<string>();
const provider = new MyCloudProvider();

await tree.save(provider);
await tree.load(provider);
```

## Contributing

Chcesz dodać nowego providera? Zobacz [CONTRIBUTING.md](CONTRIBUTING.md) po instrukcje!
