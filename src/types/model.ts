export interface Model {
  id: string;
  reference: string;
  display_name?: string;
  display_version?: string;
  icon_url?: string;
  description?: string;
  created_at: number;
  updated_at: number;
  owner: string;
}
