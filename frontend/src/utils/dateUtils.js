/**
 * Formats an ISO date string into a localized, human-readable format.
 * Example: "Apr 2, 12:34 AM" or "Just now"
 */
export const formatLocalizedDate = (dateString) => {
  if (!dateString) return "Pending Intelligence";
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Basic relative time check
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "Just Now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  
  // Standard format: Apr 2, 12:34:56 AM (Local)
  return new Intl.DateTimeFormat(undefined, { 
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
};

/**
 * Formats a short date for charts or compact views
 * Example: "12:34 AM" (if today) or "02 Apr"
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short'
  }).format(date);
};
