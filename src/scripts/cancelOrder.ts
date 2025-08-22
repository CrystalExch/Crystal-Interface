import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const cancelOrder = async (
  sendUserOperation: any,
  address: `0x${string}`,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  price: bigint,
  id: bigint,
  deadline: bigint,
) =>
  sendUserOperation({
    uo: {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'cancelLimitOrder',
        args: [tokenIn, tokenOut, price, id, deadline],
      }),
      value: 0n,
    },
  })

export default cancelOrder;
