export const shouldShowArrows = (
  container: HTMLDivElement,
): { showLeftArrow: boolean; showRightArrow: boolean } => {
  const { scrollLeft, scrollWidth, clientWidth } = container;
  
  const isScrollable = scrollWidth > clientWidth;
  
  const showLeftArrow = scrollLeft > 0;
  
  const isAtRightEdge = scrollWidth - scrollLeft - clientWidth <= 1;
  const showRightArrow = isScrollable && !isAtRightEdge;
  
  return {
    showLeftArrow,
    showRightArrow,
  };
};