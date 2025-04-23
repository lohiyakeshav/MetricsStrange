import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date with various options
 * @param dateInput Date to format (string, number, or Date object)
 * @param format The format to use: 'short', 'medium', 'long', 'full', 'numeric', 'custom'
 * @param customFormat Optional format string for custom format (e.g., 'yyyy-MM-dd')
 * @returns Formatted date string
 */
export function formatDate(
  dateInput: string | number | Date,
  format: 'short' | 'medium' | 'long' | 'full' | 'numeric' | 'custom' = 'medium',
  customFormat?: string
): string {
  try {
    // Convert to Date object if not already
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return 'Invalid date';
    }
    
    // Format based on specified format
    switch (format) {
      case 'short':
        return date.toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric' 
        });
      
      case 'medium':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      
      case 'long':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      
      case 'full':
        return date.toLocaleDateString(undefined, { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      
      case 'numeric':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
      
      case 'custom':
        if (!customFormat) return date.toISOString();
        
        return customFormat
          .replace('yyyy', date.getFullYear().toString())
          .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
          .replace('dd', date.getDate().toString().padStart(2, '0'))
          .replace('HH', date.getHours().toString().padStart(2, '0'))
          .replace('mm', date.getMinutes().toString().padStart(2, '0'))
          .replace('ss', date.getSeconds().toString().padStart(2, '0'));
      
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error formatting date';
  }
}

/**
 * Format a date relative to the current time (e.g., "5 days ago")
 * @param dateInput Date to format (string, number, or Date object)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateInput: string | number | Date): string {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    
    // Define time intervals in seconds
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    
    // Format based on time difference
    if (diffInSeconds < 30) {
      return 'just now';
    } else if (diffInSeconds < minute) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < week) {
      const days = Math.floor(diffInSeconds / day);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < month) {
      const weeks = Math.floor(diffInSeconds / week);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < year) {
      const months = Math.floor(diffInSeconds / month);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / year);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Error formatting date';
  }
}

/**
 * Format a timestamp into a human-readable time string
 * @param timestamp Timestamp to format (string, number, or Date object)
 * @param includeSeconds Whether to include seconds in the output
 * @returns Formatted time string (e.g., "14:30" or "14:30:45")
 */
export function formatTime(
  timestamp: string | number | Date,
  includeSeconds: boolean = false
): string {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return 'Invalid time';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {})
    };
    
    return date.toLocaleTimeString(undefined, options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Error formatting time';
  }
}

/**
 * Get start and end dates for different time periods
 * @param period The time period ('day', 'week', 'month', 'quarter', 'year')
 * @param date Optional reference date (defaults to current date)
 * @returns Object with start and end dates for the period
 */
export function getTimePeriod(
  period: 'day' | 'week' | 'month' | 'quarter' | 'year',
  date: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);
  
  // Reset time to start of day
  start.setHours(0, 0, 0, 0);
  
  // Set end time to end of day
  end.setHours(23, 59, 59, 999);
  
  switch (period) {
    case 'day':
      // Already set correctly
      break;
    
    case 'week':
      // Start: First day of week (Sunday)
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      
      // End: Last day of week (Saturday)
      end.setDate(start.getDate() + 6);
      break;
    
    case 'month':
      // Start: First day of month
      start.setDate(1);
      
      // End: Last day of month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    
    case 'quarter':
      // Determine current quarter (0-3)
      const quarter = Math.floor(start.getMonth() / 3);
      
      // Start: First day of the quarter
      start.setMonth(quarter * 3);
      start.setDate(1);
      
      // End: Last day of the quarter
      end.setMonth(quarter * 3 + 3);
      end.setDate(0);
      break;
    
    case 'year':
      // Start: First day of year
      start.setMonth(0);
      start.setDate(1);
      
      // End: Last day of year
      end.setMonth(11);
      end.setDate(31);
      break;
  }
  
  return { start, end };
}

/**
 * Compare two dates
 * @param date1 First date to compare
 * @param date2 Second date to compare (defaults to current date)
 * @param precision Precision for comparison ('year', 'month', 'day', 'hour', 'minute', 'second')
 * @returns -1 if date1 < date2, 0 if dates are equal at specified precision, 1 if date1 > date2
 */
export function compareDates(
  date1: string | number | Date,
  date2: string | number | Date = new Date(),
  precision: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' = 'day'
): number {
  try {
    // Convert to Date objects
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    
    // Check if dates are valid
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      console.error('Invalid date(s):', { date1, date2 });
      return 0;
    }
    
    // Based on precision, compare date components
    switch (precision) {
      case 'year':
        return d1.getFullYear() - d2.getFullYear();
      
      case 'month':
        const yearDiff = d1.getFullYear() - d2.getFullYear();
        if (yearDiff !== 0) return yearDiff;
        return d1.getMonth() - d2.getMonth();
      
      case 'day':
        // Compare as dates only (ignore time)
        const d1Date = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
        const d2Date = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
        return d1Date.getTime() - d2Date.getTime();
      
      case 'hour':
        const dayDiff = compareDates(d1, d2, 'day');
        if (dayDiff !== 0) return dayDiff;
        return d1.getHours() - d2.getHours();
      
      case 'minute':
        const hourDiff = compareDates(d1, d2, 'hour');
        if (hourDiff !== 0) return hourDiff;
        return d1.getMinutes() - d2.getMinutes();
      
      case 'second':
        const minuteDiff = compareDates(d1, d2, 'minute');
        if (minuteDiff !== 0) return minuteDiff;
        return d1.getSeconds() - d2.getSeconds();
      
      default:
        return d1.getTime() - d2.getTime();
    }
  } catch (error) {
    console.error('Error comparing dates:', error);
    return 0;
  }
}

