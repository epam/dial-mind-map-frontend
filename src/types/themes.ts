export interface Theme {
  displayName: string;
  colors: Record<string, string>;
  'app-logo': string;
  'font-family'?: string;
  'font-codeblock'?: string;
  'code-editor-theme'?: string;
  id: string;
}

export interface ThemesConfigs {
  themes: Theme[];
  images: {
    'default-model': string;
    'default-addon': string;
    favicon: string;
  };
}
