export interface Tokens {
  togglToken: string;
  youtrackToken: string;
}

export interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  duration: number;
}

export interface WorkItem {
  date: number;
  duration: { minutes: number };
  text: string;
  author?: {
    id: string;
    login: string;
    name: string;
  };
}
