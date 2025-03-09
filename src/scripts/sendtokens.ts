import { writeContract } from '@wagmi/core';
import { TokenAbi } from '../abis/TokenAbi';
import { config } from '../wagmi';

const sendtokens = async (x: `0x${string}`, y: `0x${string}`, z: bigint) =>
  writeContract(config, {
    abi: TokenAbi,
    address: x,
    functionName: 'transfer',
    args: [y, z],
  });

export default sendtokens;
