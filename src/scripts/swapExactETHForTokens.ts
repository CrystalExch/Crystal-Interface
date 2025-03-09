import { writeContract } from '@wagmi/core';
import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { config } from '../wagmi';

const swapExactETHForTokens = async (
  address: `0x${string}`,
  amountIn: bigint,
  amountOutMin: bigint,
  path: `0x${string}`[],
  to: `0x${string}`,
  deadline: bigint,
  ref: `0x${string}`,
) =>
  writeContract(config, {
    abi: CrystalRouterAbi,
    address: address,
    functionName: 'swapExactETHForTokens',
    args: [amountOutMin, path, to, deadline, ref],
    value: amountIn,
  });

export default swapExactETHForTokens;
