import React from 'react';

import ScrollArrowButton from '../../../../assets/chevron_arrow.png';
import './ScrollButton.css';

interface ScrollButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ direction, onClick }) => {
  return (
    <button className={`scroll-button ${direction}`} onClick={onClick}>
      <img className="scroll-arrow-button" src={ScrollArrowButton} />
    </button>
  );
};

export default ScrollButton;
