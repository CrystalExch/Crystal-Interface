import { writeContract } from '@wagmi/core';
import { CrystalRouterAbi } from '../abis/CrystalRouterAbi';
import { config } from '../wagmi';

const swap = async (
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
) =>
  writeContract(config, {
    abi: CrystalRouterAbi,
    address: address,
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
    value: value,
  });

export default swap;
