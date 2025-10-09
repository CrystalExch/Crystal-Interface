export interface PresetValues {
  slippage: string;
  priority: string;
}

export interface Presets {
  [key: number]: PresetValues;
}

const BUY_PRESETS_KEY = 'crystal_buy_presets';
const SELL_PRESETS_KEY = 'crystal_sell_presets';

const DEFAULT_BUY_PRESETS: Presets = {
  1: { slippage: '20', priority: '0.01' },
  2: { slippage: '15', priority: '0.005' },
  3: { slippage: '10', priority: '0.001' },
};

const DEFAULT_SELL_PRESETS: Presets = {
  1: { slippage: '15', priority: '0.005' },
  2: { slippage: '10', priority: '0.003' },
  3: { slippage: '5', priority: '0.001' },
};

export const loadBuyPresets = (): Presets => {
  try {
    const stored = localStorage.getItem(BUY_PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading buy presets:', error);
  }
  return DEFAULT_BUY_PRESETS;
};

export const loadSellPresets = (): Presets => {
  try {
    const stored = localStorage.getItem(SELL_PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading sell presets:', error);
  }
  return DEFAULT_SELL_PRESETS;
};

export const saveBuyPresets = (presets: Presets): void => {
  try {
    localStorage.setItem(BUY_PRESETS_KEY, JSON.stringify(presets));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('buyPresetsUpdated', { detail: presets }));
  } catch (error) {
    console.error('Error saving buy presets:', error);
  }
};

export const saveSellPresets = (presets: Presets): void => {
  try {
    localStorage.setItem(SELL_PRESETS_KEY, JSON.stringify(presets));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('sellPresetsUpdated', { detail: presets }));
  } catch (error) {
    console.error('Error saving sell presets:', error);
  }
};

export const updateBuyPreset = (presetNumber: number, values: PresetValues): void => {
  const presets = loadBuyPresets();
  presets[presetNumber] = values;
  saveBuyPresets(presets);
};

export const updateSellPreset = (presetNumber: number, values: PresetValues): void => {
  const presets = loadSellPresets();
  presets[presetNumber] = values;
  saveSellPresets(presets);
};