export const formatDateAndTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date
    .toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/, \d{2}$/, '');
};
