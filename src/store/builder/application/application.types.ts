import { Application } from '@/types/application';

export interface ApplicationState {
  application?: Application;
  isLoading: boolean;
  error: string | null;
}
