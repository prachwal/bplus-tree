import { encode, decode } from '@msgpack/msgpack';
import { StorageProvider } from './StorageProvider.js';
import { BaseNode } from './BaseNode.js';
import { InnerNode } from './InnerNode.js';
import { LeafNode } from './LeafNode.js';

export class BPlusTree<T = unknown> {
  root: BaseNode | null = null;
  private readonly capacity: number;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
  }

  insert(key: number, value: T): void {
    if (!this.root) {
      const leaf = new LeafNode<T>();
      leaf.keys = [key];
      leaf.values = [value];
      leaf.count = 1;
      this.root = leaf;
      return;
    }

    const result = this._insert(this.root, key, value);
    if (result) {
      const newRoot = new InnerNode(this.root.level + 1);
      newRoot.children = [this.root, result.node];
      newRoot.keys = [result.separatorKey];
      newRoot.count = newRoot.children.length;
      this.root = newRoot;
    }
  }

  private _insert(node: BaseNode, key: number, value: T): { node: BaseNode; separatorKey: number } | null {
    if (node.isLeaf()) {
      const leaf = node as LeafNode<T>;
      const pos = this.lowerBound(leaf.keys, key);

      if (pos < leaf.keys.length && leaf.keys[pos] === key) {
        leaf.values[pos] = value; // update
        return null;
      }

      leaf.keys.splice(pos, 0, key);
      leaf.values.splice(pos, 0, value);
      leaf.count++;

      if (leaf.count <= this.capacity) {
        return null;
      }

      // Split liścia
      const mid = Math.floor((leaf.count + 1) / 2); // klasyczna formuła B+ (kopiujemy klucz w górę)
      const newLeaf = new LeafNode<T>();
      newLeaf.keys = leaf.keys.splice(mid);
      newLeaf.values = leaf.values.splice(mid);
      newLeaf.count = leaf.count - mid;
      leaf.count = mid;

      newLeaf.next = leaf.next;
      leaf.next = newLeaf;

      return { node: newLeaf, separatorKey: newLeaf.keys[0] };
    } else {
      // node.isInner() – type guard
      const inner = node as InnerNode;
      const pos = this.lowerBound(inner.keys, key);
      let childIndex = pos;
      if (pos < inner.keys.length && inner.keys[pos] === key) {
        childIndex = pos + 1;
      }
      const child = inner.children[childIndex];
      const result = this._insert(child, key, value);

      if (result) {
        inner.keys.splice(childIndex, 0, result.separatorKey);
        inner.children.splice(childIndex + 1, 0, result.node);
        inner.count = inner.children.length;

        if (inner.keys.length <= this.capacity) {
          return null;
        }

        // Split inner
        const mid = Math.floor(inner.keys.length / 2);
        const separatorKey = inner.keys[mid];

        const newInner = new InnerNode(inner.level);
        newInner.keys = inner.keys.splice(mid + 1);
        newInner.children = inner.children.splice(mid + 1);
        newInner.count = newInner.children.length;
        inner.count = inner.children.length;

        return { node: newInner, separatorKey };
      }
      return null;
    }
  }

  lookup(key: number): T | null {
    if (!this.root) return null;

    let node: BaseNode | null = this.root;
    while (node && node.isInner()) {
      const inner = node as InnerNode;
      const pos = this.lowerBound(inner.keys, key);
      let childIndex = pos;
      if (pos < inner.keys.length && inner.keys[pos] === key) {
        childIndex = pos + 1;
      }
      node = inner.children[childIndex];
    }

    if (!node || !node.isLeaf()) return null;
    const leaf = node as LeafNode<T>;
    const pos = this.lowerBound(leaf.keys, key);
    if (pos < leaf.keys.length && leaf.keys[pos] === key) {
      return leaf.values[pos];
    }
    return null;
  }

  private lowerBound(keys: number[], key: number): number {
    let low = 0;
    let high = keys.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (keys[mid] < key) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  getAllKeys(): number[] {
    if (!this.root) return [];
    const result: number[] = [];
    let leaf: BaseNode | null = this.root;
    while (leaf && leaf.isInner()) {
      leaf = (leaf as InnerNode).children[0];
    }
    while (leaf) {
      if (leaf.isLeaf()) {
        result.push(...(leaf as LeafNode<T>).keys);
        leaf = (leaf as LeafNode<T>).next;
      } else {
        break;
      }
    }
    return result;
  }

  // ------------------- WIZUALIZACJA -------------------

  generateMermaid(): string {
    const lines: string[] = ['graph TD'];
    let nodeCounter = 0;
    const nodeMap = new Map<BaseNode, string>();
    const leafList: LeafNode<T>[] = [];

    const traverse = (node: BaseNode | null): string | null => {
      if (!node) return null;

      const myId = `n${nodeCounter++}`;
      nodeMap.set(node, myId);

      if (node.isLeaf()) {
        const leaf = node as LeafNode<T>;
        const keyStr = leaf.keys.join(' / ');
        const valueStr = leaf.values.map(v => {
          if (typeof v === 'object' && v !== null) {
            // Escape cudzysłowów dla Mermaid
            return JSON.stringify(v, null, 2).replace(/"/g, '&quot;');
          }
          return String(v);
        }).join(' / ');
        lines.push(`    ${myId}("Leaf\\n${keyStr}\\n${valueStr}")`);
        leafList.push(leaf);
      } else {
        const inner = node as InnerNode;
        const keyStr = inner.keys.join(', ');
        lines.push(`    ${myId}[\"Inner lvl ${node.level}\\n${keyStr}\"]`);
      }

      if (node.isInner()) {
        const inner = node as InnerNode;
        inner.children.forEach((child, i) => {
          const childId = traverse(child);
          if (childId) {
            const label = i === 0 ? '' : inner.keys[i - 1];
            const edge = label ? `-- "${label}" -->` : '-->';
            lines.push(`    ${myId} ${edge} ${childId}`);
          }
        });
      }

      return myId;
    };

    if (this.root) {
      traverse(this.root);

      for (let i = 0; i < leafList.length - 1; i++) {
        const cur = nodeMap.get(leafList[i]);
        const nxt = nodeMap.get(leafList[i + 1]);
        if (cur && nxt) {
          lines.push(`    ${cur} -. "next" .-> ${nxt}`);
        }
      }
    } else {
      lines.push('    empty["Empty Tree"]');
    }

    return lines.join('\n');
  }

  // Metoda zapisująca diagram Mermaid do pliku
  saveMermaidToFile(filename: string = 'tree-diagram.md'): void {
    const mermaidContent = `# BPlusTree Diagram\n\n\`\`\`mermaid\n${this.generateMermaid()}\n\`\`\``;

    // W ES module używamy dynamic import
    import('fs').then(fs => {
      try {
        fs.writeFileSync(filename, mermaidContent, 'utf8');
        console.log(`Diagram Mermaid zapisany do pliku: ${filename}`);
      } catch (error) {
        console.error('Błąd podczas zapisywania pliku:', error);
      }
    }).catch(error => {
      console.error('Błąd importowania fs:', error);
    });
  }

  printAsciiTree(): void {
    if (!this.root) {
      console.log("Empty tree");
      return;
    }

    const lines: string[] = [];

    const build = (node: BaseNode, prefix: string = '', isLast: boolean = true) => {
      const marker = isLast ? '└── ' : '├── ';

      if (node.isLeaf()) {
        const leaf = node as LeafNode<T>;
        const valuesStr = leaf.values.map(v => JSON.stringify(v)).join(', ');
        lines.push(`${prefix}${marker}Leaf: keys=[${leaf.keys.join(', ')}], values=[${valuesStr}]`);
      } else {
        const inner = node as InnerNode;
        lines.push(`${prefix}${marker}Inner lvl ${node.level}: keys=[${inner.keys.join(', ')}]`);
      }

      if (node.isInner()) {
        const inner = node as InnerNode;
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        inner.children.forEach((child, i) => {
          build(child, newPrefix, i === inner.children.length - 1);
        });
      }
    };

    build(this.root);
    console.log(lines.join('\n'));

    console.log("\nLeaf chain:");
    let leaf: BaseNode | null = this.root;
    while (leaf && leaf.isInner()) {
      leaf = (leaf as InnerNode).children[0];
    }
    const chain: string[] = [];
    while (leaf) {
      if (leaf.isLeaf()) {
        const l = leaf as LeafNode<T>;
        const valuesStr = l.values.map(v => JSON.stringify(v)).join(', ');
        chain.push(`[${l.keys.join(', ')}: ${valuesStr}]`);
        leaf = l.next;
      } else {
        break;
      }
    }
    console.log(chain.join(' --> ') + ' --> null');
  }

  // Persistent storage methods using provider
  async save(storage: StorageProvider): Promise<void> {
    const data = this.serialize(this.root);
    await storage.save(data);
  }

  async load(storage: StorageProvider): Promise<void> {
    const data = await storage.load();
    this.root = this.deserialize(data);
  }

  private serialize(node: BaseNode | null): Buffer {
    const obj = this.serializeToObject(node);
    return Buffer.from(encode(obj));
  }

  private deserialize(data: Buffer): BaseNode | null {
    const obj = decode(data) as any;
    return this.deserializeFromObject(obj);
  }

  private serializeToObject(node: BaseNode | null): any {
    if (!node) return null;
    if (node.isLeaf()) {
      const leaf = node as LeafNode<T>;
      return {
        type: 'leaf',
        keys: leaf.keys,
        values: leaf.values,
        // next is ignored for simplicity
      };
    } else {
      const inner = node as InnerNode;
      return {
        type: 'inner',
        level: inner.level,
        keys: inner.keys,
        children: inner.children.map(child => this.serializeToObject(child)),
      };
    }
  }

  private deserializeFromObject(data: any): BaseNode | null {
    if (!data) return null;
    if (data.type === 'leaf') {
      const leaf = new LeafNode<T>();
      leaf.keys = data.keys;
      leaf.values = data.values;
      leaf.count = data.keys.length;
      return leaf;
    } else if (data.type === 'inner') {
      const inner = new InnerNode(data.level);
      inner.keys = data.keys;
      inner.children = data.children.map((childData: any) => this.deserializeFromObject(childData));
      inner.count = inner.keys.length;
      return inner;
    }
    throw new Error('Invalid serialized data');
  }
}