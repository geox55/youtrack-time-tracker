export const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const createDateAtStartOfWeek = (dateString: string): Date => {
  const baseDate = new Date(dateString);
  const startOfWeek = new Date(baseDate);
  const dayOfWeek = baseDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(baseDate.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

export const getWeekRange = (selectedDate: Date): { startDate: string; endDate: string } => {
  const startDate = selectedDate;

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate: dateToString(startDate),
    endDate: dateToString(endDate)
  };
};

export const formatDateRange = (selectedDate: Date): string => {
  const startDate = selectedDate;

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}ч ${minutes}мин`;
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const roundToNearest5Minutes = (minutes: number): number => {
  return Math.round(minutes / 5) * 5;
};
