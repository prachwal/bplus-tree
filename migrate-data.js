#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { encode, decode } from '@msgpack/msgpack';

/**
 * Migration script to convert old JSON serialized B+ Tree data to MessagePack format
 * Usage: node migrate-data.js <input.json> <output.msgpack>
 */

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: node migrate-data.js <input.json> <output.msgpack>');
    process.exit(1);
  }

  const [inputFile, outputFile] = args;

  try {
    console.log(`Reading JSON data from ${inputFile}...`);
    const jsonData = readFileSync(inputFile, 'utf8');
    const data = JSON.parse(jsonData);

    console.log('Converting to MessagePack...');
    const msgpackData = encode(data);

    console.log(`Writing MessagePack data to ${outputFile}...`);
    writeFileSync(outputFile, msgpackData);

    console.log('Migration completed successfully!');
    console.log(`Original size: ${jsonData.length} bytes`);
    console.log(`MessagePack size: ${msgpackData.length} bytes`);
    console.log(`Compression ratio: ${(msgpackData.length / jsonData.length * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();