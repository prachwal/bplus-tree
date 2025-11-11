import { InnerNode } from './InnerNode.js';


export class BaseNode {
  level: number;
  count: number = 0;

  constructor(level: number) {
    this.level = level;
  }

  isLeaf(): boolean {
    return this.level === 0;
  }

  isInner(): this is InnerNode {
    return this.level > 0;
  }
}
