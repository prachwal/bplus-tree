import { BaseNode } from './BaseNode';


export class LeafNode<T = unknown> extends BaseNode {
  keys: number[] = [];
  values: T[] = [];
  next: LeafNode<T> | null = null;

  constructor() {
    super(0);
  }
}
