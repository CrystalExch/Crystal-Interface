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
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "vault",
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
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "baseAsset",
				"type": "address"
			}
		],
		"name": "VaultDeployed",
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
			}
		],
		"name": "close",
		"outputs": [],
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
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
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
		"name": "maxOrderCap",
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
			},
			{
				"internalType": "uint256",
				"name": "_maxShares",
				"type": "uint256"
			}
		],
		"name": "setMaxShares",
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
		"name": "unlock",
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
		"stateMutability": "payable",
		"type": "function"
	}
] as const;