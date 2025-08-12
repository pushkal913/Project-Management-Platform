/**
 * Returns the progress percentage based on task status
 * @param {string} status - The task status
 * @returns {number} Progress percentage (0-100)
 */
export const getTaskProgress = (status) => {
  const statusProgressMap = {
    'todo': 0,
    'in-progress': 35,
    'review': 60,
    'testing': 80,
    'done': 100
  };
  
  return statusProgressMap[status] || 0;
};

/**
 * Returns the color for the progress bar based on the status
 * @param {string} status - The task status
 * @returns {string} Color string
 */
export const getProgressColor = (status) => {
  const colorMap = {
    'todo': '#ef4444',        // red-500
    'in-progress': '#f59e0b', // amber-500
    'review': '#3b82f6',      // blue-500
    'testing': '#8b5cf6',     // violet-500
    'done': '#10b981'         // emerald-500
  };
  
  return colorMap[status] || '#9ca3af'; // gray-400
};
