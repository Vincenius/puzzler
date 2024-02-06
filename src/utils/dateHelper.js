export const formatDate = date => date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const getBeginningOfWeek = () => {
  const date = new Date();
  const dayOfWeek = date.getDay() - 1; // 0 (Sunday) to 6 (Saturday)
  const beginningOfWeek = new Date(date); // Clone the date
  beginningOfWeek.setDate(beginningOfWeek.getDate() - dayOfWeek); // Move to the beginning of the current week
  return formatDate(beginningOfWeek);
}

// Function to get the end of the week
export const getEndOfWeek = () => {
  const date = new Date();
  const dayOfWeek = date.getDay() - 1; // 0 (Sunday) to 6 (Saturday)
  const endOfWeek = new Date(date); // Clone the date
  const daysUntilEndOfWeek = 6 - dayOfWeek; // Number of days until end of week
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilEndOfWeek); // Move to the end of the current week
  return formatDate(endOfWeek);
}

export const getMonthDate = () => {
  const date = new Date();
  const monthNames = [
      "Januar", "Februar", "März",
      "April", "Mai", "Juni", "Juli",
      "August", "September", "Oktober",
      "November", "Dezember"
  ];

  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${year}`;
}