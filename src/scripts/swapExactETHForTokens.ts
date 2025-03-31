import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const swapExactETHForTokens = (
  address: `0x${string}`,
  amountIn: bigint,
  amountOutMin: bigint,
  path: `0x${string}`[],
  to: `0x${string}`,
  deadline: bigint,
  ref: `0x${string}`,
) => {
  return {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'swapExactETHForTokens',
        args: [amountOutMin, path, to, deadline, ref],
      }),
      value: amountIn,
    }
  }

export default swapExactETHForTokens;
