
import { format } from 'date-fns';

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number | null): string => {
  if (bytes === null) return 'N/A';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

/**
 * Format date for display
 */
export const formatDate = (date: string): string => {
  return format(new Date(date), 'MMM d, yyyy');
};
