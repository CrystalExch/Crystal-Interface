import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const limitOrder = async (
  sendUserOperation: any,
  address: `0x${string}`,
  value: bigint,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  price: bigint,
  size: bigint,
) =>
  sendUserOperation({
    uo: {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'limitOrder',
        args: [tokenIn, tokenOut, price, size],
      }),
      value: value,
    },
  })

export default limitOrder;
