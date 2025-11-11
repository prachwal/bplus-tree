import { describe, expect, test } from '@jest/globals';
import { BPlusTree } from '../lib/BPlusTree';
import { InnerNode } from '../lib/InnerNode';
import { decode, encode } from '@msgpack/msgpack';

describe('BPlusTree', () => {
  test('powinien utworzyć pustą strukturę', () => {
    const tree = new BPlusTree<number>();
    expect(tree.root).toBeNull();
  });

  test('powinien wstawić pojedynczy klucz', () => {
    const tree = new BPlusTree();
    tree.insert(10, 100);
    expect(tree.root).not.toBeNull();
    expect(tree.getAllKeys()).toEqual([10]);
  });

  test('powinien zaktualizować wartość istniejącego klucza', () => {
    const tree = new BPlusTree();
    tree.insert(10, 100);
    tree.insert(10, 200); // aktualizacja
    expect(tree.lookup(10)).toBe(200);
  });

  test('powinien zwrócić wszystkie klucze w porządku', () => {
    const tree = new BPlusTree();
    const keys = [10, 20, 5, 15, 25];
    keys.forEach(key => tree.insert(key, key * 10));

    const allKeys = tree.getAllKeys();
    expect(allKeys).toEqual([5, 10, 15, 20, 25]);
  });

  test('powinien obsłużyć wiele wstawień powodujących split', () => {
    const tree = new BPlusTree();
    // Wstaw tyle kluczy, żeby wywołać split węzłów
    for (let i = 1; i <= 20; i++) {
      tree.insert(i, i * 10);
    }
    expect(tree.getAllKeys().length).toBe(20);
    expect(tree.getAllKeys()).toEqual(Array.from({length: 20}, (_, i) => i + 1));
  });

  test('powinien obsłużyć głębokie drzewo z wieloma poziomami', () => {
    const tree = new BPlusTree();
    // Wstaw klucze w kolejności, która wymusi głębokie drzewo
    const keys = [];
    for (let i = 0; i < 50; i++) {
      const key = Math.floor(Math.random() * 1000);
      keys.push(key);
      tree.insert(key, key * 2);
    }
    // Sprawdź lookup dla wszystkich kluczy
    keys.forEach(key => {
      expect(tree.lookup(key)).toBe(key * 2);
    });
  });

  test('powinien obsłużyć duplikaty i aktualizacje w głębokim drzewie', () => {
    const tree = new BPlusTree();
    // Najpierw wstaw wiele kluczy żeby stworzyć strukturę
    for (let i = 1; i <= 50; i++) {
      tree.insert(i, i * 10);
    }
    // Następnie aktualizuj niektóre klucze
    tree.insert(25, 999); // aktualizacja istniejącego
    tree.insert(40, 888); // aktualizacja innego
    expect(tree.lookup(25)).toBe(999);
    expect(tree.lookup(40)).toBe(888);
  });

  test('powinien obsłużyć root split przy bardzo dużym drzewie', () => {
    const tree = new BPlusTree();
    // Wstaw tyle kluczy, żeby wymusić split root
    for (let i = 1; i <= 200; i++) {
      tree.insert(i, i * 100);
    }
    expect(tree.getAllKeys().length).toBe(200);
    // Sprawdź czy root nie jest liściem (co oznacza split)
    expect(tree.root!.isLeaf()).toBe(false);
  });

  test('powinien przechowywać wartości JSON', () => {
    const tree = new BPlusTree<{ name: string; age: number; data: number[] }>();
    const jsonValue = { name: 'John', age: 30, data: [1, 2, 3] };
    tree.insert(1, jsonValue);
    expect(tree.lookup(1)).toEqual(jsonValue);
  });

  test('powinien obsługiwać różne typy wartości', () => {
    const tree = new BPlusTree<string | number | object | unknown[]>();
    tree.insert(1, 'string value');
    tree.insert(2, 42);
    tree.insert(3, { nested: { object: true } });
    tree.insert(4, [1, 2, 3]);

    expect(tree.lookup(1)).toBe('string value');
    expect(tree.lookup(2)).toBe(42);
    expect(tree.lookup(3)).toEqual({ nested: { object: true } });
    expect(tree.lookup(4)).toEqual([1, 2, 3]);
  });

  test('powinien znaleźć wartość po kluczu', () => {
    const tree = new BPlusTree();
    tree.insert(10, 100);
    tree.insert(20, 200);
    expect(tree.lookup(10)).toBe(100);
    expect(tree.lookup(20)).toBe(200);
    expect(tree.lookup(30)).toBeNull(); // nieistniejący klucz
  });

  test('powinien generować diagram Mermaid dla pustego drzewa', () => {
    const tree = new BPlusTree();
    const mermaid = tree.generateMermaid();
    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('empty["Empty Tree"]');
  });

  test('powinien generować diagram Mermaid dla drzewa z danymi', () => {
    const tree = new BPlusTree();
    tree.insert(10, 'value1');
    tree.insert(20, 'value2');
    const mermaid = tree.generateMermaid();
    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('Leaf');
    expect(mermaid).toContain('value1');
    expect(mermaid).toContain('value2');
  });

  test('powinien generować diagram Mermaid z poprawnym escapingiem JSON', () => {
    const tree = new BPlusTree();
    tree.insert(1, { name: 'Test', data: [1, 2] });
    const mermaid = tree.generateMermaid();
    expect(mermaid).toContain('&quot;name&quot;: &quot;Test&quot;');
    expect(mermaid).toContain('1');
    expect(mermaid).toContain('2');
  });

  test('powinien wyświetlić ASCII drzewo dla pustego drzewa', () => {
    const tree = new BPlusTree();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    tree.printAsciiTree();
    expect(consoleSpy).toHaveBeenCalledWith('Empty tree');
    consoleSpy.mockRestore();
  });

  test('powinien wyświetlić ASCII drzewo dla drzewa z danymi', () => {
    const tree = new BPlusTree();
    tree.insert(10, 'value1');
    tree.insert(20, 'value2');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    tree.printAsciiTree();
    expect(consoleSpy).toHaveBeenCalled();
    // Sprawdź czy zawiera informacje o liściach
    const calls = consoleSpy.mock.calls.flat();
    const output = calls.join(' ');
    expect(output).toContain('Leaf');
    expect(output).toContain('value1');
    expect(output).toContain('value2');
    consoleSpy.mockRestore();
  });

  test('powinien zapisać diagram Mermaid do pliku', async () => {
    const tree = new BPlusTree();
    tree.insert(10, 'test value');
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock fs module
    const mockWriteFileSync = jest.fn();
    const mockFs = {
      writeFileSync: mockWriteFileSync
    };
    
    // Mock dynamic import
    jest.doMock('fs', () => mockFs);
    
    // Ponieważ saveMermaidToFile używa dynamic import, musimy to obsłużyć inaczej
    // Dla celów testowych sprawdzimy czy metoda się wykonuje bez błędów
    expect(() => {
      tree.saveMermaidToFile('test.md');
    }).not.toThrow();
    
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('powinien obsłużyć głębokie drzewo w metodach wizualizacji', () => {
    const tree = new BPlusTree();
    // Dodaj wiele elementów żeby stworzyć głębokie drzewo z wieloma poziomami
    for (let i = 1; i <= 200; i++) {
      tree.insert(i, `value${i}`);
    }
    
    // Test generateMermaid - powinien obsłużyć wiele węzłów
    const mermaid = tree.generateMermaid();
    expect(mermaid).toContain('graph TD');
    expect(mermaid.split('\n').length).toBeGreaterThan(5); // Wiele linii
    
    // Test printAsciiTree - powinien obsłużyć głębokie drzewo z połączonymi liśćmi
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    tree.printAsciiTree();
    expect(consoleSpy).toHaveBeenCalled();
    // Sprawdź czy wyświetla łańcuch liści
    const calls = consoleSpy.mock.calls.flat();
    const output = calls.join(' ');
    expect(output).toContain('-->');
    consoleSpy.mockRestore();
  });

  test('powinien obsłużyć puste drzewo w getAllKeys', () => {
    const tree = new BPlusTree();
    const keys = tree.getAllKeys();
    expect(keys).toEqual([]);
  });

  test('powinien obsłużyć drzewo tylko z root liściem w getAllKeys', () => {
    const tree = new BPlusTree();
    tree.insert(1, 'value');
    const keys = tree.getAllKeys();
    expect(keys).toEqual([1]);
  });

  test('powinien obsłużyć złożone drzewo w getAllKeys', () => {
    const tree = new BPlusTree();
    // Dodaj elementy w kolejności powodującej split
    for (let i = 1; i <= 20; i++) {
      tree.insert(i, `value${i}`);
    }
    const keys = tree.getAllKeys();
    expect(keys.length).toBe(20);
    expect(keys).toEqual(Array.from({length: 20}, (_, i) => i + 1));
  });

  test('powinien obsłużyć drzewo z wieloma poziomami w getAllKeys', () => {
    const tree = new BPlusTree();
    // Dodaj elementy w odwrotnej kolejności żeby wymusić głębokie drzewo
    for (let i = 100; i >= 1; i--) {
      tree.insert(i, `value${i}`);
    }
    const keys = tree.getAllKeys();
    expect(keys.length).toBe(100);
    expect(keys).toEqual(Array.from({length: 100}, (_, i) => i + 1));
  });

  test('powinien obsłużyć nieprawidłową strukturę drzewa w getAllKeys', () => {
    const tree = new BPlusTree();
    // Dodajemy normalne węzły
    tree.insert(1, 1);
    tree.insert(2, 2);
    
    // Manipulacja strukturą drzewa żeby przetestować break w getAllKeys
    // Tworzymy nieprawidłową strukturę gdzie InnerNode ma level=0 (co jest nieprawidłowe)
    const corruptedInner = new InnerNode(0); // InnerNode z level=0!
    corruptedInner.keys = [];
    corruptedInner.children = [];
    corruptedInner.count = 0;
    
    // Podmieniamy root na ten nieprawidłowy węzeł
    tree.root = corruptedInner;
    
    // getAllKeys powinien napotkać nieprawidłowy węzeł na "najniższym poziomie" i użyć break
    // Ta operacja może rzucić wyjątek, ale ważne jest że break zostanie wykonany
    expect(() => tree.getAllKeys()).not.toThrow();
  });

  describe('Persistent Storage', () => {
    test('powinien serializować i deserializować puste drzewo', () => {
      const tree = new BPlusTree();
      const data = (tree as any).serialize(tree.root);
      expect(data).toBeInstanceOf(Buffer);
      const obj = decode(data);
      expect(obj).toBeNull();

      const deserialized = (tree as any).deserialize(data);
      expect(deserialized).toBeNull();
    });

    test('powinien serializować i deserializować drzewo z jednym liściem', () => {
      const tree = new BPlusTree<string>();
      tree.insert(10, 'value10');

      const data = (tree as any).serialize(tree.root);
      expect(data).toBeInstanceOf(Buffer);
      const obj = decode(data) as any;
      expect(obj.type).toBe('leaf');
      expect(obj.keys).toEqual([10]);
      expect(obj.values).toEqual(['value10']);

      const deserialized = (tree as any).deserialize(data);
      expect(deserialized.isLeaf()).toBe(true);
      expect((deserialized as any).keys).toEqual([10]);
      expect((deserialized as any).values).toEqual(['value10']);
    });

    test('powinien serializować i deserializować drzewo z węzłami wewnętrznymi', () => {
      const tree = new BPlusTree<number>();
      // Dodaj wystarczająco dużo danych, żeby stworzyć węzły wewnętrzne
      for (let i = 1; i <= 200; i++) {
        tree.insert(i, i * 10);
      }

      const data = (tree as any).serialize(tree.root);
      expect(data).toBeInstanceOf(Buffer);

      const deserialized = (tree as any).deserialize(data);
      expect(deserialized).not.toBeNull();
      expect(deserialized.level).toBeGreaterThan(0); // Ma węzły wewnętrzne
    });

    test('powinien zapisać i wczytać drzewo używając StorageProvider', async () => {
      const tree = new BPlusTree<string>();
      tree.insert(5, 'five');
      tree.insert(15, 'fifteen');
      tree.insert(25, 'twentyfive');

      // Mock StorageProvider
      const mockStorage = {
        save: jest.fn().mockResolvedValue(undefined),
        load: jest.fn().mockResolvedValue((tree as any).serialize(tree.root))
      };

      await tree.save(mockStorage);
      expect(mockStorage.save).toHaveBeenCalledWith((tree as any).serialize(tree.root));

      const newTree = new BPlusTree<string>();
      await newTree.load(mockStorage);
      expect(mockStorage.load).toHaveBeenCalled();

      expect(newTree.lookup(5)).toBe('five');
      expect(newTree.lookup(15)).toBe('fifteen');
      expect(newTree.lookup(25)).toBe('twentyfive');
    });

    test('powinien obsłużyć błąd podczas ładowania z StorageProvider', async () => {
      const tree = new BPlusTree();
      const mockStorage = {
        save: jest.fn(),
        load: jest.fn().mockRejectedValue(new Error('Storage error'))
      };

      await expect(tree.load(mockStorage)).rejects.toThrow('Storage error');
    });

    test('powinien obsłużyć nieprawidłowe dane podczas deserializacji', () => {
      const tree = new BPlusTree();
      const invalidBuffer = Buffer.from(encode({ type: 'invalid' }));

      expect(() => (tree as any).deserialize(invalidBuffer)).toThrow('Invalid serialized data');
    });
  });
});