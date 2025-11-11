import { BaseNode } from './BaseNode.js';


export class InnerNode extends BaseNode {
  keys: number[] = [];
  children: BaseNode[] = [];

  constructor(level: number) {
    super(level);
  }
}
