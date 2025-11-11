# B+ Tree TypeScript Library - AI Coding Guidelines

## Architecture Overview
This is a TypeScript implementation of a B+ Tree data structure with persistent storage capabilities. Key components:
- **Core Classes** (`src/lib/bplus-tree.ts`): `BPlusTree<T>`, `BaseNode`, `InnerNode`, `LeafNode` - tree structure with configurable capacity (default 100)
- **Storage Interface** (`StorageProvider`): Pluggable persistence layer for files/Redis
- **Examples** (`src/examples/`): File-based and Redis-based storage implementations
- **Tests** (`src/__tests__/`): Comprehensive Jest tests with 96%+ coverage

Data flows from user operations (insert/lookup) through tree traversal to storage providers for persistence.

## Critical Developer Workflows
- **Build**: `npm run build` compiles TypeScript to `dist/` using `tsc`
- **Test**: `npm run test` runs Jest tests; `npm run test:coverage` for coverage report
- **Start**: `npm start` runs example from `dist/main.js`
- **Version Check**: `npm run check-version` validates version > published before publish
- **Publish**: `npm run prepublishOnly` builds, tests, and checks version
- **Redis Setup**: `docker run -d --name redis -p 6379:6379 redis` for Redis examples

## Project-Specific Conventions
- **Capacity Parameter**: Constructor accepts `capacity` (default 100) - affects tree height/performance
- **Storage Abstraction**: Use `StorageProvider` interface for persistence; avoid direct file/Redis calls in core logic
- **Serialization**: Tree serializes to JSON/MessagePack via `serialize()`/`deserialize()` methods
- **Error Handling**: Throw descriptive errors for invalid operations (e.g., "Invalid serialized data")
- **Testing**: Mock `StorageProvider` for unit tests; use `jest.spyOn(console, 'log')` for output tests
- **Imports**: ES modules with `.js` extensions in imports (e.g., `from '../lib/bplus-tree.js'`)

## Integration Points
- **File Storage**: `FileStorageProvider` uses `fs/promises` for JSON persistence
- **Redis Storage**: `RedisStorageProvider` uses `redis` package for key-value storage
- **Visualization**: Mermaid diagrams escape JSON values with `&quot;` for HTML compatibility
- **External Dependencies**: `redis` for Redis examples; `fs` for file operations

## Key Files to Reference
- `src/lib/bplus-tree.ts`: Core implementation and patterns
- `src/examples/persistent-storage-example.ts`: File storage usage
- `src/examples/redis-persistent-storage-example.ts`: Redis storage usage
- `src/__tests__/BPlusTree.test.ts`: Testing patterns and edge cases
- `OPTIMIZATION_PLAN.md`: Performance considerations and capacity tuning