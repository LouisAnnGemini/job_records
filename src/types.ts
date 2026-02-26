export type RecordType = 'normal' | 'milestone' | 'todo';

export interface RecordItem {
  id: string;
  projectId: string;
  categoryId: string;
  title: string;
  content: string;
  type: RecordType;
  date?: string; // YYYY-MM-DD
  createdAt: number;
  order: number;
}

export interface Category {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  order: number;
}

export interface AppState {
  projects: Project[];
  categories: Category[];
  records: RecordItem[];
}
