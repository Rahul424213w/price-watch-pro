/**
 * Formats an ISO date string into a localized, human-readable format.
 * Example: "Apr 2, 12:34 AM" or "Just now"
 */
export const formatLocalizedDate = (dateStringOrMs) => {
  if (!dateStringOrMs) return "Pending Intelligence";
  
  const date = new Date(dateStringOrMs);
  const now = new Date();
  
  // Basic relative time check
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "Just Now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  
  // Force IST (Asia/Kolkata)
  return new Intl.DateTimeFormat('en-IN', { 
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);
};

/**
 * Formats a short date for charts or compact views
 * Examples: "12:34 AM" (if today) or "02 Apr 12:34 AM" (if not today)
 */
export const formatShortDate = (dateStringOrMs) => {
  if (!dateStringOrMs) return "";
  const date = new Date(dateStringOrMs);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);
};

/**
 * Formats a date for the 'Live' view in charts (Time only, high precision)
 * Day-aware: Shows the date if not today.
 */
export const formatLiveDate = (dateStringOrMs) => {
  if (!dateStringOrMs) return "";
  const date = new Date(dateStringOrMs);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);

  if (isToday) return timePart;

  const datePart = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(date);

  return `${datePart} ${timePart}`;
};

/**
 * Formats a date for the 'Historical' view in charts (Date only)
 */
export const formatHistoricalDate = (dateStringOrMs) => {
  if (!dateStringOrMs) return "";
  const date = new Date(dateStringOrMs);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(date);
};
