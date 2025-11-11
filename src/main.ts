import { BPlusTree } from './lib/BPlusTree.js';

// ==================== PRZYKŁAD UŻYCIA ====================

const tree = new BPlusTree<unknown>();
const keysToInsert = [10, 20, 5, 6, 12, 30, 7, 17, 25, 15, 1, 2, 3, 4, 8, 9, 11, 13, 14, 16];

keysToInsert.forEach((key, index) => {
  if (index % 3 === 0) {
    tree.insert(key, { name: `User${index}`, data: [index, index * 2] });
  } else if (index % 3 === 1) {
    tree.insert(key, `String value ${index}`);
  } else {
    tree.insert(key, index * 10);
  }
});

console.log("Wszystkie klucze:", tree.getAllKeys());
console.log("\nLookup 12:", tree.lookup(12));

console.log("\n--- ASCII TREE ---");
tree.printAsciiTree();

console.log("\n--- MERMAID (wklej do https://mermaid.live) ---");
console.log(tree.generateMermaid());

// Zapisz diagram do pliku
tree.saveMermaidToFile('bplus-tree-diagram.md');