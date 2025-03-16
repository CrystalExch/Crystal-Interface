import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const swapTokensForExactTokens = async (
  sendUserOperation: any,
  address: `0x${string}`,
  amountOut: bigint,
  amountInMax: bigint,
  path: `0x${string}`[],
  to: `0x${string}`,
  deadline: bigint,
  ref: `0x${string}`,
) =>
  sendUserOperation({
    uo: {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'swapTokensForExactTokens',
        args: [amountOut, amountInMax, path, to, deadline, ref],
      }),
      value: 0n,
    },
  })

export default swapTokensForExactTokens;
