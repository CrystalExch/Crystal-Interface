import { writeContract } from '@wagmi/core';
import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { config } from '../wagmi';

const cancelOrder = async (
  address: `0x${string}`,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  price: bigint,
  id: bigint,
) =>
  writeContract(config, {
    abi: CrystalRouterAbi,
    address: address,
    functionName: 'cancelOrder',
    args: [tokenIn, tokenOut, price, id],
  });

export default cancelOrder;
