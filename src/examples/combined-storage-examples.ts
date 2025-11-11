import { BPlusTree } from '../lib/BPlusTree.js';
import { FileStorageProvider } from '../lib/StorageProviders/FileStorageProvider.js';
import { RedisStorageProvider } from '../lib/StorageProviders/RedisStorageProvider.js';

// Połączony przykład testowania obu storage providerów sekwencyjnie
async function combinedStorageExamples() {
  console.log('=== Testowanie sekwencyjne obu storage providerów (50,000 losowych danych) ===');

  // Stwórz drzewo i dodaj 50000 losowych danych
  const tree = new BPlusTree<string>();
  console.log('Dodawanie 50000 losowych elementów...');
  console.log('Pamięć przed insert:', process.memoryUsage());

  const startInsert = Date.now();
  const keys = new Set<number>();
  while (keys.size < 50000) {
    keys.add(Math.floor(Math.random() * 100000) + 1);
  }
  const keyArray = Array.from(keys);
  for (const key of keyArray) {
    tree.insert(key, `value${key}`);
  }
  const insertTime = Date.now() - startInsert;

  console.log(`Dodano 50000 elementów w ${insertTime}ms.`);
  console.log('Pamięć po insert:', process.memoryUsage());
  console.log('Wysokość drzewa:', tree.root?.level || 0);

  // Test 1: File Storage
  console.log('\n--- Test File Storage ---');
  const fileStorage = new FileStorageProvider('tree-data-50k.json');

  console.log('Pamięć przed file save:', process.memoryUsage());
  console.time('file-save');
  await tree.save(fileStorage);
  console.timeEnd('file-save');
  console.log('Drzewo zapisane do tree-data-50k.json');
  console.log('Pamięć po file save:', process.memoryUsage());

  const fileTree = new BPlusTree<string>();
  console.log('Pamięć przed file load:', process.memoryUsage());
  console.time('file-load');
  await fileTree.load(fileStorage);
  console.timeEnd('file-load');
  console.log('Drzewo wczytane z tree-data-50k.json');
  console.log('Pamięć po file load:', process.memoryUsage());

  console.log('File Lookup przykładowe:', fileTree.lookup(keyArray[0]), fileTree.lookup(keyArray[25000]), fileTree.lookup(keyArray[49999]));

  // Test 2: Redis Storage (with sharding)
  console.log('\n--- Test Redis Storage (Sharded) ---');
  const redisStorage = new RedisStorageProvider('bplus-tree-50k');
  await redisStorage.connect();

  try {
    console.log('Pamięć przed redis save:', process.memoryUsage());
    console.time('redis-save-sharded');
    await tree.saveSharded(redisStorage);
    console.timeEnd('redis-save-sharded');
    console.log('Drzewo zapisane do Redis z shardingiem (klucze: bplus-tree-50k:level:*)');
    console.log('Pamięć po redis save:', process.memoryUsage());

    const redisTree = new BPlusTree<string>();
    console.log('Pamięć przed redis load:', process.memoryUsage());
    console.time('redis-load-sharded');
    await redisTree.loadSharded(redisStorage);
    console.timeEnd('redis-load-sharded');
    console.log('Drzewo wczytane z Redis (sharded)');
    console.log('Pamięć po redis load:', process.memoryUsage());

    console.log('Redis Lookup przykładowe:', redisTree.lookup(keyArray[0]), redisTree.lookup(keyArray[25000]), redisTree.lookup(keyArray[49999]));

  } finally {
    await redisStorage.close();
  }

  console.log('\n=== Testy zakończone ===');
}

// Uruchom połączony przykład
combinedStorageExamples().catch(console.error);