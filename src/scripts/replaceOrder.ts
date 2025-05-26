import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

const replaceOrder = (
  address: `0x${string}`,
  value: bigint,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  postOnly: boolean,
  price: bigint,
  id: bigint,
  newPrice: bigint,
  newSize: bigint,
  ref: `0x${string}`,
) => {
  return {
    target: address,
    data: encodeFunctionData({
      abi: CrystalRouterAbi,
      functionName: 'replaceOrder',
      args: [
        postOnly,
        tokenIn,
        tokenOut,
        price,
        id,
        newPrice,
        newSize,
        ref,
      ],
    }),
    value: value,
  }
};

export default replaceOrder;