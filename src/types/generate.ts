export interface GenerateParams {
  prompt?: string | null;
  model?: string | null;
  type?: GenerationType | null;
}

export enum GenerationType {
  Simple = 'simple',
  Universal = 'universal',
}
