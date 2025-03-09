import React, { useRef } from 'react';

import sendicon from '../../../assets/send_icon.png';
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
  const hoverRef = useRef<HTMLImageElement>(null);

  return (
    <img
      className="send-icon"
      ref={hoverRef}
      src={sendicon}
      onClick={() => {
        setSendTokenIn(tokenaddress);
        setpopup(3);
      }}
    />
  );
};

export default SendIcon;
