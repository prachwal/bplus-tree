import { BPlusTree } from '../lib/BPlusTree.js';
import { FileStorageProvider } from './FileStorageProvider.js';
import { RedisStorageProvider } from './RedisStorageProvider.js';

// Połączony przykład testowania obu storage providerów sekwencyjnie
async function combinedStorageExamples() {
  console.log('=== Testowanie sekwencyjne obu storage providerów ===');

  // Stwórz drzewo i dodaj 10000 danych
  const tree = new BPlusTree<string>();
  console.log('Dodawanie 10000 elementów...');
  for (let i = 1; i <= 10000; i++) {
    tree.insert(i, `value${i}`);
  }
  console.log('Dodano 10000 elementów.');

  // Test 1: File Storage
  console.log('\n--- Test File Storage ---');
  const fileStorage = new FileStorageProvider('tree-data.json');

  console.time('file-save');
  await tree.save(fileStorage);
  console.timeEnd('file-save');
  console.log('Drzewo zapisane do tree-data.json');

  const fileTree = new BPlusTree<string>();
  console.time('file-load');
  await fileTree.load(fileStorage);
  console.timeEnd('file-load');
  console.log('Drzewo wczytane z tree-data.json');

  console.log('File Lookup 1:', fileTree.lookup(1));
  console.log('File Lookup 500:', fileTree.lookup(500));
  console.log('File Lookup 1000:', fileTree.lookup(1000));

  // Test 2: Redis Storage
  console.log('\n--- Test Redis Storage ---');
  const redisStorage = new RedisStorageProvider();
  await redisStorage.connect();

  try {
    console.time('redis-save');
    await tree.save(redisStorage);
    console.timeEnd('redis-save');
    console.log('Drzewo zapisane do Redis pod kluczem bplus-tree-data');

    const redisTree = new BPlusTree<string>();
    console.time('redis-load');
    await redisTree.load(redisStorage);
    console.timeEnd('redis-load');
    console.log('Drzewo wczytane z Redis');

    console.log('Redis Lookup 1:', redisTree.lookup(1));
    console.log('Redis Lookup 500:', redisTree.lookup(500));
    console.log('Redis Lookup 1000:', redisTree.lookup(1000));

  } finally {
    await redisStorage.close();
  }

  console.log('\n=== Testy zakończone ===');
}

// Uruchom połączony przykład
combinedStorageExamples().catch(console.error);