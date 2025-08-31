export const CrystalDataHelperAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_gov",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "RefCodeAlreadyTaken",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "market",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isAdd",
        "type": "bool"
      }
    ],
    "name": "MarketChange",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "referrer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "referee",
        "type": "address"
      }
    ],
    "name": "Referral",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "addressToRefCode",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "addressToReferrer",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "tokens",
        "type": "address[]"
      }
    ],
    "name": "batchBalanceOf",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "returnData",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "account",
        "type": "address[]"
      },
      {
        "internalType": "address[][]",
        "name": "tokens",
        "type": "address[][]"
      }
    ],
    "name": "batchBatchBalanceOf",
    "outputs": [
      {
        "internalType": "uint256[][]",
        "name": "returnData",
        "type": "uint256[][]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "market",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isAdd",
        "type": "bool"
      }
    ],
    "name": "changeMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "crystal",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "tokens",
        "type": "address[]"
      }
    ],
    "name": "getClaimableRewards",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "crystal",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "market",
        "type": "address"
      }
    ],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_highestBid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_lowestAsk",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "crystal",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "markets",
        "type": "address[]"
      }
    ],
    "name": "getPrices",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "mids",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "highestBids",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "lowestAsks",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getRefInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "referrer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "usedRefCode",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "refCode",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "vaultFactory",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "vaults",
        "type": "address[]"
      }
    ],
    "name": "getVaultsData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "quoteBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quoteDecimals",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseDecimals",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "userBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalShares",
            "type": "uint256"
          }
        ],
        "internalType": "struct CrystalReferralManager.VaultReturnData[]",
        "name": "vaultsreturn",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "vaultFactory",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "vaults",
        "type": "address[]"
      }
    ],
    "name": "getVaultsInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "quoteBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quoteDecimals",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseDecimals",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "quoteAsset",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "baseAsset",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxShares",
            "type": "uint256"
          },
          {
            "internalType": "uint40",
            "name": "lockup",
            "type": "uint40"
          },
          {
            "internalType": "bool",
            "name": "decreaseOnWithdraw",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "locked",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "closed",
            "type": "bool"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "name",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "description",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "social1",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "social2",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "social3",
                "type": "string"
              }
            ],
            "internalType": "struct ICrystalVault.VaultMetaData",
            "name": "metadata",
            "type": "tuple"
          }
        ],
        "internalType": "struct CrystalReferralManager.VaultReturnInfo[]",
        "name": "vaultsreturn",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gov",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "refCodeToAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "referrerToReferredAddressCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "code",
        "type": "string"
      }
    ],
    "name": "setReferral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "code",
        "type": "string"
      }
    ],
    "name": "setUsedRef",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
