export interface Feature {
  id: string;
  required?: boolean;
  prerequisites: string[];
  title: string;
  description: string;
}
