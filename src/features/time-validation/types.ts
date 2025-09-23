export interface TimeValidationResult {
  entryId: number;
  issueId: string;
  togglDuration: number; // в секундах
  youtrackDuration: number; // в минутах
  togglDurationMinutes: number;
  youtrackDurationMinutes: number;
  isValid: boolean;
  errorMessage?: string;
  workItems: Array<{
    id: string;
    duration: number;
    text: string;
    date: number;
    author?: {
      id: string;
      login: string;
      name: string;
    };
  }>;
}

export interface ValidationError {
  entryId: number;
  issueId: string;
  message: string;
  severity: 'warning' | 'error';
}
