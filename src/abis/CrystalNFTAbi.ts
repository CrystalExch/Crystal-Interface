export const CrystalNFTAbi = [
  {
    inputs: [],
    name: 'merkleRoot',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "hasMinted",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address",   name: "user",  type: "address"   },
      { internalType: "bytes32[]", name: "proof", type: "bytes32[]" }
    ],
    name: "checkWhitelist",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32[]", name: "proof", type: "bytes32[]" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
