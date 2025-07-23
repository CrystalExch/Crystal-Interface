import React, { useState, useRef, useCallback, useEffect } from 'react';
import './QuickBuyWidget.css';
import monadicon from '../../../assets/monadlogo.svg';
import settings from '../../../assets/settings.svg';
import closebutton from '../../../assets/close_button.png';
import squares from '../../../assets/squares.svg';
import editicon from '../../../assets/edit.svg';
import switchicon from '../../../assets/switch.svg';

import { Check } from 'lucide-react';

interface QuickBuyWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    tokenSymbol?: string;
    tokenName?: string;
}

const QuickBuyWidget: React.FC<QuickBuyWidgetProps> = ({ 
    isOpen, 
    onClose, 
    tokenSymbol = "TOKEN", 
    tokenName = "Token Name" 
}) => {
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [selectedBuyAmount, setSelectedBuyAmount] = useState('1');
    const [selectedSellPercent, setSelectedSellPercent] = useState('25%');
    const [isEditMode, setIsEditMode] = useState(false);
    const [sellMode, setSellMode] = useState<'percent' | 'mon'>('percent');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [buyAmounts, setBuyAmounts] = useState(['1', '5', '10', '50']);
    const [sellPercents, setSellPercents] = useState(['10%', '25%', '50%', '100%']);
    const [sellMONAmounts, setSellMONAmounts] = useState(['1', '5', '10', '25']);
    
    const widgetRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!widgetRef.current || isEditMode) return;
        
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || 
            target.tagName === 'IMG' || 
            target.closest('button') || 
            target.closest('.quickbuy-edit-icon') ||
            target.closest('.quickbuy-settings-icon') ||
            target.closest('.close-btn')) {
            return;
        }
        
        const rect = widgetRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
        e.preventDefault();
    }, [isEditMode]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - 300;
        const maxY = window.innerHeight - 235;
        
        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    }, [isDragging, dragOffset]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        if (editingIndex !== null && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingIndex]);

    const handleEditToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); 
        setIsEditMode(!isEditMode);
        setEditingIndex(null);
        setTempValue('');
    }, [isEditMode]);

    const handleSellModeToggle = useCallback(() => {
        setSellMode(sellMode === 'percent' ? 'mon' : 'percent');
    }, [sellMode]);

    const handleBuyButtonClick = useCallback((amount: string, index: number) => {
        if (isEditMode) {
            setEditingIndex(index);
            setTempValue(amount);
        } else {
            setSelectedBuyAmount(amount);
        }
    }, [isEditMode]);

    const handleSellButtonClick = useCallback((value: string, index: number) => {
        if (isEditMode) {
            setEditingIndex(index + 100);
            setTempValue(sellMode === 'percent' ? value.replace('%', '') : value);
        } else {
            setSelectedSellPercent(value);
        }
    }, [isEditMode, sellMode]);

    const handleInputSubmit = useCallback(() => {
        if (editingIndex === null || tempValue.trim() === '') return;

        if (editingIndex < 100) {
            const newBuyAmounts = [...buyAmounts];
            newBuyAmounts[editingIndex] = tempValue;
            setBuyAmounts(newBuyAmounts);
        } else {
            const sellIndex = editingIndex - 100;
            if (sellMode === 'percent') {
                const newSellPercents = [...sellPercents];
                newSellPercents[sellIndex] = `${tempValue}%`;
                setSellPercents(newSellPercents);
            } else {
                const newSellMONAmounts = [...sellMONAmounts];
                newSellMONAmounts[sellIndex] = tempValue;
                setSellMONAmounts(newSellMONAmounts);
            }
        }

        setEditingIndex(null);
        setTempValue('');
    }, [editingIndex, tempValue, buyAmounts, sellPercents, sellMONAmounts, sellMode]);

    const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleInputSubmit();
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
            setTempValue('');
        }
    }, [handleInputSubmit]);

    const currentSellValues = sellMode === 'percent' ? sellPercents : sellMONAmounts;

    if (!isOpen) return null;

    return (
        <div
            ref={widgetRef}
            className={`quickbuy-widget ${isDragging ? 'dragging' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <div 
                className="quickbuy-header"
                onMouseDown={handleMouseDown}
            >
                <div className="quickbuy-controls">
                    <img 
                        src={editicon} 
                        alt="Edit" 
                        className={`quickbuy-edit-icon ${isEditMode ? 'active' : ''}`}
                        onClick={handleEditToggle}
                    />
                    <div className="quickbuy-controls-right-side">
                        <img src={settings} alt="Settings" className="quickbuy-settings-icon" />
                        <button className="close-btn" onClick={onClose}>
                            <img className="quickbuy-close-icon" src={closebutton} alt="Close" />
                        </button>
                    </div>
                </div>
                <div className="quickbuy-drag-handle">
                    <img src={squares} alt="Squares" className="quickbuy-squares-icon" />
                    <img src={squares} alt="Squares" className="quickbuy-squares-icon" />
                </div>
            </div>

            <div className="quickbuy-content">
                <div className="buy-section">
                    <div className="section-header">
                        <span>Buy</span>
                        <div className="quickbuy-order-indicator">
                            <img className="quickbuy-monad-icon" src={monadicon} alt="Order Indicator" /> 0
                        </div>
                    </div>
                    
                    <div className="amount-buttons">
                        {buyAmounts.map((amount, index) => (
                            <div key={index} className="button-container">
                                {editingIndex === index ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        onBlur={handleInputSubmit}
                                        className="edit-input"
                                    />
                                ) : (
                                    <button
                                        className={`amount-btn ${isEditMode ? 'edit-mode' : ''} ${selectedBuyAmount === amount ? 'active' : ''}`}
                                        onClick={() => handleBuyButtonClick(amount, index)}
                                    >
                                        {amount}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sell-section">
                    <div className="section-header">
                        <div className="sell-header-left">
                            <span>Sell </span>
                            <span className="quickbuy-percent">
                                {sellMode === 'percent' ? '%' : 'MON'}
                            </span>
                            <button 
                                className="sell-mode-toggle"
                                onClick={handleSellModeToggle}
                                title={`Switch to ${sellMode === 'percent' ? 'MON' : '%'} mode`}
                            >
                                <img className="quickbuy-switch-icon" src={switchicon} alt="Switch" />
                            </button>
                        </div>
                        <div className="quickbuy-order-indicator">
                            <img className="quickbuy-monad-icon" src={monadicon} alt="Order Indicator" /> 0
                        </div>
                    </div>
                    
                    <div className="percent-buttons">
                        {currentSellValues.map((value, index) => (
                            <div key={index} className="button-container">
                                {editingIndex === index + 100 ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        onBlur={handleInputSubmit}
                                        className="edit-input"
                                    />
                                ) : (
                                    <button
                                        className={`percent-btn ${isEditMode ? 'edit-mode' : ''} ${selectedSellPercent === value ? 'active' : ''}`}
                                        onClick={() => handleSellButtonClick(value, index)}
                                    >
                                        {value}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="quickbuy-portfolio-section">
                    <div className="quickbuy-portfolio-item">
                        <span className="value green">$0</span>
                    </div>
                    <div className="quickbuy-portfolio-item">
                        <span className="value red">$0</span>
                    </div>
                    <div className="quickbuy-portfolio-item">
                        <span className="value">$0</span>
                    </div>
                    <div className="quickbuy-portfolio-item">
                        <span className="value green">+$0(+0%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickBuyWidget;