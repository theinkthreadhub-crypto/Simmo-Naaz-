export type ResearchDepth = 'QUICK' | 'STANDARD' | 'DEEP';

export interface ResearchSource {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

export interface ResearchFinding {
  topic: string;
  insight: string;
  confidence: 'HIGH' | 'MEDIUM' | 'EMERGING';
  sources: string[]; // URLs
}

export interface ResearchReport {
  id: string;
  topic: string;
  objective?: string;
  depth: ResearchDepth;
  summary: string;
  keyFindings: ResearchFinding[];
  evidence: string[];
  sources: ResearchSource[];
  recommendations: string[];
  createdAt: string;
}

export interface ResearchProvider {
  name: string;
  search(query: string, maxResults?: number): Promise<ResearchSource[]>;
}
