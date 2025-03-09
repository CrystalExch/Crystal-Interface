import { writeContract } from '@wagmi/core';
import { TokenAbi } from '../abis/TokenAbi';
import { config } from '../wagmi';

const approve = async (x: `0x${string}`, y: `0x${string}`, z: bigint) =>
  writeContract(config, {
    abi: TokenAbi,
    address: x,
    functionName: 'approve',
    args: [y, z],
  });

export default approve;
