import { describe, test } from '@jest/globals';
import { BPlusTree } from '../lib/BPlusTree';
import { FileStorageProvider } from '../lib/StorageProviders/FileStorageProvider';
import { RedisStorageProvider } from '../lib/StorageProviders/RedisStorageProvider';

describe('Performance Benchmarks', () => {
  const sizes = [1000, 5000, 10000];

  sizes.forEach(size => {
    describe(`Dataset size: ${size}`, () => {
      let tree: BPlusTree<string>;
      let fileStorage: FileStorageProvider;
      let redisStorage: RedisStorageProvider;

      beforeAll(async () => {
        tree = new BPlusTree<string>();
        console.log(`\nPreparing dataset of ${size} elements...`);

        // Insert data
        for (let i = 1; i <= size; i++) {
          tree.insert(i, `value${i}`);
        }

        console.log(`Tree height: ${tree.root?.level || 0}`);
        console.log(`Memory usage:`, process.memoryUsage());

        // Setup storage
        fileStorage = new FileStorageProvider(`benchmark-${size}.json`);
        redisStorage = new RedisStorageProvider(`benchmark-${size}`);
        await redisStorage.connect();
      }, 30000);

      afterAll(async () => {
        if (redisStorage) {
          await redisStorage.clearAll();
          await redisStorage.close();
        }
      }, 30000);

      test('Insert performance', () => {
        console.time(`Insert ${size}`);
        const testTree = new BPlusTree<string>();
        for (let i = 1; i <= size; i++) {
          testTree.insert(i, `value${i}`);
        }
        console.timeEnd(`Insert ${size}`);
        expect(testTree.lookup(1)).toBe('value1');
      });

      test('Lookup performance', () => {
        console.time(`Lookup ${size}`);
        for (let i = 1; i <= size; i++) {
          tree.lookup(i);
        }
        console.timeEnd(`Lookup ${size}`);
        expect(tree.lookup(size)).toBe(`value${size}`);
      });

      test('File save/load performance', async () => {
        console.time(`File save ${size}`);
        await tree.save(fileStorage);
        console.timeEnd(`File save ${size}`);

        const loadTree = new BPlusTree<string>();
        console.time(`File load ${size}`);
        await loadTree.load(fileStorage);
        console.timeEnd(`File load ${size}`);

        // Verify
        expect(loadTree.lookup(1)).toBe('value1');
        expect(loadTree.lookup(size)).toBe(`value${size}`);
      }, 30000);

      test('Redis sharded save/load performance', async () => {
        console.time(`Redis save ${size}`);
        await tree.saveSharded(redisStorage);
        console.timeEnd(`Redis save ${size}`);

        const loadTree = new BPlusTree<string>();
        console.time(`Redis load ${size}`);
        await loadTree.loadSharded(redisStorage);
        console.timeEnd(`Redis load ${size}`);

        // Verify
        expect(loadTree.lookup(1)).toBe('value1');
        expect(loadTree.lookup(size)).toBe(`value${size}`);
      }, 30000);
    });
  });
});