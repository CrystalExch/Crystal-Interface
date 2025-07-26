import { TokenAbi } from '../abis/TokenAbi';
import { encodeFunctionData } from 'viem';

const unwrapeth = (amount: bigint, weth: `0x${string}`) => {
  return {
    target: weth,
    data: encodeFunctionData({
      abi: TokenAbi,
      functionName: 'withdraw',
      args: [amount],
    }),
    value: 0n,
  }
}

export default unwrapeth;
