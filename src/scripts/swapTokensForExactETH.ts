import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const swapTokensForExactETH = (
  address: `0x${string}`,
  amountOut: bigint,
  amountInMax: bigint,
  path: `0x${string}`[],
  to: `0x${string}`,
  deadline: bigint,
  ref: `0x${string}`,
) => {
  return {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'swapTokensForExactETH',
        args: [amountOut, amountInMax, path, to, deadline, ref],
      }),
      value: 0n,
    }
  }

export default swapTokensForExactETH;
