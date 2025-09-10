export interface Application {
  name?: string;
  application?: string;
  icon_url?: string;
  reference: string;
  application_properties: {
    mindmap_folder: string;
  } | null;
  display_name?: string;
}
