export const CrystalDataHelperAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
    ],
    name: 'batchBalanceOf',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'returnData',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: 'orderData',
        type: 'uint256[]',
      },
      {
        internalType: 'address[]',
        name: 'markets',
        type: 'address[]',
      },
    ],
    name: 'getOrderSizes',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'sizes',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'market',
        type: 'address',
      },
    ],
    name: 'getPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_highestBid',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_lowestAsk',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'markets',
        type: 'address[]',
      },
    ],
    name: 'getPrices',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'mids',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: 'highestBids',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: 'lowestAsks',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
