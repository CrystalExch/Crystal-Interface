export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};
