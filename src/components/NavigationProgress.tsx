import React, { useEffect, useRef, useState } from 'react';

import './NavigationProgress.css';

interface NavigationProgressProps {
  location: any;
}

const NavigationProgress: React.FC<NavigationProgressProps> = ({
  location,
}) => {
  const [isComplete, setIsComplete] = useState(true);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const cleanPath = (path: string) => path.split('?')[0];
    const isTradeRoute = (path: string) =>
      ['swap', 'limit', 'send', 'scale', 'market'].includes(path.split('/')[1]);

    const currentPath = cleanPath(location.pathname);
    const prevPath = cleanPath(prevPathRef.current);

    if (
      !((isTradeRoute(currentPath) && isTradeRoute(prevPath)) && !(currentPath.split('/')[1] == 'swap' && prevPath.split('/')[1] == 'market') && !(currentPath.split('/')[1] == 'market' && prevPath.split('/')[1] == 'swap')) &&
      currentPath !== prevPath
    ) {
      setIsComplete(false);
      setTimeout(() => {
        setIsComplete(true);
      }, 400);
    }

    prevPathRef.current = location.pathname;
  }, [location]);

  return (
    <div className="navigation-progress">
      <div
        className={`navigation-progress__bar ${isComplete ? 'complete' : ''}`}
      />
    </div>
  );
};

export default NavigationProgress;
