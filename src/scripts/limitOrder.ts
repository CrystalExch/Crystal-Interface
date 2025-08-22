import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const limitOrder = (
  address: `0x${string}`,
  value: bigint,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  price: bigint,
  size: bigint,
  deadline: bigint,
) => {
  return {
      target: address,
      data: encodeFunctionData({
        abi: CrystalRouterAbi,
        functionName: 'placeLimitOrder',
        args: [tokenIn, tokenOut, price, size, deadline],
      }),
      value: value,
    }
  }

export default limitOrder;
