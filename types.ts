export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  groundingSources?: GroundingSource[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ResearchArtifact {
  id: string;
  topic: string;
  content: string;
  status: 'idle' | 'streaming' | 'completed' | 'error';
  lastUpdated: number;
}

export enum SidebarState {
  HIDDEN = 'HIDDEN',
  VISIBLE = 'VISIBLE',
  EXPANDED = 'EXPANDED'
}