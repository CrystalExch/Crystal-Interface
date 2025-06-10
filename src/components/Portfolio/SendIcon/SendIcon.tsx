import React from 'react';
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
  
  return (
    <div
      className="send-icon"
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