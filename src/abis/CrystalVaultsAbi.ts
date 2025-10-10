export const CrystalVaultsAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_crystal",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_gov",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_weth",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_defaultQuoteMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_defaultBaseMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_maxOrderCap",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_lockup",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "Closed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "newDecrease",
          "type": "bool"
        }
      ],
      "name": "DecreaseOnWithdrawChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quoteAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "baseAmount",
          "type": "uint256"
        }
      ],
      "name": "Deposit",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "Locked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "lockup",
          "type": "uint256"
        }
      ],
      "name": "LockupChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "maxShares",
          "type": "uint256"
        }
      ],
      "name": "MaxSharesChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "Unlocked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "quoteAsset",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "baseAsset",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "maxShares",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "lockup",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "decreaseOnWithdraw",
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
          "indexed": false,
          "internalType": "struct ICrystalVault.VaultMetaData",
          "name": "metadata",
          "type": "tuple"
        }
      ],
      "name": "VaultDeployed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quoteAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "baseAmount",
          "type": "uint256"
        }
      ],
      "name": "Withdraw",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "allVaults",
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
      "inputs": [],
      "name": "allVaultsLength",
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
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBase",
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
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "newDecrease",
          "type": "bool"
        }
      ],
      "name": "changeDecreaseOnWithdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newGov",
          "type": "address"
        }
      ],
      "name": "changeGov",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "uint40",
          "name": "newLockup",
          "type": "uint40"
        }
      ],
      "name": "changeLockup",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
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
          "internalType": "uint256",
          "name": "newLockup",
          "type": "uint256"
        }
      ],
      "name": "changeMaxLockup",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newCap",
          "type": "uint256"
        }
      ],
      "name": "changeMaxOrderCap",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "newMaxShares",
          "type": "uint256"
        }
      ],
      "name": "changeMaxShares",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "uint16",
          "name": "newCap",
          "type": "uint16"
        }
      ],
      "name": "changeOrderCap",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "newMinSize",
          "type": "uint256"
        }
      ],
      "name": "changeTokenMinSize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "claimFees",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "userId",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        }
      ],
      "name": "clearCloidSlots",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "close",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBase",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "crystal",
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
      "inputs": [],
      "name": "defaultBaseMin",
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
      "inputs": [],
      "name": "defaultQuoteMin",
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
          "internalType": "uint256",
          "name": "amountQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBase",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "maxShares",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lockup",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "decreaseOnWithdraw",
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
      "name": "deploy",
      "outputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
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
          "internalType": "uint256",
          "name": "amountQuoteDesired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBaseDesired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountQuoteMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBaseMin",
          "type": "uint256"
        }
      ],
      "name": "deposit",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBase",
          "type": "uint256"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "eth",
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
      "name": "getVault",
      "outputs": [
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
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "lock",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "maxLockup",
      "outputs": [
        {
          "internalType": "uint40",
          "name": "",
          "type": "uint40"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "maxOrderCap",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
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
      "name": "minSize",
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
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amountQuoteDesired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBaseDesired",
          "type": "uint256"
        }
      ],
      "name": "previewDeposit",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBase",
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
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        }
      ],
      "name": "previewWithdrawal",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBase",
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
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "unlock",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "weth",
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
          "name": "vault",
          "type": "address"
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
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountQuoteMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBaseMin",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBase",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getBalances",
      "outputs": [
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
          "name": "availableBalanceQuote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "availableBalanceBase",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
  ] as const;