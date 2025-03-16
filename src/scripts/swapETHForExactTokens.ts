import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const swapETHForExactTokens = async (
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
        functionName: 'swapETHForExactTokens',
        args: [amountOut, path, to, deadline, ref],
      }),
      value: amountInMax,
    },
  })

export default swapETHForExactTokens;
