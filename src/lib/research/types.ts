export type ResearchDepth = 'QUICK' | 'STANDARD' | 'DEEP';

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  excerpt?: string;
  publishedDate?: string;
  retrievedAt?: string;
  score?: number;
}

export interface ResearchFinding {
  topic: string;
  insight: string;
  confidence: 'HIGH' | 'MEDIUM' | 'EMERGING';
  sources: string[]; // Source IDs such as S1, S2.
}

export interface ResearchReport {
  id: string;
  topic: string;
  objective?: string;
  depth: ResearchDepth;
  provider: string;
  synthesisMode: 'AI_SYNTHESIS' | 'EVIDENCE_ONLY';
  persisted: boolean;
  summary: string;
  keyFindings: ResearchFinding[];
  evidence: string[];
  sources: ResearchSource[];
  recommendations: string[];
  createdAt: string;
}

export interface ResearchProvider {
  name: string;
  search(query: string, maxResults?: number): Promise<Omit<ResearchSource, 'id'>[]>;
}
