import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

import { getChain } from "@account-kit/core";
import { settings } from '../settings.ts';
import { alchemyconfig } from '../config';

type sharedContextType = {
  activechain: number;
  setactivechain: any;
  favorites: string[];
  toggleFavorite: (tokenAddress: string) => void;
  high: number;
  setHigh: React.Dispatch<React.SetStateAction<number>>;
  low: number;
  setLow: React.Dispatch<React.SetStateAction<number>>;
  days: number;
  setDays: React.Dispatch<React.SetStateAction<number>>;
  percentage: number;
  setPercentage: React.Dispatch<React.SetStateAction<number>>;
  timeRange: string;
  setTimeRange: React.Dispatch<React.SetStateAction<string>>;
};

const sharedContext = createContext<sharedContextType | undefined>(undefined);

export const useSharedContext = (): sharedContextType => {
  const context = useContext(sharedContext);
  if (!context) {
    throw new Error('useSharedContext must be used within a PortfolioProvider');
  }
  return context;
};

export const SharedContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<string[]>(
    (() => {
      try {
        const favoritesKey = `crystal_favorites`;
        const storedFavorites = localStorage.getItem(favoritesKey);
        const parsedFavorites = storedFavorites
          ? JSON.parse(storedFavorites)
          : [];
        return Array.isArray(parsedFavorites) ? parsedFavorites : [];
      } catch (error) {
        return [];
      }
    })(),
  );
  
  const [high, setHigh] = useState<number>(0);
  const [low, setLow] = useState<number>(0);
  const [days, setDays] = useState<number>(1);
  const [percentage, setPercentage] = useState<number>(0.0);
  const [timeRange, setTimeRange] = useState<string>('24H');
  const [activechain, setactivechain] = useState<number>(getChain(alchemyconfig).id);

  const toggleFavorite = useCallback((tokenAddress: string) => {
    if (!tokenAddress) return;

    setFavorites((prevFavorites) => {
      try {
        let newFavorites;
        if (
          tokenAddress.toLowerCase() ==
          settings.chainConfig[activechain].eth.toLowerCase()
        ) {
          newFavorites = prevFavorites.includes(tokenAddress)
            ? prevFavorites.filter(
                (addr) =>
                  addr !== tokenAddress &&
                  addr !== settings.chainConfig[activechain].weth.toLowerCase(),
              )
            : [
                ...prevFavorites,
                tokenAddress,
                settings.chainConfig[activechain].weth.toLowerCase(),
              ];
        } else if (
          tokenAddress.toLowerCase() ==
          settings.chainConfig[activechain].weth.toLowerCase()
        ) {
          newFavorites = prevFavorites.includes(tokenAddress)
            ? prevFavorites.filter(
                (addr) =>
                  addr !== tokenAddress &&
                  addr !== settings.chainConfig[activechain].eth.toLowerCase(),
              )
            : [
                ...prevFavorites,
                tokenAddress,
                settings.chainConfig[activechain].eth.toLowerCase(),
              ];
        } else {
          newFavorites = prevFavorites.includes(tokenAddress)
            ? prevFavorites.filter((addr) => addr !== tokenAddress)
            : [...prevFavorites, tokenAddress];
        }
        const favoritesKey = `crystal_favorites`;
        localStorage.setItem(favoritesKey, JSON.stringify(newFavorites));

        window.dispatchEvent(
          new CustomEvent('favoritesUpdated', {
            detail: { favorites: newFavorites },
          }),
        );

        return newFavorites;
      } catch (error) {
        return prevFavorites;
      }
    });
  }, []);

  return (
    <sharedContext.Provider
      value={{
        activechain,
        setactivechain,
        favorites,
        toggleFavorite,
        high,
        setHigh,
        low,
        setLow,
        days,
        setDays,
        percentage,
        setPercentage,
        timeRange,
        setTimeRange,
      }}
    >
      {children}
    </sharedContext.Provider>
  );
};

export default SharedContextProvider;
