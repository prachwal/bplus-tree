import { BaseNode } from './BaseNode.js';


export class LeafNode<T = unknown> extends BaseNode {
  keys: number[] = [];
  values: T[] = [];
  next: LeafNode<T> | null = null;

  constructor() {
    super(0);
  }
}
