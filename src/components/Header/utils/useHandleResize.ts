import { Dispatch, SetStateAction, useEffect } from 'react';

const useHandleResize = (setIsMenuOpen: Dispatch<SetStateAction<boolean>>) => {
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 848) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMenuOpen]);
};

export default useHandleResize;
