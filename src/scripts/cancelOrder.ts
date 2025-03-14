import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const cancelOrder = async (
  sendUserOperation: any,
  address: `0x${string}`,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  price: bigint,
  id: bigint,
) =>
  sendUserOperation({
    uo: {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'cancelOrder',
        args: [tokenIn, tokenOut, price, id],
      }),
      value: 0n,
    },
  })

export default cancelOrder;
