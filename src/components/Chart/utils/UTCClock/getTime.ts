export const getTime = (): string => {
  const now = new Date();
  const localString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  });
  const timeZoneOffset = `UTC`;
  return `${localString} ${timeZoneOffset}`;
};
