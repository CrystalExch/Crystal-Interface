export const CrystalLending = 
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "accountId",
				"type": "uint256"
			}
		],
		"name": "borrow",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "supplyToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "supplyCollateral",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "borrowToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "borrowAmount",
				"type": "uint256"
			}
		],
		"name": "flash",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bool",
				"name": "isIncrease",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getAccountHealth",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "solvency",
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
				"name": "token",
				"type": "address"
			}
		],
		"name": "getInterestRate",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "supplyRate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "borrowRate",
				"type": "uint256"
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
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "accountId",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "repaymentTokens",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "repaymentAmounts",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "collateralToClaim",
				"type": "address[]"
			}
		],
		"name": "liquidate",
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
				"internalType": "address",
				"name": "oracle",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "CrystalMarket",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isQuoteToken",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "oraclePriceFactor",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxBorrowLTV",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "liquidationLTV",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "liquidationBonus",
				"type": "uint256"
			}
		],
		"name": "listToken",
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
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "accountId",
				"type": "uint256"
			}
		],
		"name": "repay",
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
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "accountId",
				"type": "uint256"
			}
		],
		"name": "supply",
		"outputs": [],
		"stateMutability": "nonpayable",
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
		"name": "tokens",
		"outputs": [
			{
				"internalType": "address",
				"name": "oracle",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "CrystalMarket",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isQuoteToken",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "scaleFactor",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxBorrowLTV",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "liquidationLTV",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "liquidationBonus",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "currentRate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalSupplied",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBorrowed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "supplyIndex",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "borrowIndex",
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
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "oracle",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "CrystalMarket",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isQuoteToken",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "oraclePriceFactor",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxBorrowLTV",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "liquidationLTV",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "liquidationBonus",
				"type": "uint256"
			}
		],
		"name": "updateParams",
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
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "accountId",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
] as const;
