import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const swap = (
  address: `0x${string}`,
  value: bigint,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  exactInput: boolean,
  orderType: bigint,
  size: bigint,
  worstPrice: bigint,
  deadline: bigint,
  ref: `0x${string}`,
) => {
  return {
    target: address,
    data: encodeFunctionData({
      abi: CrystalRouterAbi,
      functionName: 'swap',
      args: [
        exactInput,
        tokenIn,
        tokenOut,
        orderType,
        size,
        worstPrice,
        deadline,
        ref,
      ],
    }),
    value: value,
  }
};

export default swap;
