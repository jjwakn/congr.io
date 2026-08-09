export interface Feature {
  id: string;
  parent?: string;
  required?: boolean;
  prerequisites: string[];
  title: string;
  description: string;
}
