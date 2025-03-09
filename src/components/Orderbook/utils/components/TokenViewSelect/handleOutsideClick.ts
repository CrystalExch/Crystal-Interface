export const handleOutsideClick = (
  event: MouseEvent,
  refs: Array<React.RefObject<HTMLElement>>,
  callback: () => void,
) => {
  if (
    refs.every(
      (ref) => ref.current && !ref.current.contains(event.target as Node),
    )
  ) {
    callback();
  }
};
