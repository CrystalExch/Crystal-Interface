import { writeContract } from '@wagmi/core';
import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { config } from '../wagmi';

const swapTokensForExactTokens = async (
  address: `0x${string}`,
  amountOut: bigint,
  amountInMax: bigint,
  path: `0x${string}`[],
  to: `0x${string}`,
  deadline: bigint,
  ref: `0x${string}`,
) =>
  writeContract(config, {
    abi: CrystalRouterAbi,
    address: address,
    functionName: 'swapTokensForExactTokens',
    args: [amountOut, amountInMax, path, to, deadline, ref],
  });

export default swapTokensForExactTokens;
