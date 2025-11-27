export const zeroXActionsAbi = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "BALANCERV3",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "BALANCERV3_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pool",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "offset",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "BASIC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint80",
				"name": "poolInfo",
				"type": "uint80"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "CURVE_TRICRYPTO_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pool",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "quoteForBase",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "DODOV1",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pool",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "quoteForBase",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "DODOV2",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "EKUBO",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "EKUBO_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pool",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "zeroForOne",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "EULERSWAP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "buyGem",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "psm",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "dai",
				"type": "address"
			}
		],
		"name": "MAKERPSM",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pool",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "tokenAIn",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "MAVERICKV2",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "salt",
				"type": "bytes32"
			},
			{
				"internalType": "bool",
				"name": "tokenAIn",
				"type": "bool"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "MAVERICKV2_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "METATXN_BALANCERV3_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint80",
				"name": "poolInfo",
				"type": "uint80"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "METATXN_CURVE_TRICRYPTO_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "METATXN_EKUBO_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "salt",
				"type": "bytes32"
			},
			{
				"internalType": "bool",
				"name": "tokenAIn",
				"type": "bool"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "METATXN_MAVERICKV2_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "METATXN_PANCAKE_INFINITY_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "makerPermit",
				"type": "tuple"
			},
			{
				"internalType": "address",
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "makerSig",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "takerPermit",
				"type": "tuple"
			}
		],
		"name": "METATXN_RFQ_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			}
		],
		"name": "METATXN_TRANSFER_FROM",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "path",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "METATXN_UNISWAPV3_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "METATXN_UNISWAPV4_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "msgValue",
				"type": "uint256"
			}
		],
		"name": "NATIVE_CHECK",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "PANCAKE_INFINITY",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "PANCAKE_INFINITY_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "expectedAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxBps",
				"type": "uint256"
			}
		],
		"name": "POSITIVE_SLIPPAGE",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "address",
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "makerSig",
				"type": "bytes"
			},
			{
				"internalType": "address",
				"name": "takerToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "maxTakerAmount",
				"type": "uint256"
			}
		],
		"name": "RFQ",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "makerPermit",
				"type": "tuple"
			},
			{
				"internalType": "address",
				"name": "maker",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "makerSig",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "takerPermit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "takerSig",
				"type": "bytes"
			}
		],
		"name": "RFQ_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			}
		],
		"name": "TRANSFER_FROM",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pool",
				"type": "address"
			},
			{
				"internalType": "uint24",
				"name": "swapInfo",
				"type": "uint24"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "UNISWAPV2",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "path",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "UNISWAPV3",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "path",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "UNISWAPV3_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellToken",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "UNISWAPV4",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "feeOnTransfer",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "hashMul",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hashMod",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "fills",
				"type": "bytes"
			},
			{
				"components": [
					{
						"components": [
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
						"internalType": "struct ISignatureTransfer.TokenPermissions",
						"name": "permitted",
						"type": "tuple"
					},
					{
						"internalType": "uint256",
						"name": "nonce",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					}
				],
				"internalType": "struct ISignatureTransfer.PermitTransferFrom",
				"name": "permit",
				"type": "tuple"
			},
			{
				"internalType": "bytes",
				"name": "sig",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "amountOutMin",
				"type": "uint256"
			}
		],
		"name": "UNISWAPV4_VIP",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "bps",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pool",
				"type": "address"
			},
			{
				"internalType": "uint24",
				"name": "swapInfo",
				"type": "uint24"
			},
			{
				"internalType": "uint256",
				"name": "minBuyAmount",
				"type": "uint256"
			}
		],
		"name": "VELODROME",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs":[
		  {"internalType":"address","name":"operator","type":"address"},
		  {"internalType":"address","name":"token","type":"address"},
		  {"internalType":"uint256","name":"amount","type":"uint256"},
		  {"internalType":"address payable","name":"target","type":"address"},
		  {"internalType":"bytes","name":"data","type":"bytes"}
		],
		"name":"exec",
		"outputs":[{"internalType":"bytes","name":"result","type":"bytes"}],
		"stateMutability":"payable",
		"type":"function"
	  },
	  {
		"inputs":[
			{"internalType":"address","name":"token","type":"address"},
		  {"internalType":"address","name":"token","type":"address"},
		  {"internalType":"address","name":"owner","type":"address"},
		  {"internalType":"address","name":"recipient","type":"address"},
		  {"internalType":"uint256","name":"amount","type":"uint256"}
		],
		"name":"transferFrom",
		"outputs":[{"internalType":"bool","name":"","type":"bool"}],
		"stateMutability":"nonpayable",
		"type":"function"
	  },
	  {
		"inputs": [
		  { "internalType": "address", "name": "allowanceHolder", "type": "address" },
		  { "internalType": "address", "name": "from", "type": "address" },
		  { "internalType": "address", "name": "lens", "type": "address" },
		  { "internalType": "uint256", "name": "amountInMax", "type": "uint256" },
		  { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
		  { "internalType": "address", "name": "token", "type": "address" },
		  { "internalType": "address", "name": "to", "type": "address" },
		  { "internalType": "uint256", "name": "deadline", "type": "uint256" }
		],
		"name": "nadFunExactOutSell",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	  }
	  
] as const;