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

export interface DevToken {
  id: string;
  token: string;
  supply: string;
  holders: number;
  marketCap: number;
  tags: string[];
}

// Generate random EVM wallet address in format: 0x + first 6 + ... + last 4
const generateWallet = () => {
  const chars = '0123456789abcdef';
  let fullAddress = '0x';

  // Generate 40 hex characters for a full EVM address
  for (let i = 0; i < 40; i++) {
    fullAddress += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Return in format: 0x + first 6 + ... + last 4
  return fullAddress.slice(0, 8) + '...' + fullAddress.slice(-4);
};

// Generate random tags - only using tags that match MemeInterface
const generateTags = () => {
  const allTags = ['Sniper', 'Dev', 'KOL', 'Bundler', 'Insider'];
  const numTags = Math.floor(Math.random() * 3) + 1;
  const shuffled = allTags.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTags);
};

// Generate positions data
export const mockPositions: Position[] = [
  {
    id: '2',
    wallet: '0x16A6AD07571a73b1C043Db515EC29C4FCbbbBb5d',
    token: '0x742d35...c8f4',
    balance: 0.005,
    percentage: 0,
    bought: { amount: 0, usd: 0, percentage: 0 },
    sold: { amount: 0, usd: 0, percentage: 0 },
    pnl: { amount: -58.09, percentage: 0 },
    remaining: { amount: 98.64, percentage: 1.000 },
    tags: ['Dev']
  },
  {
    id: '3',
    wallet: '0x16A6AD07571a73b1C043Db515EC29C4FCbbbBb5d',
    token: '0x1a2b3c...9d8e',
    balance: 10.92,
    percentage: 0,
    bought: { amount: 17.61, usd: 5.64, percentage: 0 },
    sold: { amount: 3.44, usd: 5.25, percentage: 0 },
    pnl: { amount: -13.44, percentage: 0 },
    remaining: { amount: 0, percentage: 0 },
    tags: ['Sniper']
  },
  {
    id: '4',
    wallet: '0x9f8e7d...2a1b',
    token: '0x9f8e7d...2a1b',
    balance: 9.716,
    percentage: 0,
    bought: { amount: 99.86, usd: 5.33, percentage: 0 },
    sold: { amount: 103.3, usd: 5.51, percentage: 0 },
    pnl: { amount: 3.422, percentage: 0 },
    remaining: { amount: 0, percentage: 0 },
    tags: ['KOL', 'Insider']
  }
];

// Generate orders data
export const mockOrders: Order[] = [
  {
    id: '1',
    token: 'MEME',
    type: 'Buy',
    amount: 1000,
    currentMC: 50000,
    targetMC: 75000,
    settings: 'Standard',
    action: 'Cancel'
  },
  {
    id: '2',
    token: 'PEPE',
    type: 'Sell',
    amount: 500,
    currentMC: 25000,
    targetMC: 20000,
    settings: 'Fast',
    action: 'Edit'
  }
];

// Generate holders data
export const mockHolders: Holder[] = Array.from({ length: 50 }, (_, i) => {
  const balance = Math.random() * 10000000;
  const percentage = Math.random() * 15;
  return {
    id: (i + 1).toString(),
    wallet: generateWallet(),
    balance,
    percentage,
    tags: generateTags()
  };
}).sort((a, b) => b.percentage - a.percentage);

// Generate top traders data
export const mockTopTraders: TopTrader[] = Array.from({ length: 30 }, (_, i) => {
  const boughtUSD = Math.random() * 50000 + 1000;
  const soldUSD = Math.random() * 60000 + 500;
  const pnlAmount = soldUSD - boughtUSD;
  const pnlPercentage = (pnlAmount / boughtUSD) * 100;

  return {
    id: (i + 1).toString(),
    wallet: generateWallet(),
    solBalance: Math.random() * 1000,
    bought: {
      amount: Math.random() * 1000000,
      usd: boughtUSD,
      percentage: Math.random() * 100
    },
    sold: {
      amount: Math.random() * 1000000,
      usd: soldUSD,
      percentage: Math.random() * 100
    },
    pnl: {
      amount: pnlAmount,
      percentage: pnlPercentage
    },
    remaining: {
      amount: Math.random() * 100,
      percentage: Math.random() * 100
    },
    tags: generateTags()
  };
}).sort((a, b) => b.pnl.amount - a.pnl.amount);

export const mockDevTokens: DevToken[] = Array.from({ length: 10 }, (_, i) => {
  const marketCap = Math.random() * 10000000 + 100000;
  return {
    id: (i + 1).toString(),
    token: `TOKEN${i + 1}`,
    supply: `${(Math.random() * 1000 + 10).toFixed(0)}M`,
    holders: Math.floor(Math.random() * 10000 + 100),
    marketCap,
    tags: generateTags()
  };
}).sort((a, b) => b.marketCap - a.marketCap);