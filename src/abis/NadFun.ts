export const NadFunAbi = [
  {
    "type": "function",
    "name": "buy",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDexRouter.BuyParams",
        "components": [
          {
            "name": "amountOutMin",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "to",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "amountOut",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "calculateFeeAmount",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "feeAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "exactOutBuy",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDexRouter.ExactOutBuyParams",
        "components": [
          {
            "name": "amountInMax",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountOut",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "to",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "amountIn",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "exactOutSell",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDexRouter.ExactOutSellParams",
        "components": [
          {
            "name": "amountInMax",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountOut",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "to",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "amountIn",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "exactOutSellPermit",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDexRouter.ExactOutSellPermitParams",
        "components": [
          {
            "name": "amountInMax",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountOut",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountAllowance",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "to",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "v",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "r",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "s",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "amountIn",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "routerFee",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint24",
        "internalType": "uint24"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "sell",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDexRouter.SellParams",
        "components": [
          {
            "name": "amountIn",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountOutMin",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "to",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "amountOut",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "sellPermit",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDexRouter.SellPermitParams",
        "components": [
          {
            "name": "amountIn",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountOutMin",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountAllowance",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "to",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "v",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "r",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "s",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "amountOut",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "DexRouterBuy",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amountIn",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amountOut",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DexRouterSell",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amountIn",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amountOut",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "function",
    "name": "authorize",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "buy",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDexRouter.BuyParams",
        "components": [
          { 
            "name": "amountOutMin", 
            "type": "uint256", 
            "internalType": "uint256" 
          }, { 
            "name": "token", 
            "type": "address", 
            "internalType": "address" 
          }, { 
            "name": "to", 
            "type": "address", 
            "internalType": "address" 
          }, { 
            "name": "deadline", 
            "type": "uint256", 
            "internalType": "uint256" 
          }
        ]
      }
    ],
    "outputs": [{ "name": "amountOut", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "calculateFeeAmount",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "feeAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "config",
    "inputs": [],
    "outputs": [
      {
        "name": "virtualMonReserve",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "virtualTokenReserve",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "targetTokenAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "create",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IBondingCurve.TokenCreationParams",
        "components": [
          {
            "name": "creator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "symbol",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "tokenURI",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "pool",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "curves",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "realMonReserve",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "realTokenReserve",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "virtualMonReserve",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "virtualTokenReserve",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "k",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "targetTokenAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "initVirtualMonReserve",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "initVirtualTokenReserve",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "factory",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feeConfig",
    "inputs": [],
    "outputs": [
      {
        "name": "deployFeeAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "listingFeeAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "protocolFee",
        "type": "uint24",
        "internalType": "uint24"
      },
      {
        "name": "dexFee",
        "type": "uint24",
        "internalType": "uint24"
      },
      {
        "name": "treasuryFee",
        "type": "uint24",
        "internalType": "uint24"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct IBondingCurve.Config",
        "components": [
          {
            "name": "virtualMonReserve",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "virtualTokenReserve",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "targetTokenAmount",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "feeConfig",
        "type": "tuple",
        "internalType": "struct IBondingCurve.FeeConfig",
        "components": [
          {
            "name": "deployFeeAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "listingFeeAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "protocolFee",
            "type": "uint24",
            "internalType": "uint24"
          },
          {
            "name": "dexFee",
            "type": "uint24",
            "internalType": "uint24"
          },
          {
            "name": "treasuryFee",
            "type": "uint24",
            "internalType": "uint24"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isListed",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isLocked",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "listing",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "lpManager",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "sell",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amountOut",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "splitAmountAndFee",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "isBuy",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "fee",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "vault",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "wMon",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "wMonReserve",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "error",
    "name": "ExpiredDeadLine",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientInput",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientOutput",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAmountIn",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAmountOut",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCallback",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Unauthorized",
    "inputs": []
  }
] as const;