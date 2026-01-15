export enum ToolCategory {
  TEXT = 'Text Tools',
  DEV = 'Developer Tools',
  SECURITY = 'Security Tools'
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
  path: string;
}
