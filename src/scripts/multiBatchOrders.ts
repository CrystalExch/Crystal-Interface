import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const multiBatchOrders = (
  address: `0x${string}`,
  value: bigint,
  batches: any,
  referrer: `0x${string}`,
) => {
  return {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'multiBatchOrders',
        args: [batches, referrer],
      }),
      value: value,
    }
  }

export default multiBatchOrders;
