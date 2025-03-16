import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const multiBatchOrders = async (
  sendUserOperation: any,
  address: `0x${string}`,
  value: bigint,
  markets: `0x${string}`[],
  action: bigint[][],
  price: bigint[][],
  param1: bigint[][],
  param2: `0x${string}`[][],
) =>
  sendUserOperation({
    uo: {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'multiBatchOrders',
        args: [markets, action, price, param1, param2],
      }),
      value: value,
    },
  })

export default multiBatchOrders;
