export const scrollContainer = (
  container: HTMLDivElement,
  direction: 'left' | 'right',
  amount: number,
) => {
  const newScrollLeft =
    direction === 'left'
      ? container.scrollLeft - amount
      : container.scrollLeft + amount;
  container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
};
