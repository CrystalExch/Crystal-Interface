export interface Position {
  id: string;
  wallet: string;
  token: string;
  balance: number;
  percentage: number;
  bought: {
    amount: number;
    usd: number;
    percentage: number;
  };
  sold: {
    amount: number;
    usd: number;
    percentage: number;
  };
  pnl: {
    amount: number;
    percentage: number;
  };
  remaining: {
    amount: number;
    percentage: number;
  };
  tags: string[];
}

export interface Order {
  id: string;
  token: string;
  type: 'Buy' | 'Sell';
  amount: number;
  currentMC: number;
  targetMC: number;
  settings: string;
  action: string;
}

export interface Holder {
  id: string;
  wallet: string;
  balance: number;
  percentage: number;
  tags: string[];
}

export interface TopTrader {
  id: string;
  wallet: string;
  solBalance: number;
  bought: {
    amount: number;
    usd: number;
    percentage: number;
  };
  sold: {
    amount: number;
    usd: number;
    percentage: number;
  };
  pnl: {
    amount: number;
    percentage: number;
  };
  remaining: {
    amount: number;
    percentage: number;
  };
  tags: string[];
}

interface DevToken {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  price: number;
  marketCap: number;
  timestamp: number;
}


export const mockPositions: Position[] = [
];

export const mockOrders: Order[] = [

];

export const mockHolders: Holder[] = [
];

export const mockTopTraders: TopTrader[] = []

export const mockDevTokens: DevToken[] = []