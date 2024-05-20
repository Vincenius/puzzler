export const formatDate = date => date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const formatISODate = date => date.toISOString().split('T')[0];

export const getDayAfter = (date, amount = 1) => {
  const day = date
    ? new Date(date)
    : new Date()
  const dayAfter = new Date(day.getTime() + amount * 24 * 60 * 60 * 1000)
  return dayAfter;
}

export const getDayBefore = (date, amount = 1) => {
  const day = date
    ? new Date(date)
    : new Date()
  const dayBefore = new Date(day.getTime() - amount * 24 * 60 * 60 * 1000)
  return dayBefore;
}

export const getBeginningOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
}

export const getEndOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) + 6; // adjust when day is sunda
  return new Date(date.setDate(diff));
}

export const getFirstDayOfMonth = (date) => {
  const day = date
    ? new Date(date)
    : new Date()
  return new Date(day.getFullYear(), day.getMonth(), 2);
}

export const getLastDayOfMonth = (date) => {
  const day = date
    ? new Date(date)
    : new Date()
  return new Date(day.getFullYear(), day.getMonth() + 1, 1);
}

export const getMonthDate = (date) => {
  const day = new Date(date);
  const monthNames = [
      "Januar", "Februar", "März",
      "April", "Mai", "Juni", "Juli",
      "August", "September", "Oktober",
      "November", "Dezember"
  ];

  const month = monthNames[day.getMonth()];
  const year = day.getFullYear();

  return `${month} ${year}`;
}