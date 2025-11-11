# BPlusTree

[![npm version](https://badge.fury.io/js/%40example%2Fbplus-tree.svg)](https://badge.fury.io/js/%40example%2Fbplus-tree)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance B+ Tree data structure implementation in TypeScript with comprehensive visualization support.

## Features

- 🚀 **High Performance**: Optimized B+ Tree implementation
- 🔍 **Type Safety**: Full TypeScript support with generics
- 📊 **Visualization**: ASCII tree printing and Mermaid diagram generation
- 💾 **Persistence**: Save diagrams to files
- 🧪 **Well Tested**: 96%+ test coverage
- 📦 **ES Modules**: Modern JavaScript module support

## Installation

```bash
npm install @example/bplus-tree
```

## Usage

```typescript
import { BPlusTree } from '@example/bplus-tree';

// Create a new B+ Tree
const tree = new BPlusTree<string>();

// Insert values
tree.insert(10, 'value1');
tree.insert(20, 'value2');
tree.insert(5, 'value3');

// Lookup values
console.log(tree.lookup(10)); // 'value1'
console.log(tree.lookup(15)); // null

// Get all keys
console.log(tree.getAllKeys()); // [5, 10, 20]

// Visualize the tree
console.log(tree.generateMermaid()); // Generate Mermaid diagram
tree.printAsciiTree(); // Print ASCII tree
tree.saveMermaidToFile('tree.md'); // Save diagram to file
```

## API

### BPlusTree&lt;T&gt;

#### Constructor

```typescript
new BPlusTree<T>()
```

#### Methods

##### `insert(key: number, value: T): void`
Inserts a key-value pair into the tree.

##### `lookup(key: number): T | null`
Retrieves the value associated with the given key.

##### `getAllKeys(): number[]`
Returns all keys in the tree in sorted order.

##### `generateMermaid(): string`
Generates a Mermaid diagram representing the tree structure.

##### `printAsciiTree(): void`
Prints an ASCII representation of the tree to the console.

##### `saveMermaidToFile(filename?: string): void`
Saves a Mermaid diagram to a Markdown file.

## Examples

### Complex Data Types

```typescript
interface User {
  name: string;
  age: number;
  data: number[];
}

const tree = new BPlusTree<User>();

tree.insert(1, {
  name: 'Alice',
  age: 30,
  data: [1, 2, 3]
});

tree.insert(2, {
  name: 'Bob',
  age: 25,
  data: [4, 5, 6]
});
```

### Visualization

```typescript
const tree = new BPlusTree<string>();

// Add some data
for (let i = 1; i <= 10; i++) {
  tree.insert(i, `value${i}`);
}

// Generate Mermaid diagram
const mermaid = tree.generateMermaid();
console.log(mermaid);

// Save to file
tree.saveMermaidToFile('my-tree.md');
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Development mode
npm run dev
```

## Algorithm Details

This implementation uses a B+ Tree with the following characteristics:

- **Order**: Configurable capacity (default: 4)
- **Leaf Level**: All data is stored in leaf nodes
- **Internal Nodes**: Contain only keys and child pointers
- **Balanced**: All leaf nodes are at the same level
- **Sorted**: Keys are maintained in sorted order

## Performance

- **Insert**: O(log n)
- **Lookup**: O(log n)
- **Range Queries**: O(log n + k) where k is the number of results

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this project helpful, please give it a ⭐️!

For issues and questions, please [open an issue](https://github.com/yourusername/bplus-tree/issues) on GitHub.
