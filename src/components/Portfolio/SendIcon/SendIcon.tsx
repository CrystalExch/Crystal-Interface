import React, { useRef } from 'react';
import './SendIcon.css';

interface SendIconProps {
  tokenaddress: string;
  setSendTokenIn: any;
  setpopup: any;
}

const SendIcon: React.FC<SendIconProps> = ({
  tokenaddress,
  setSendTokenIn,
  setpopup,
}) => {
  const hoverRef = useRef<HTMLDivElement>(null);
  
  return (
    <div
      className="send-icon"
      ref={hoverRef}
      onClick={() => {
        setSendTokenIn(tokenaddress);
        setpopup(3);
      }}
    >
      {t('send')}
    </div>
  );
};

export default SendIcon;