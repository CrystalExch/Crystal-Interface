import React, { useState, useEffect, useRef } from 'react';
import './MemeTradesComponent.css';
import switchicon from '../../../assets/switch.svg';
import monadlogo from '../../../assets/monadlogo.svg';
import TraderPortfolioPopup from './TraderPortfolioPopup/TraderPortfolioPopup';

// Types
interface Trade {
    id: number;
    amount: number;
    mc: number;
    price: number;
    trader: string;
    fullAddress: string;
    age: number;
    tags: string[];
}

type AmountMode = 'USDC' | 'MON';
type MCMode = 'MC' | 'Price';
type TagType = 'Sniper' | 'Dev' | 'KOL' | 'Bundler' | 'Insider';

interface MemeTradesComponentProps {
    tokenList?: any[];
    marketsData?: any[];
    onMarketSelect?: (market: any) => void;
    setSendTokenIn?: (token: any) => void;
    setpopup?: (value: number) => void;
}

const MemeTradesComponent: React.FC<MemeTradesComponentProps> = ({
    tokenList = [],
    marketsData = [],
    onMarketSelect,
    setSendTokenIn,
    setpopup
}) => {
    const [amountMode, setAmountMode] = useState<AmountMode>('USDC');
    const [mcMode, setMcMode] = useState<MCMode>('MC');
    const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
    const [showTraderPopup, setShowTraderPopup] = useState(false);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const tradeIdRef = useRef(1);

    // Generate a single mock trade
    const generateSingleTrade = (): Trade => {
        const traderAddresses = [
            '0x16A6AD07571a73b1C043Db515EC29C4FCbbbBb5d',
            '0xe7D1f4AB222d94389b82981f99C58824fF42a7d0',
            '0xa909deCa1132ad02e6EC632b1deBc5e126e8C2E6',
            '0x2A7E9d84D955f8a882549815B1bbCC270a582a9e'
        ];
        const tags: TagType[] = ['Sniper', 'Dev', 'KOL', 'Bundler', 'Insider'];

        const shortenAddress = (address: string) => {
            return `${address.slice(0, 6)}`;
        };

        const isPositive = Math.random() > 0.4;
        const amount = isPositive
            ? Math.random() * 400 + 5
            : -(Math.random() * 80 + 1);

        const mc = Math.random() * 10 + 60;
        const price = Math.random() * 0.001 + 0.0001;
        const age = 0; // New trades start at 0 seconds

        const numTags = Math.floor(Math.random() * 3);
        const traderTags: string[] = [];
        if (numTags > 0) {
            const shuffled = [...tags].sort(() => 0.5 - Math.random());
            traderTags.push(...shuffled.slice(0, numTags));
        }

        const fullAddress = traderAddresses[Math.floor(Math.random() * traderAddresses.length)];

        return {
            id: tradeIdRef.current++,
            amount,
            mc,
            price,
            trader: shortenAddress(fullAddress),
            fullAddress,
            age,
            tags: traderTags
        };
    };

    // Generate initial trades
    const generateInitialTrades = (): Trade[] => {
        const initialTrades = [];
        for (let i = 0; i < 15; i++) {
            const trade = generateSingleTrade();
            trade.age = Math.floor(Math.random() * 30); // Random age for initial trades
            initialTrades.push(trade);
        }
        return initialTrades.sort((a, b) => a.age - b.age);
    };

    // Initialize trades
    useEffect(() => {
        setTrades(generateInitialTrades());
    }, []);

    // Age increment and new trade generation
    useEffect(() => {
        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                setTrades(prevTrades => {
                    let updatedTrades = prevTrades.map(trade => ({
                        ...trade,
                        age: trade.age + 1
                    }));

                    // Add new trade occasionally (30% chance every second)
                    if (Math.random() < 0.3) {
                        const newTrade = generateSingleTrade();
                        updatedTrades = [newTrade, ...updatedTrades];
                    }

                    // Keep only the latest 20 trades
                    return updatedTrades.slice(0, 20);
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPaused]);

    // Handle hover state
    const handleMouseEnter = () => {
        setIsHovering(true);
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        setIsPaused(false);
    };

    // Helper functions
    const formatAmount = (amount: number, mode: AmountMode): string => {
        if (mode === 'USDC') {
            return `$${Math.abs(amount).toFixed(2)}`;
        } else {
            const monAmount = Math.abs(amount) / 1.5;
            return `${monAmount.toFixed(1)}`;
        }
    };

    const formatMC = (mc: number, price: number, mode: MCMode): string => {
        if (mode === 'MC') {
            return `$${mc.toFixed(1)}K`;
        } else {
            return `$${price.toFixed(6)}`;
        }
    };

    const getTagIcon = (tag: string): JSX.Element | null => {
        const iconProps = {
            className: `meme-tag-icon ${tag.toLowerCase()}`,
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "currentColor"
        };

        switch (tag) {
            case 'Sniper':
                return (
                    <svg {...iconProps}>
                        <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                    </svg>
                );
            case 'Dev':
                return (
                    <svg {...iconProps}>
                        <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                    </svg>
                );
            case 'KOL':
                return (
                    <svg {...iconProps}>
                        <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                    </svg>
                );
            case 'Bundler':
                return (
                    <svg {...iconProps} viewBox="0 0 128 128">
                        <path d="M117 68.26l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0062 70v30a2 2 0 001 1.73l26 15a2 2 0 002 0l26-15a2 2 0 001-1.73V70A2 2 0 00117 68.26zm-27-11l22.46 13L90 82.7 68 70zM66 73.46L88 86.15v25.41L66 98.86zm26 38.1V86.18L114 74V98.85zM56 102.25l-16 8.82V86.72l17-10a2 2 0 10-2-3.44l-17 10L15.55 70.56 38 57.82l17 8.95a2 2 0 001.86-3.54l-18-9.46a2 2 0 00-1.92 0L11 68.53a2 2 0 00-1 1.74V99.73a2 2 0 001 1.74L37 116.2a2 2 0 002 0l19-10.46a2 2 0 10-1.92-3.5zm-42-28L36 86.74V111L14 98.56zM38 49a2 2 0 002-2V28.46L62 41.15V61a2 2 0 004 0V41.15L88 28.46V47a2 2 0 004 0V25a2 2 0 00-1-1.73l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0036 25V47A2 2 0 0038 49zM64 12.31L86 25 64 37.69 42 25z" />
                    </svg>
                );
            case 'Insider':
                return (
                    <svg {...iconProps} viewBox="0 0 32 32">
                        <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Event handlers
    const handleAmountModeToggle = (): void => {
        setAmountMode(prev => prev === 'USDC' ? 'MON' : 'USDC');
    };

    const handleMCModeToggle = (): void => {
        setMcMode(prev => prev === 'MC' ? 'Price' : 'MC');
    };

    const handleTraderClick = (trade: Trade): void => {
        setSelectedTrader(trade.fullAddress);
        setShowTraderPopup(true);
    };

    const handleClosePopup = (): void => {
        setShowTraderPopup(false);
        setSelectedTrader(null);
    };

    return (
        <>
            <div 
                className="meme-trades-container"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="meme-trades-header">
                    <div
                        className="meme-trades-header-item meme-trades-header-amount"
                        onClick={handleAmountModeToggle}
                    >
                        Amount
                        <svg fill="currentColor" className="meme-trades-dollar-sign" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="50px" height="50px">
                            <path d="M 24 4 C 12.972066 4 4 12.972074 4 24 C 4 35.027926 12.972066 44 24 44 C 35.027934 44 44 35.027926 44 24 C 44 12.972074 35.027934 4 24 4 z M 24 7 C 33.406615 7 41 14.593391 41 24 C 41 33.406609 33.406615 41 24 41 C 14.593385 41 7 33.406609 7 24 C 7 14.593391 14.593385 7 24 7 z M 23.476562 10.978516 A 1.50015 1.50015 0 0 0 22 12.5 L 22 13.652344 C 19.207791 14.038344 17 16.357587 17 19.25 C 17 22.407822 19.592178 25 22.75 25 L 24.75 25 C 26.562096 25 28 26.437904 28 28.25 C 28 30.062096 26.562096 31.5 24.75 31.5 L 22.5 31.5 C 21.322258 31.5 20.358942 30.70345 20.080078 29.632812 A 1.50015 1.50015 0 1 0 17.177734 30.388672 C 17.752415 32.595033 19.686351 34.197787 22 34.416016 L 22 35.5 A 1.50015 1.50015 0 1 0 25 35.5 L 25 34.449219 C 28.313006 34.309282 31 31.595439 31 28.25 C 31 24.816096 28.183904 22 24.75 22 L 22.75 22 C 21.213822 22 20 20.786178 20 19.25 C 20 17.713822 21.213822 16.5 22.75 16.5 L 23.253906 16.5 A 1.50015 1.50015 0 0 0 23.740234 16.5 L 24.5 16.5 C 25.669144 16.5 26.62787 17.286788 26.914062 18.345703 A 1.5002527 1.5002527 0 1 0 29.810547 17.5625 C 29.220588 15.379651 27.296986 13.800333 25 13.583984 L 25 12.5 A 1.50015 1.50015 0 0 0 23.476562 10.978516 z" />
                        </svg>        
                    </div>
                    <div
                        className="meme-trades-header-item meme-trades-header-mc"
                        onClick={handleMCModeToggle}
                    >
                        {mcMode}
                        <img src={switchicon} className="meme-header-switch-icon" alt="Switch Icon" />
                    </div>
                    <div className="meme-trades-header-item meme-trades-header-trader">
                        Trader
                    </div>
                    <div className="meme-trades-header-item meme-trades-header-age">
                        Age
                    </div>
                </div>

                <div className="meme-trades-list">
                    {trades.map((trade) => (
                        <div key={trade.id} className="meme-trade-row">
                            <div className={`meme-trade-amount ${trade.amount >= 0 ? 'positive' : 'negative'}`}>
                                {amountMode === 'MON' ? (
                                    <img src={monadlogo} alt="MON Logo" className="meme-trade-mon-logo" />
                                ) : null}
                                {formatAmount(trade.amount, amountMode)}
                            </div>
                            <div className="meme-trade-mc">
                                {formatMC(trade.mc, trade.price, mcMode)}
                            </div>
                            <div 
                                className="meme-trade-trader clickable"
                                onClick={() => handleTraderClick(trade)}
                                title={`Click to view ${trade.fullAddress} portfolio`}
                            >
                                {trade.trader}
                            </div>
                            <div className="meme-trade-age-container">
                                <div className="meme-trade-tags">
                                    {trade.tags.map((tag, index) => (
                                        <div key={index}>
                                            {getTagIcon(tag)}
                                        </div>
                                    ))}
                                </div>
                                <span className="meme-trade-age">{trade.age}s</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pause Indicator */}
                <div className={`pause-indicator ${isHovering ? 'visible' : ''}`}>
                    <div className="pause-content">
                        <span className="pause-text">Paused</span>
                    </div>
                </div>
            </div>

            {showTraderPopup && selectedTrader && (
                <TraderPortfolioPopup
                    traderAddress={selectedTrader}
                    onClose={handleClosePopup}
                    tokenList={tokenList}
                    marketsData={marketsData}
                    onMarketSelect={onMarketSelect}
                    setSendTokenIn={setSendTokenIn}
                    setpopup={setpopup}
                />
            )}
        </>
    );
};

export default MemeTradesComponent;