import { describe, test, expect } from '@jest/globals';
import { BaseNode } from '../lib/bplus-tree';

// Przykładowe testy dla B-Plus Tree
describe('BaseNode', () => {
    test('powinien utworzyć węzeł bazowy z odpowiednim poziomem', () => {
        const node = new BaseNode(1);
        expect(node.level).toBe(1);
        expect(node.count).toBe(0);
        expect(node.isLeaf()).toBe(false);
    });

    test('powinien rozpoznać węzeł liści', () => {
        const leafNode = new BaseNode(0);
        expect(leafNode.isLeaf()).toBe(true);
    });
});
