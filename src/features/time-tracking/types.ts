import { TimeEntry } from 'shared/model';

export interface TimeEntriesListProps {
  timeEntries: TimeEntry[];
  loading: boolean;
  selectedDate: string;
  dateRange: string;
  transferredEntries: Set<number>;
  onDateChange: (date: string) => void;
  onTransfer: (entry: TimeEntry) => void;
  onRefresh: () => void;
}

export interface TimeEntryCardProps {
  entry: TimeEntry;
  isTransferred: boolean;
  formatDuration: (seconds: number) => string;
  formatTime: (dateString: string) => string;
  onTransfer: (entry: TimeEntry) => void;
}
