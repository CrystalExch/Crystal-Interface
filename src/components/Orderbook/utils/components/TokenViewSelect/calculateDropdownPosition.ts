export const calculateDropdownPosition = (
  selectorRef: React.RefObject<HTMLElement>,
) => {
  const rect = selectorRef.current?.getBoundingClientRect();

  return {
    top: `${rect?.bottom || 0}px`,
    left: `${rect?.left || 0}px`,
  };
};
