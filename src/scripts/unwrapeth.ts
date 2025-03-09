import { writeContract } from '@wagmi/core';
import { TokenAbi } from '../abis/TokenAbi';
import { config } from '../wagmi';

const unwrapeth = async (amount: bigint, weth: `0x${string}`) =>
  writeContract(config, {
    abi: TokenAbi,
    address: weth,
    functionName: 'withdraw',
    args: [amount],
  });

export default unwrapeth;
