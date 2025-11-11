import { BaseNode } from './BaseNode';


export class InnerNode extends BaseNode {
  keys: number[] = [];
  children: BaseNode[] = [];

  constructor(level: number) {
    super(level);
  }
}
