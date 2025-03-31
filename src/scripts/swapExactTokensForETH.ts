import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const swapExactTokensForETH = (
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
      functionName: 'swapExactTokensForETH',
      args: [amountIn, amountOutMin, path, to, deadline, ref],
    }),
    value: 0n,
  }
}

export default swapExactTokensForETH;
