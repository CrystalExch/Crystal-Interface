export const CrystalRouterAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ActionFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "SlippageExceeded",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amounts",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "info",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "filled",
				"type": "bytes"
			}
		],
		"name": "OrdersFilled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "orderData",
				"type": "bytes"
			}
		],
		"name": "OrdersUpdated",
		"type": "event"
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
				"internalType": "uint256",
				"name": "maxPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "gov",
				"type": "address"
			}
		],
		"name": "ParamsChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
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
		"name": "RewardsClaimed",
		"type": "event"
	},
	{
		"stateMutability": "nonpayable",
		"type": "fallback"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "accumulatedFeeBase",
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
		"name": "accumulatedFeeQuote",
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
		"name": "addressToUserId",
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
		"name": "baseAsset",
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
				"internalType": "uint256[]",
				"name": "actions",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "prices",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "param1",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "param2",
				"type": "address[]"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "batchOrders",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "returnData",
				"type": "uint256[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256[]",
				"name": "actions",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "prices",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "param1",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "param2",
				"type": "address[]"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "batchOrdersRequireSuccess",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "returnData",
				"type": "uint256[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "cancelOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newFee",
				"type": "uint256"
			}
		],
		"name": "changeFee",
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
				"internalType": "uint256",
				"name": "newMaxPrice",
				"type": "uint256"
			}
		],
		"name": "changeMaxPrice",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "caller",
				"type": "address"
			}
		],
		"name": "claimFees",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "quoteAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "baseAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fee",
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
				"internalType": "bool",
				"name": "isAscending",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "startPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "distance",
				"type": "uint256"
			}
		],
		"name": "getPriceLevels",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "distance",
				"type": "uint256"
			}
		],
		"name": "getPriceLevelsFromMid",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "_highestBid",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_lowestAsk",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bool",
				"name": "isBuy",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isExactInput",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "worstPrice",
				"type": "uint256"
			}
		],
		"name": "getQuote",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amountIn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountOut",
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
		"inputs": [],
		"name": "highestBid",
		"outputs": [
			{
				"internalType": "uint80",
				"name": "",
				"type": "uint80"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "latestUserId",
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
				"internalType": "bool",
				"name": "isBuy",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "limitOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lowestAsk",
		"outputs": [
			{
				"internalType": "uint80",
				"name": "",
				"type": "uint80"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bool",
				"name": "isBuy",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isExactInput",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isFromCaller",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isToCaller",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "orderType",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "worstPrice",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "marketOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amountIn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountOut",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "maxPrice",
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
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "orders",
		"outputs": [
			{
				"internalType": "uint40",
				"name": "owner",
				"type": "uint40"
			},
			{
				"internalType": "uint128",
				"name": "size",
				"type": "uint128"
			},
			{
				"internalType": "uint40",
				"name": "fillBefore",
				"type": "uint40"
			},
			{
				"internalType": "uint40",
				"name": "fillAfter",
				"type": "uint40"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "priceLevels",
		"outputs": [
			{
				"internalType": "uint128",
				"name": "size",
				"type": "uint128"
			},
			{
				"internalType": "uint40",
				"name": "fillNext",
				"type": "uint40"
			},
			{
				"internalType": "uint40",
				"name": "latest",
				"type": "uint40"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "quoteAsset",
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
				"name": "caller",
				"type": "address"
			}
		],
		"name": "registerUser",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "_latestUserId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "router",
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
		"name": "scaleFactor",
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
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userIdToAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const;
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gov",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_weth",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "AccountLimitReached",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ActionFailed",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "caller",
				"type": "address"
			}
		],
		"name": "Unauthorized",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
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
				"indexed": false,
				"internalType": "address",
				"name": "prev",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "gov",
				"type": "address"
			}
		],
		"name": "GovChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "quoteAsset",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "baseAsset",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "market",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "marketId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "marketType",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "scaleFactor",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tickSize",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "minSize",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint24",
				"name": "takerFee",
				"type": "uint24"
			},
			{
				"indexed": false,
				"internalType": "uint24",
				"name": "makerRebate",
				"type": "uint24"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "feeCommission",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "feeRebate",
				"type": "uint8"
			}
		],
		"name": "MarketCreated",
		"type": "event"
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
				"internalType": "uint256",
				"name": "minSize",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint24",
				"name": "takerFee",
				"type": "uint24"
			},
			{
				"indexed": false,
				"internalType": "uint24",
				"name": "makerRebate",
				"type": "uint24"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "feeCommission",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "feeRebate",
				"type": "uint8"
			}
		],
		"name": "MarketParamsChanged",
		"type": "event"
	},
	{
		"anonymous": true,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "market",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fillInfo",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fillAmount",
				"type": "uint256"
			}
		],
		"name": "OrderFilled",
		"type": "event"
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
				"indexed": true,
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "orderData",
				"type": "bytes"
			}
		],
		"name": "OrdersUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address[]",
				"name": "tokens",
				"type": "address[]"
			},
			{
				"indexed": false,
				"internalType": "uint256[]",
				"name": "amounts",
				"type": "uint256[]"
			}
		],
		"name": "RewardsClaimed",
		"type": "event"
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
				"indexed": true,
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountIn",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountOut",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "startPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "endPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isBuy",
				"type": "bool"
			}
		],
		"name": "Trade",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bool",
				"name": "isMargin",
				"type": "bool"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			}
		],
		"name": "UserRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Withdraw",
		"type": "event"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "addressToUserId",
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
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "adminCancelAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "adminDeleteMarket",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "allMarkets",
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
		"name": "allMarketsLength",
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
				"name": "market",
				"type": "address"
			},
			{
				"components": [
					{
						"internalType": "bool",
						"name": "requireSuccess",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "action",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "param1",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "param2",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "param3",
						"type": "uint256"
					}
				],
				"internalType": "struct Crystal.Action[]",
				"name": "actions",
				"type": "tuple[]"
			},
			{
				"internalType": "uint256",
				"name": "options",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "batchOrders",
		"outputs": [],
		"stateMutability": "nonpayable",
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
				"internalType": "uint256",
				"name": "options",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "cancelOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			}
		],
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
				"name": "market",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "newMinSize",
				"type": "uint256"
			},
			{
				"internalType": "uint24",
				"name": "newTakerFee",
				"type": "uint24"
			},
			{
				"internalType": "uint24",
				"name": "newMakerRebate",
				"type": "uint24"
			},
			{
				"internalType": "uint8",
				"name": "newFeeCommission",
				"type": "uint8"
			},
			{
				"internalType": "uint8",
				"name": "newFeeRebate",
				"type": "uint8"
			}
		],
		"name": "changeMarketParams",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "tokens",
				"type": "address[]"
			}
		],
		"name": "claimFees",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "amounts",
				"type": "uint256[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "claimableRewards",
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
				"internalType": "bool",
				"name": "canonical",
				"type": "bool"
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
				"name": "marketType",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "scaleFactor",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tickSize",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minSize",
				"type": "uint256"
			},
			{
				"internalType": "uint24",
				"name": "takerFee",
				"type": "uint24"
			},
			{
				"internalType": "uint24",
				"name": "makerRebate",
				"type": "uint24"
			},
			{
				"internalType": "uint8",
				"name": "feeCommission",
				"type": "uint8"
			},
			{
				"internalType": "uint8",
				"name": "feeRebate",
				"type": "uint8"
			}
		],
		"name": "deploy",
		"outputs": [
			{
				"internalType": "address",
				"name": "market",
				"type": "address"
			}
		],
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
			}
		],
		"name": "deposit",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
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
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "range",
				"type": "uint256"
			}
		],
		"name": "getAllOrdersByCloid",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "cloids",
				"type": "uint256[]"
			},
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "marketId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "price",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "size",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "orderType",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "userId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fillBefore",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fillAfter",
						"type": "uint256"
					}
				],
				"internalType": "struct Crystal.OrderByCloid[]",
				"name": "userOrders",
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
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "asset",
				"type": "address"
			}
		],
		"name": "getDepositedBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "availableBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lockedBalance",
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
				"name": "market",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "distance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "precision",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "max",
				"type": "uint256"
			}
		],
		"name": "getDisplayPriceLevelsFromMid",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "highestBid",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lowestAsk",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
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
		"name": "getMarket",
		"outputs": [
			{
				"internalType": "uint80",
				"name": "highestBid",
				"type": "uint80"
			},
			{
				"internalType": "uint80",
				"name": "lowestAsk",
				"type": "uint80"
			},
			{
				"internalType": "uint32",
				"name": "minSize",
				"type": "uint32"
			},
			{
				"internalType": "uint24",
				"name": "takerFee",
				"type": "uint24"
			},
			{
				"internalType": "uint24",
				"name": "makerRebate",
				"type": "uint24"
			},
			{
				"internalType": "uint8",
				"name": "feeCommission",
				"type": "uint8"
			},
			{
				"internalType": "uint8",
				"name": "feeRebate",
				"type": "uint8"
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
				"name": "marketId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "scaleFactor",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tickSize",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxPrice",
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
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "getMarketByTokens",
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
				"name": "market",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getOrder",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "size",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "orderType",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "userId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fillBefore",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fillAfter",
						"type": "uint256"
					}
				],
				"internalType": "struct Crystal.Order",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "cloid",
				"type": "uint256"
			}
		],
		"name": "getOrderByCloid",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "marketId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "price",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "size",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "orderType",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "userId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fillBefore",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fillAfter",
						"type": "uint256"
					}
				],
				"internalType": "struct Crystal.OrderByCloid",
				"name": "",
				"type": "tuple"
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
				"name": "highestBid",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lowestAsk",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
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
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "getPriceLevel",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "size",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "latestNativeId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "latest",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fillNext",
						"type": "uint256"
					}
				],
				"internalType": "struct Crystal.PriceLevel",
				"name": "",
				"type": "tuple"
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
				"name": "isAscending",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "startPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "distance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "max",
				"type": "uint256"
			}
		],
		"name": "getPriceLevels",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "nonpayable",
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
				"internalType": "uint256",
				"name": "distance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "max",
				"type": "uint256"
			}
		],
		"name": "getPriceLevelsFromMid",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "highestBid",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lowestAsk",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			},
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "nonpayable",
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
				"name": "isBuy",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isExactInput",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "requireCompleteFill",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "worstPrice",
				"type": "uint256"
			}
		],
		"name": "getQuote",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amountIn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountOut",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
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
		"inputs": [],
		"name": "latestUserId",
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
				"name": "market",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isBuy",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "options",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			}
		],
		"name": "limitOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
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
		"name": "marginAccounts",
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
				"name": "market",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isBuy",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isExactInput",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "options",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "worstPrice",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "marketOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amountIn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountOut",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
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
		"name": "marketToMarketId",
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
		"name": "parameters",
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
				"internalType": "uint256",
				"name": "marketId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "scaleFactor",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tickSize",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxPrice",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "registerNewMarginAccount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "registerUser",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "userId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
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
				"internalType": "uint256",
				"name": "options",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "newPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "replaceOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userIdToAddress",
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
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
] as const;
