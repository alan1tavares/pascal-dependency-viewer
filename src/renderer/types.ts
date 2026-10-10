/** Type definitions for renderer. */

export interface Project {
  projectUnits: string[];
  projectDir: string;
}

export interface GraphData {
  nodes: Array<{ id: string; label: string; group?: string }>;
  edges: Array<{ from: string; to: string; origin?: string }>;
}
