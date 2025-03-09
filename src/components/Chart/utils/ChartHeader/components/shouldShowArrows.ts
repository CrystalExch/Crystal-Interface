export const shouldShowArrows = (
  container: HTMLDivElement,
): { showLeftArrow: boolean; showRightArrow: boolean } => {
  const { scrollLeft, scrollWidth, clientWidth } = container;
  return {
    showLeftArrow: scrollLeft > 0,
    showRightArrow: scrollLeft < scrollWidth - clientWidth,
  };
};