/**
 * Format a date range
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @param format Format to use for the dates
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | number | Date,
  endDate: string | number | Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  try {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date range:', { startDate, endDate });
      return 'Invalid date range';
    }
    
    const startFormatted = formatDate(start, format);
    const endFormatted = formatDate(end, format);
    
    // If same date, return single date
    if (start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate()) {
      return startFormatted;
    }
    
    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Error formatting date range';
  }
}

interface DateDifference {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
}

/**
 * Calculate the difference between two dates
 * @param startDate Start date
 * @param endDate End date (defaults to current date)
 * @returns Object containing the difference in various units
 */
export function getDateDifference(
  startDate: string | number | Date,
  endDate: string | number | Date = new Date()
): DateDifference {
  try {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date(s) for difference calculation:', { startDate, endDate });
      return {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalDays: 0
      };
    }
    
    // Ensure end date is later than start date
    const actualStart = start <= end ? start : end;
    const actualEnd = start <= end ? end : start;
    
    // Calculate difference in milliseconds
    const diffMs = actualEnd.getTime() - actualStart.getTime();
    
    // Calculate individual time components
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const totalDays = Math.floor(hours / 24);
    
    // Calculate years, months and remaining days
    let years = actualEnd.getFullYear() - actualStart.getFullYear();
    let months = actualEnd.getMonth() - actualStart.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Check if day of month is earlier
    let days = actualEnd.getDate() - actualStart.getDate();
    if (days < 0) {
      // Get last day of previous month for end date
      const lastDayOfMonth = new Date(
        actualEnd.getFullYear(), 
        actualEnd.getMonth(), 
        0
      ).getDate();
      
      days += lastDayOfMonth;
      months--;
      
      if (months < 0) {
        years--;
        months += 12;
      }
    }
    
    // Calculate remaining hours, minutes, seconds
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    return {
      years,
      months,
      days,
      hours: remainingHours,
      minutes: remainingMinutes,
      seconds: remainingSeconds,
      totalDays
    };
  } catch (error) {
    console.error('Error calculating date difference:', error);
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0
    };
  }
}

/**
 * Add a specified amount of time to a date
 * @param date The base date to add to
 * @param amount Amount to add
 * @param unit Unit of time to add ('years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds')
 * @returns New date with added time
 */
export function addToDate(
  date: string | number | Date,
  amount: number,
  unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds'
): Date {
  try {
    const result = date instanceof Date ? new Date(date) : new Date(date);
    
    if (isNaN(result.getTime())) {
      console.error('Invalid date for addition:', date);
      return new Date();
    }
    
    switch (unit) {
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
      
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      
      case 'weeks':
        result.setDate(result.getDate() + (amount * 7));
        break;
      
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
    }
    
    return result;
  } catch (error) {
    console.error('Error adding to date:', error);
    return new Date();
  }
}

/**
 * Format a date to ISO string with options
 * @param date Date to format
 * @param includeTime Whether to include time in the output
 * @param includeTimezone Whether to include timezone information
 * @returns Formatted ISO date string
 */
export function formatISODate(
  date: string | number | Date,
  includeTime: boolean = true,
  includeTimezone: boolean = true
): string {
  try {
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) {
      console.error('Invalid date for ISO formatting:', date);
      return 'Invalid date';
    }
    
    if (!includeTime) {
      // Return YYYY-MM-DD format
      return d.toISOString().split('T')[0];
    }
    
    if (!includeTimezone) {
      // Return YYYY-MM-DDTHH:MM:SS format without timezone
      return d.toISOString().split('.')[0];
    }
    
    // Return full ISO string
    return d.toISOString();
  } catch (error) {
    console.error('Error formatting ISO date:', error);
    return 'Error formatting date';
  }
}

/**
 * Check if a date is within a specified range
 * @param date Date to check
 * @param startDate Start of range
 * @param endDate End of range
 * @param inclusive Whether to include the start and end dates in the range check
 * @returns True if date is within range, false otherwise
 */
export function isDateInRange(
  date: string | number | Date,
  startDate: string | number | Date,
  endDate: string | number | Date,
  inclusive: boolean = true
): boolean {
  try {
    const d = date instanceof Date ? date : new Date(date);
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(d.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date(s) for range check:', { date, startDate, endDate });
      return false;
    }
    
    if (inclusive) {
      return d >= start && d <= end;
    } else {
      return d > start && d < end;
    }
  } catch (error) {
    console.error('Error checking if date is in range:', error);
    return false;
  }
}
