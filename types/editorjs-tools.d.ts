declare module '@editorjs/raw' {
  import { BlockTool } from '@editorjs/editorjs';
  
  export default class RawTool implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(block: HTMLElement): any;
    static get toolbox(): {
      title: string;
      icon: string;
    };
  }
}

declare module '@editorjs/embed' {
  import { BlockTool } from '@editorjs/editorjs';
  
  export default class Embed implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(block: HTMLElement): any;
    static get toolbox(): {
      title: string;
      icon: string;
    };
  }
}

declare module '@editorjs/delimiter' {
  import { BlockTool } from '@editorjs/editorjs';
  
  export default class Delimiter implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(block: HTMLElement): any;
    static get toolbox(): {
      title: string;
      icon: string;
    };
  }
}
