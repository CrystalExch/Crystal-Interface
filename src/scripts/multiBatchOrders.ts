import { writeContract } from '@wagmi/core';
import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { config } from '../wagmi';

const multiBatchOrders = async (
  address: `0x${string}`,
  value: bigint,
  markets: `0x${string}`[],
  action: bigint[][],
  price: bigint[][],
  param1: bigint[][],
  param2: `0x${string}`[][],
) =>
  writeContract(config, {
    abi: CrystalRouterAbi,
    address: address,
    functionName: 'multiBatchOrders',
    args: [markets, action, price, param1, param2],
    value: value,
  });

export default multiBatchOrders;
