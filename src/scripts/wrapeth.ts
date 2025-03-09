import { writeContract } from '@wagmi/core';
import { TokenAbi } from '../abis/TokenAbi';
import { config } from '../wagmi';

const wrapeth = async (amount: bigint, weth: `0x${string}`) =>
  writeContract(config, {
    abi: TokenAbi,
    address: weth,
    functionName: 'deposit',
    value: amount,
  });

export default wrapeth;
