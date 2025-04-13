import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { settings } from '../../../settings.ts';
import './SwapIcon.css';

interface SwapIconProps {
  tokenaddress: string;
  setTokenIn: (address: string) => void;
  setTokenOut: (address: string) => void;
  setpopup: (value: number) => void;
}

const SwapIcon: React.FC<SwapIconProps> = ({
  tokenaddress,
  setTokenIn,
  setTokenOut,
  setpopup,
}) => {
  const navigate = useNavigate();
  const hoverRef = useRef<HTMLDivElement>(null);
  
  return (
    <div
      className="swap-icon"
      ref={hoverRef}
      onClick={() => {
        navigate(`/swap`);
        setTokenIn(
          tokenaddress === settings.chainConfig[activechain].usdc
            ? settings.chainConfig[activechain].eth
            : settings.chainConfig[activechain].usdc,
        );
        setTokenOut(tokenaddress);
        setpopup(0);
      }}
    >
      Swap
    </div>
  );
};

export default SwapIcon;