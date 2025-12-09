export const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const dateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  // Создаем копии дат для работы в локальном времени
  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);

  // Устанавливаем endDate на понедельник следующей недели (startDate + 7 дней)
  // Это гарантирует включение всего воскресенья, если API использует exclusive end_date
  // Если API использует inclusive end_date, это все равно включит воскресенье
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7);
  endDate.setHours(0, 0, 0, 0);

  // Форматируем даты в локальном времени, чтобы избежать сдвига из-за UTC
  return {
    startDate: dateToLocalString(startDate),
    endDate: dateToLocalString(endDate)
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
