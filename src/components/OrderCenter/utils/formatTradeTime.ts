export const formatTradeTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};
