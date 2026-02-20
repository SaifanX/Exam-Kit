
export interface ScheduleItem {
  time: string;
  activity: string;
  isHighlighted: boolean;
  fuel?: string;
}

export interface SubjectBreakdown {
  topic: string;
  marks: number;
}

export interface SubjectIntel {
  id: string;
  name: string;
  totalMarks: number;
  strategy: string;
  topics: SubjectBreakdown[];
}

export interface CombatCard {
  id: string;
  subjectId: string;
  title: string;
  summary: string[];
  criticalFormulas: string[];
  traps: string[];
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface UserProfile {
  username: string;
  lastSync?: number;
}

export type TabType = 'DASHBOARD' | 'SCHEDULE' | 'DECKS' | 'INTEL' | 'FOCUS' | 'CHAT' | 'SEARCH';
